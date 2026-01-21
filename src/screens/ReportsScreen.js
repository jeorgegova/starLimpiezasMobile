/**
 * Pantalla de Reportes para Star Limpiezas Mobile
 * Funcionalidades diferentes según el rol:
 * - Admin: Reportes de todos los servicios con filtros personalizables
 * - User: Reportes de sus propios servicios con filtros personalizables
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Share,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { Calendar } from 'react-native-calendars';
import { serviceService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import RNPrint from 'react-native-print';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const navigation = useNavigation();
  const {
    userName,
    userProfile,
    hasPermission,
    isAdmin,
    isUser
  } = useAuth();

  const initialEndDate = new Date();
  const initialStartDate = new Date();
  initialStartDate.setDate(initialEndDate.getDate() - 30);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedClient, setSelectedClient] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [reports, setReports] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetchServices();
    }
  }, [startDate, endDate, isLoaded]);

  const formatDateToString = (date) => {
    if (!date || isNaN(new Date(date))) return '01/01/1970';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadData = async () => {
    setIsLoaded(true);
  };

  const fetchServices = async () => {
    const filters = {
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
      user_id: isUser() ? userProfile?.id : ''
    };

    const { data, error } = await serviceService.getServicesByFilters(filters);

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los servicios');
      setReports([]);
    } else {
      const transformedReports = (data || []).map(service => ({
        id: service.id,
        fecha: formatDateToString(new Date(service.assigned_date)),
        servicio: service.service_name || 'Servicio',
        ubicacion: service.location?.location || 'Sin ubicación',
        telefono: service.phone || 'Sin teléfono',
        estado: getStatusDisplayName(service.status),
        cliente: service.user?.name || 'Sin asignar'
      }));
      setReports(transformedReports);
    }
  };

  const toggleStatusSelection = (status) => {
    setSelectedStatus(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const toggleClientSelection = (client) => {
    setSelectedClient(prev => {
      if (prev.includes(client)) {
        return prev.filter(c => c !== client);
      } else {
        return [...prev, client];
      }
    });
  };

  const toggleLocationSelection = (location) => {
    setSelectedLocation(prev => {
      if (prev.includes(location)) {
        return prev.filter(l => l !== location);
      } else {
        return [...prev, location];
      }
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(report.estado);
    const matchesClient = selectedClient.length === 0 || selectedClient.includes(report.cliente);
    const matchesLocation = selectedLocation.length === 0 || selectedLocation.includes(report.ubicacion);
    const matchesSearch = searchText === '' ||
      report.servicio.toLowerCase().includes(searchText.toLowerCase()) ||
      report.ubicacion.toLowerCase().includes(searchText.toLowerCase()) ||
      report.cliente.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesClient && matchesLocation && matchesSearch;
  });

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES');
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case DATABASE_CONFIG.serviceStatus.PENDING:
        return 'Pendiente';
      case DATABASE_CONFIG.serviceStatus.CONFIRMED:
        return 'Confirmado';
      case DATABASE_CONFIG.serviceStatus.CANCELLED:
        return 'Cancelado';
      case DATABASE_CONFIG.serviceStatus.COMPLETED:
        return 'Completado';
      default:
        return status;
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const calculateSummary = () => {
    const statusCounts = {};
    Object.values(DATABASE_CONFIG.serviceStatus).forEach(status => {
      statusCounts[status] = filteredReports.filter(r => r.estado === getStatusDisplayName(status)).length;
    });

    return {
      totalServices: filteredReports.length,
      pending: statusCounts[DATABASE_CONFIG.serviceStatus.PENDING] || 0,
      confirmed: statusCounts[DATABASE_CONFIG.serviceStatus.CONFIRMED] || 0,
      completed: statusCounts[DATABASE_CONFIG.serviceStatus.COMPLETED] || 0,
      cancelled: statusCounts[DATABASE_CONFIG.serviceStatus.CANCELLED] || 0,
    };
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedData = () => {
    const sortedData = [...filteredReports];
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };



  const exportToExcel = async () => {
    try {
      const headers = ['ID', 'Fecha', 'Servicio', 'Ubicación', 'Teléfono', 'Estado'];
      if (isAdmin()) headers.push('Cliente');

      const data = filteredReports.map(report => {
        const row = [report.id, report.fecha, report.servicio, report.ubicacion, report.telefono, report.estado];
        if (isAdmin()) row.push(report.cliente);
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const pathExcel = Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/Reportes`
        : `${RNFS.DownloadDirectoryPath}/Reportes`;

      const exists = await RNFS.exists(pathExcel);
      if (!exists) {
        await RNFS.mkdir(pathExcel);
      }

      const fileNameExcel = `reporteServicios_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePathExcel = `${pathExcel}/${fileNameExcel}`;

      await RNFS.writeFile(filePathExcel, wbout, 'base64');
      await Share.share({
        url: `file://${filePathExcel}`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        title: 'Abrir Excel',
      });
      // Optionally uncomment unlink if you want to delete after sharing
      // await RNFS.unlink(filePathExcel);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    try {
      const headers = ['ID', 'Fecha', 'Servicio', 'Ubicación', 'Teléfono', 'Estado'];
      if (isAdmin()) headers.push('Cliente');
      const data = filteredReports.map(report => {
        const row = [report.id, report.fecha, report.servicio, report.ubicacion, report.telefono, report.estado];
        if (isAdmin()) row.push(report.cliente);
        return row;
      });
      const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Reporte de Servicios</h1>
          <table>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
        </body>
      </html>
    `;
      await RNPrint.print({ html });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte PDF: ' + error.message);
    }
  };

  const handleExport = () => {
    setShowFormatModal(true);
  };

  // Cambiar exportToXML a exportToExcel en cualquier referencia

  const renderSummary = () => {
    const summary = calculateSummary();
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="list" size={16} color={modernTheme.colors.primary} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryNumber}>{summary.totalServices}</Text>
            <Text style={styles.summaryLabel}>Servicios</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="schedule" size={16} color={modernTheme.colors.warning} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryNumber}>{summary.pending}</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="check-circle" size={16} color={modernTheme.colors.success} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryNumber}>{summary.confirmed}</Text>
            <Text style={styles.summaryLabel}>Confirmados</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <MaterialIcons name="done" size={16} color={modernTheme.colors.primary} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryNumber}>{summary.completed}</Text>
            <Text style={styles.summaryLabel}>Completados</Text>
          </View>
        </View>
      </View>
    );
  };

  const columnWidths = isAdmin() ? [10, 12, 18, 15, 15, 12, 18] : [15, 12, 18, 15, 15, 25];
  const columnHeaders = isAdmin() ? ['ID', 'Fecha', 'Servicio', 'Ubicación', 'Teléfono', 'Estado', 'Cliente'] : ['ID', 'Fecha', 'Servicio', 'Ubicación', 'Teléfono', 'Estado'];
  const sortKeys = isAdmin() ? ['id', 'fecha', 'servicio', 'ubicacion', 'telefono', 'estado', 'cliente'] : ['id', 'fecha', 'servicio', 'ubicacion', 'telefono', 'estado'];
  const rowKeys = isAdmin() ? ['id', 'fecha', 'servicio', 'ubicacion', 'telefono', 'estado', 'cliente'] : ['id', 'fecha', 'servicio', 'ubicacion', 'telefono', 'estado'];

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {columnWidths.map((percentage, index) => (
        <TouchableOpacity key={index} style={[styles.headerCell, { width: (width * percentage / 100) * zoomLevel }]} onPress={() => handleSort(sortKeys[index])}>
          <Text style={[styles.headerText, { fontSize: 8 * zoomLevel }]}>{columnHeaders[index]}</Text>
          {sortConfig.key === sortKeys[index] && (
            <MaterialIcons name={sortConfig.direction === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={6 * zoomLevel} color={modernTheme.colors.text.inverse} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const uniqueClients = [...new Set(reports.map(r => r.cliente).filter(c => c && c !== 'Sin asignar'))];
  const uniqueLocations = [...new Set(reports.map(r => r.ubicacion).filter(l => l && l !== 'Sin ubicación'))];

  const renderFilterOptions = () => (
    <View style={styles.filterOptionsContainer}>
      <View style={styles.filterButtonsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.filterScrollView}>
          <View style={styles.filterButtonRow}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowStatusModal(true)}>
              <MaterialIcons name="filter-list" size={16} color={modernTheme.colors.primary} />
              <Text style={styles.filterButtonText}>
                {selectedStatus.length > 0 ? `${selectedStatus.length} estado(s)` : 'Estados'}
              </Text>
            </TouchableOpacity>
            {isAdmin() && (
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowClientModal(true)}>
                <MaterialIcons name="person" size={16} color={modernTheme.colors.primary} />
                <Text style={styles.filterButtonText}>
                  {selectedClient.length > 0 ? `${selectedClient.length} cliente(s)` : 'Clientes'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowLocationModal(true)}>
              <MaterialIcons name="location-on" size={16} color={modernTheme.colors.primary} />
              <Text style={styles.filterButtonText}>
                {selectedLocation.length > 0 ? `${selectedLocation.length} ubicación(es)` : 'Ubicaciones'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      {(selectedStatus.length > 0 || selectedClient.length > 0 || selectedLocation.length > 0) && (
        <View style={styles.excelFilterContainer}>
          <View style={styles.excelFilterHeader}>
            <MaterialIcons name="filter" size={16} color={modernTheme.colors.primary} />
            <Text style={styles.excelFilterTitle}>Filtros Seleccionados</Text>
          </View>
          <View style={styles.excelFilterContent}>
            <View style={styles.excelFilterValues}>
              {selectedStatus.map((status, index) => (
                <View key={`status-${index}`} style={styles.excelFilterTag}>
                  <Text style={styles.excelFilterTagText}>{status}</Text>
                  <TouchableOpacity onPress={() => toggleStatusSelection(status)} style={styles.excelFilterRemoveButton}>
                    <MaterialIcons name="close" size={12} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedClient.map((client, index) => (
                <View key={`client-${index}`} style={styles.excelFilterTag}>
                  <Text style={styles.excelFilterTagText}>{client}</Text>
                  <TouchableOpacity onPress={() => toggleClientSelection(client)} style={styles.excelFilterRemoveButton}>
                    <MaterialIcons name="close" size={12} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedLocation.map((location, index) => (
                <View key={`location-${index}`} style={styles.excelFilterTag}>
                  <Text style={styles.excelFilterTagText}>{location}</Text>
                  <TouchableOpacity onPress={() => toggleLocationSelection(location)} style={styles.excelFilterRemoveButton}>
                    <MaterialIcons name="close" size={12} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderStatusModal = () => (
    <Modal visible={showStatusModal} transparent={true} animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Estados</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <MaterialIcons name="close" size={24} color={modernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectedItemsContainer}>
            {selectedStatus.length > 0 && (
              <View style={styles.selectedItemsList}>
                {selectedStatus.map((status, index) => (
                  <View key={index} style={styles.selectedItemTag}>
                    <Text style={styles.selectedItemText}>{status}</Text>
                    <TouchableOpacity onPress={() => toggleStatusSelection(status)} style={styles.removeItemButton}>
                      <MaterialIcons name="close" size={14} color={modernTheme.colors.text.inverse} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          <ScrollView style={styles.modalList}>
            {Object.values(DATABASE_CONFIG.serviceStatus).map((status, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.modalItem, selectedStatus.includes(getStatusDisplayName(status)) && styles.selectedItem]}
                onPress={() => toggleStatusSelection(getStatusDisplayName(status))}
              >
                <Text style={styles.modalItemText}>{getStatusDisplayName(status)}</Text>
                {selectedStatus.includes(getStatusDisplayName(status)) && <MaterialIcons name="check" size={20} color={modernTheme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderClientModal = () => (
    <Modal visible={showClientModal} transparent={true} animationType="slide" onRequestClose={() => setShowClientModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Clientes</Text>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <MaterialIcons name="close" size={24} color={modernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectedItemsContainer}>
            {selectedClient.length > 0 && (
              <View style={styles.selectedItemsList}>
                {selectedClient.map((client, index) => (
                  <View key={index} style={styles.selectedItemTag}>
                    <Text style={styles.selectedItemText}>{client}</Text>
                    <TouchableOpacity onPress={() => toggleClientSelection(client)} style={styles.removeItemButton}>
                      <MaterialIcons name="close" size={14} color={modernTheme.colors.text.inverse} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          <ScrollView style={styles.modalList}>
            {uniqueClients.map((client, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.modalItem, selectedClient.includes(client) && styles.selectedItem]}
                onPress={() => toggleClientSelection(client)}
              >
                <Text style={styles.modalItemText}>{client}</Text>
                {selectedClient.includes(client) && <MaterialIcons name="check" size={20} color={modernTheme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal visible={showLocationModal} transparent={true} animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Ubicaciones</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <MaterialIcons name="close" size={24} color={modernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectedItemsContainer}>
            {selectedLocation.length > 0 && (
              <View style={styles.selectedItemsList}>
                {selectedLocation.map((location, index) => (
                  <View key={index} style={styles.selectedItemTag}>
                    <Text style={styles.selectedItemText}>{location}</Text>
                    <TouchableOpacity onPress={() => toggleLocationSelection(location)} style={styles.removeItemButton}>
                      <MaterialIcons name="close" size={14} color={modernTheme.colors.text.inverse} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          <ScrollView style={styles.modalList}>
            {uniqueLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.modalItem, selectedLocation.includes(location) && styles.selectedItem]}
                onPress={() => toggleLocationSelection(location)}
              >
                <Text style={styles.modalItemText}>{location}</Text>
                {selectedLocation.includes(location) && <MaterialIcons name="check" size={20} color={modernTheme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderFormatModal = () => (
    <Modal visible={showFormatModal} transparent={true} animationType="slide" onRequestClose={() => setShowFormatModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Formato de Exportación</Text>
            <TouchableOpacity onPress={() => setShowFormatModal(false)}>
              <MaterialIcons name="close" size={24} color={modernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalList}>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setShowFormatModal(false); exportToExcel(); }}>
              <Text style={styles.modalItemText}>Exportar como Excel</Text>
              <MaterialIcons name="table-chart" size={20} color={modernTheme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setShowFormatModal(false); exportToPDF(); }}>
              <Text style={styles.modalItemText}>Exportar como PDF</Text>
              <MaterialIcons name="picture-as-pdf" size={20} color={modernTheme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTableRow = ({ item }) => (
    <View style={styles.tableRow}>
      {columnWidths.map((percentage, index) => (
        <View key={index} style={[styles.cell, { width: (width * percentage / 100) * zoomLevel }]}>
          <Text style={[styles.cellText, { fontSize: 8 * zoomLevel }]} numberOfLines={index === 2 || index === 3 ? 2 : 1}>{item[rowKeys[index]]}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.background}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={modernTheme.colors.text.inverse} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialIcons name="analytics" size={30} color={modernTheme.colors.text.inverse} />
            <Text style={styles.headerTitle}>Reportes</Text>
          </View>
          <TouchableOpacity style={styles.zoomButton} onPress={() => setZoomLevel(zoomLevel === 1 ? 1.5 : 1)}>
            <MaterialIcons name="zoom-in" size={24} color={modernTheme.colors.text.inverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <MaterialIcons name="download" size={24} color={modernTheme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersCard}>
        <View style={styles.filtersContainer}>
          <View style={styles.datePickersContainer}>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={20} color={modernTheme.colors.primary} />
              <Text style={styles.datePickerText}>Inicio: {formatDate(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={20} color={modernTheme.colors.primary} />
              <Text style={styles.datePickerText}>Fin: {formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
          {renderFilterOptions()}
        </View>
      </View>

      {showSummary && renderSummary()}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {renderTableHeader()}
            <FlatList
              data={getSortedData()}
              renderItem={renderTableRow}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </ScrollView>
      </View>

      {showStartDatePicker && (
        <Modal visible={showStartDatePicker} transparent={true} animationType="slide" onRequestClose={() => setShowStartDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <Text style={styles.modalTitle}>Seleccionar Fecha Desde</Text>
              <Calendar
                onDayPress={(day) => {
                  const dateStr = day.dateString;
                  setStartDate(new Date(day.year, day.month - 1, day.day));
                  setShowStartDatePicker(false);
                }}
                markedDates={{
                  [startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: modernTheme.colors.primary }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
                style={styles.datePickerCloseButton}
              >
                <Text style={styles.datePickerCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {showEndDatePicker && (
        <Modal visible={showEndDatePicker} transparent={true} animationType="slide" onRequestClose={() => setShowEndDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <Text style={styles.modalTitle}>Seleccionar Fecha Hasta</Text>
              <Calendar
                onDayPress={(day) => {
                  const dateStr = day.dateString;
                  setEndDate(new Date(day.year, day.month - 1, day.day));
                  setShowEndDatePicker(false);
                }}
                markedDates={{
                  [endDate.toISOString().split('T')[0]]: { selected: true, selectedColor: modernTheme.colors.primary }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                style={styles.datePickerCloseButton}
              >
                <Text style={styles.datePickerCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {renderStatusModal()}
      {renderClientModal()}
      {renderLocationModal()}
      {renderFormatModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.secondary,
  },
  header: {
    height: 75,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    backgroundColor: modernTheme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: modernTheme.colors.text.inverse,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  datePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: modernTheme.colors.text.primary,
  },
  filtersCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  filtersContainer: {
    padding: 16,
  },
  filterButtonsContainer: {
    marginVertical: 10,
  },
  filterScrollView: {
    marginHorizontal: -4, // Para compensar padding
  },
  filterButtonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: modernTheme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 100,
    flexShrink: 1,
  },
  filterButtonText: {
    fontSize: 12,
    color: modernTheme.colors.primary,
    flex: 1,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: 10,
    width: '95%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  selectedItemsContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
  },
  selectedItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedItemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.primary,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  selectedItemText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 12,
    marginRight: 4,
    flexShrink: 1,
  },
  removeItemButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
  },
  selectedItem: {
    backgroundColor: modernTheme.colors.background.tertiary,
  },
  modalItemText: {
    fontSize: 14,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    elevation: 2,
    height: '55%',
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: modernTheme.colors.primary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 2,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  headerCell: {
    paddingHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: modernTheme.colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
    paddingVertical: 1,
  },
  cell: {
    paddingHorizontal: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 8,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    elevation: 2,
    minWidth: 70,
  },
  summaryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(210, 105, 30, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTextContainer: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: modernTheme.colors.text.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  filterOptionsContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  excelFilterContainer: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    marginHorizontal: 4,
  },
  excelFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.tertiary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  excelFilterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: modernTheme.colors.text.primary,
    marginLeft: 6,
  },
  excelFilterContent: {
    padding: 10,
  },
  excelFilterValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  excelFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: modernTheme.colors.primary,
    maxWidth: '100%',
    marginRight: 6,
    marginBottom: 4,
  },
  excelFilterTagText: {
    fontSize: 12,
    color: modernTheme.colors.text.inverse,
    marginRight: 4,
    flexShrink: 1,
    fontWeight: '500',
  },
  excelFilterRemoveButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  exportButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  datePickerModalContent: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.xl,
    margin: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    ...modernTheme.shadows.xlarge,
  },
  datePickerCloseButton: {
    marginTop: modernTheme.spacing.lg,
    alignSelf: 'center',
    padding: modernTheme.spacing.md,
  },
  datePickerCloseText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.primary,
    fontWeight: '600',
  },
});

export default ReportsScreen;
