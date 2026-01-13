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
  Share
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { Calendar } from 'react-native-calendars';
import { serviceService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ReportsScreen = () => {
  const navigation = useNavigation();
  const {
    userName,
    userProfile,
    hasPermission,
    isAdmin,
    isUser
  } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [selectedDateFrom, setSelectedDateFrom] = useState(new Date());
  const [selectedDateTo, setSelectedDateTo] = useState(new Date());

  // Filtros y búsqueda
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('service_name');

  // Filtros avanzados
  const [filters, setFilters] = useState({
    status: '',
    service_type: '',
    date_from: '',
    date_to: '',
    user_id: isUser() ? userProfile?.id : ''
  });

  // Calcular conteos por estado
  const statusCounts = useMemo(() => {
    const counts = {};
    Object.values(DATABASE_CONFIG.serviceStatus).forEach(status => {
      counts[status] = services.filter(s => s.status === status).length;
    });
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Filtros básicos
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(service => service.status === selectedStatus);
    }

    if (searchText) {
      filtered = filtered.filter(service => {
        let value = '';
        switch (searchType) {
          case 'service_name':
            value = service.service_name || '';
            break;
          case 'address':
            value = service.address || '';
            break;
          case 'user':
            value = service.user_name || '';
            break;
        }
        return value.toLowerCase().includes(searchText.toLowerCase());
      });
    }

    // Filtros avanzados
    if (filters.status) {
      filtered = filtered.filter(service => service.status === filters.status);
    }

    if (filters.service_type) {
      filtered = filtered.filter(service =>
        service.service_name?.toLowerCase().includes(filters.service_type.toLowerCase())
      );
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filtered = filtered.filter(service =>
        new Date(service.assigned_date) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filtered = filtered.filter(service =>
        new Date(service.assigned_date) <= toDate
      );
    }

    if (filters.user_id && isAdmin()) {
      filtered = filtered.filter(service => service.user_id === filters.user_id);
    }

    return filtered;
  }, [services, selectedStatus, searchText, searchType, filters]);


  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const isAdminUser = isAdmin();
      const userId = userProfile?.id;

      const { data, error } = await serviceService.getServicesByFilters(filters);

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      } else {
        setServices(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadServices().finally(() => setRefreshing(false));
  };

  const clearFilters = () => {
    setSelectedStatus(null);
    setSearchText('');
    setFilters({
      status: '',
      service_type: '',
      date_from: '',
      date_to: '',
      user_id: isUser() ? userProfile?.id : ''
    });
    setShowFiltersModal(false);
    setShowFiltersPanel(false);
  };

  const exportToCSV = async () => {
    try {
      if (filteredServices.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Crear encabezados CSV
      const headers = ['Fecha', 'Servicio', 'Dirección', 'Teléfono', 'Estado'];
      if (isAdmin()) {
        headers.push('Cliente');
      }

      // Crear filas de datos
      const rows = filteredServices.map(service => {
        const row = [
          formatDate(service.assigned_date),
          service.service_name || 'Servicio',
          service.address || 'Sin dirección',
          service.phone || 'Sin teléfono',
          getStatusDisplayName(service.status)
        ];
        if (isAdmin()) {
          row.push(service.user_name || 'Sin asignar');
        }
        return row;
      });

      // Combinar headers y rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Compartir el archivo CSV
      await Share.share({
        message: csvContent,
        title: 'Reporte de Servicios',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case DATABASE_CONFIG.serviceStatus.PENDING:
        return modernTheme.colors.warning;
      case DATABASE_CONFIG.serviceStatus.CONFIRMED:
        return modernTheme.colors.success;
      case DATABASE_CONFIG.serviceStatus.CANCELLED:
        return modernTheme.colors.error;
      case DATABASE_CONFIG.serviceStatus.COMPLETED:
        return modernTheme.colors.primary;
      default:
        return modernTheme.colors.text.muted;
    }
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

  const renderService = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.dateCell]}>{formatDate(item.assigned_date)}</Text>
      <Text style={[styles.tableCell, styles.serviceCell]}>{item.service_name || 'Servicio'}</Text>
      <Text style={[styles.tableCell, styles.addressCell]}>{item.address || 'Sin dirección'}</Text>
      <Text style={[styles.tableCell, styles.phoneCell]}>{item.phone || 'Sin teléfono'}</Text>
      <View style={[styles.tableCell, styles.statusCell]}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusBadgeText}>
            {getStatusDisplayName(item.status)}
          </Text>
        </View>
      </View>
      {isAdmin() && (
        <Text style={[styles.tableCell, styles.userCell]}>{item.user_name || 'Sin asignar'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          📊 {isAdmin() ? 'Reportes de Servicios' : 'Mis Reportes'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>


      {/* Barra de búsqueda compacta */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={18} color={modernTheme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            placeholderTextColor={modernTheme.colors.text.muted}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={18} color={modernTheme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFiltersPanel(!showFiltersPanel)}
        >
          <MaterialIcons
            name="tune"
            size={20}
            color={showFiltersPanel ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Panel de filtros expandible */}
      {showFiltersPanel && (
        <View style={styles.filterPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Estado</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, selectedStatus === null && styles.filterOptionSelected]}
                onPress={() => setSelectedStatus(null)}
              >
                <Text style={[styles.filterOptionText, selectedStatus === null && styles.filterOptionTextSelected]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {Object.values(DATABASE_CONFIG.serviceStatus).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterOption, selectedStatus === status && styles.filterOptionSelected]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[styles.filterOptionText, selectedStatus === status && styles.filterOptionTextSelected]}>
                    {getStatusDisplayName(status)} ({statusCounts[status] || 0})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Rango de Fechas</Text>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Desde:</Text>
                <TouchableOpacity
                  onPress={() => setShowDateFromPicker(true)}
                  style={[styles.dateInput, { justifyContent: 'center' }]}
                >
                  <Text style={{
                    color: filters.date_from ? modernTheme.colors.text.primary : modernTheme.colors.text.muted,
                    fontSize: 14
                  }}>
                    {filters.date_from || 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Hasta:</Text>
                <TouchableOpacity
                  onPress={() => setShowDateToPicker(true)}
                  style={[styles.dateInput, { justifyContent: 'center' }]}
                >
                  <Text style={{
                    color: filters.date_to ? modernTheme.colors.text.primary : modernTheme.colors.text.muted,
                    fontSize: 14
                  }}>
                    {filters.date_to || 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Buscar por</Text>
            <View style={styles.searchTypeOptions}>
              <TouchableOpacity
                style={[styles.searchTypeOption, searchType === 'service_name' && styles.searchTypeOptionSelected]}
                onPress={() => setSearchType('service_name')}
              >
                <MaterialIcons
                  name="cleaning-services"
                  size={16}
                  color={searchType === 'service_name' ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
                />
                <Text style={[styles.searchTypeOptionText, searchType === 'service_name' && styles.searchTypeOptionTextSelected]}>
                  Servicio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.searchTypeOption, searchType === 'address' && styles.searchTypeOptionSelected]}
                onPress={() => setSearchType('address')}
              >
                <MaterialIcons
                  name="location-on"
                  size={16}
                  color={searchType === 'address' ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
                />
                <Text style={[styles.searchTypeOptionText, searchType === 'address' && styles.searchTypeOptionTextSelected]}>
                  Dirección
                </Text>
              </TouchableOpacity>
              {isAdmin() && (
                <TouchableOpacity
                  style={[styles.searchTypeOption, searchType === 'user' && styles.searchTypeOptionSelected]}
                  onPress={() => setSearchType('user')}
                >
                  <MaterialIcons
                    name="person"
                    size={16}
                    color={searchType === 'user' ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
                  />
                  <Text style={[styles.searchTypeOptionText, searchType === 'user' && styles.searchTypeOptionTextSelected]}>
                    Cliente
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>


          {(selectedStatus !== null || searchText !== '') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <MaterialIcons name="clear-all" size={16} color={modernTheme.colors.error} />
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredServices.length} de {services.length} servicios
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={exportToCSV}
          >
            <MaterialIcons name="download" size={20} color={modernTheme.colors.primary} />
            <Text style={styles.downloadButtonText}>Exportar CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.dateCell]}>Fecha</Text>
          <Text style={[styles.tableHeaderCell, styles.serviceCell]}>Servicio</Text>
          <Text style={[styles.tableHeaderCell, styles.addressCell]}>Dirección</Text>
          <Text style={[styles.tableHeaderCell, styles.phoneCell]}>Teléfono</Text>
          <Text style={[styles.tableHeaderCell, styles.statusCell]}>Estado</Text>
          {isAdmin() && (
            <Text style={[styles.tableHeaderCell, styles.userCell]}>Cliente</Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={modernTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando reportes...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderService}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="analytics"
                  size={40}
                  color={modernTheme.colors.text.muted}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>
                  {services.length === 0 ? 'No hay servicios registrados' : 'No hay servicios que coincidan con los filtros'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {services.length === 0 ? 'Los servicios aparecerán aquí cuando sean creados' : 'Intenta cambiar los filtros'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal de Filtros */}
      <Modal
        visible={showFiltersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtros de Reporte</Text>

            <ScrollView style={styles.filtersScroll}>
              {/* Filtro por estado */}
              <Text style={styles.filterLabel}>Estado:</Text>
              <View style={styles.statusFilterContainer}>
                {Object.values(DATABASE_CONFIG.serviceStatus).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusFilterOption,
                      filters.status === status && styles.statusFilterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      status: prev.status === status ? '' : status
                    }))}
                  >
                    <Text style={[
                      styles.statusFilterOptionText,
                      filters.status === status && styles.statusFilterOptionTextSelected
                    ]}>
                      {getStatusDisplayName(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtro por tipo de servicio */}
              <Text style={styles.filterLabel}>Tipo de Servicio:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Buscar por nombre del servicio"
                value={filters.service_type}
                onChangeText={(text) => setFilters(prev => ({ ...prev, service_type: text }))}
              />

              {/* Filtro por fecha desde */}
              <Text style={styles.filterLabel}>Fecha Desde:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="YYYY-MM-DD"
                value={filters.date_from}
                onChangeText={(text) => setFilters(prev => ({ ...prev, date_from: text }))}
              />

              {/* Filtro por fecha hasta */}
              <Text style={styles.filterLabel}>Fecha Hasta:</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="YYYY-MM-DD"
                value={filters.date_to}
                onChangeText={(text) => setFilters(prev => ({ ...prev, date_to: text }))}
              />

              {/* Filtro por usuario (solo admin) */}
              {isAdmin() && (
                <>
                  <Text style={styles.filterLabel}>ID de Usuario:</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="ID del usuario"
                    value={filters.user_id}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, user_id: text }))}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date From Picker Modal */}
      <Modal
        visible={showDateFromPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateFromPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContent}>
            <Text style={styles.modalTitle}>Seleccionar Fecha Desde</Text>
            <Calendar
              onDayPress={(day) => {
                const dateStr = day.dateString;
                setFilters(prev => ({ ...prev, date_from: dateStr }));
                setSelectedDateFrom(new Date(day.year, day.month - 1, day.day));
                setShowDateFromPicker(false);
              }}
              markedDates={{
                [filters.date_from]: { selected: true, selectedColor: modernTheme.colors.primary }
              }}
            />
            <TouchableOpacity
              onPress={() => setShowDateFromPicker(false)}
              style={styles.datePickerCloseButton}
            >
              <Text style={styles.datePickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date To Picker Modal */}
      <Modal
        visible={showDateToPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateToPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContent}>
            <Text style={styles.modalTitle}>Seleccionar Fecha Hasta</Text>
            <Calendar
              onDayPress={(day) => {
                const dateStr = day.dateString;
                setFilters(prev => ({ ...prev, date_to: dateStr }));
                setSelectedDateTo(new Date(day.year, day.month - 1, day.day));
                setShowDateToPicker(false);
              }}
              markedDates={{
                [filters.date_to]: { selected: true, selectedColor: modernTheme.colors.primary }
              }}
            />
            <TouchableOpacity
              onPress={() => setShowDateToPicker(false)}
              style={styles.datePickerCloseButton}
            >
              <Text style={styles.datePickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.secondary,
  },
  backButton: {
    marginBottom: modernTheme.spacing.sm,
    padding: modernTheme.spacing.xs,
  },
  backButtonText: {
    color: modernTheme.colors.text.inverse,
    ...modernTheme.typography.body,
    fontWeight: '500',
  },
  header: {
    backgroundColor: modernTheme.colors.primary,
    padding: modernTheme.spacing.lg,
    paddingTop: 50,
  },
  headerTitle: {
    ...modernTheme.typography.h2,
    color: modernTheme.colors.text.inverse,
    marginBottom: modernTheme.spacing.xs,
  },
  headerSubtitle: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.sm,
    backgroundColor: modernTheme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
    gap: modernTheme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.secondary,
    borderRadius: modernTheme.borderRadius.md,
    paddingHorizontal: modernTheme.spacing.md,
    height: 40,
    gap: modernTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: modernTheme.colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: modernTheme.borderRadius.md,
    backgroundColor: modernTheme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPanel: {
    backgroundColor: modernTheme.colors.background.secondary,
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
  },
  filterSection: {
    marginBottom: modernTheme.spacing.md,
  },
  filterSectionTitle: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: modernTheme.spacing.xs,
  },
  filterOption: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.primary,
  },
  filterOptionSelected: {
    backgroundColor: modernTheme.colors.primary,
    borderColor: modernTheme.colors.primary,
  },
  filterOptionText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  filterOptionTextSelected: {
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },
  searchTypeOptions: {
    flexDirection: 'row',
    gap: modernTheme.spacing.sm,
  },
  searchTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: modernTheme.spacing.sm,
    paddingHorizontal: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.primary,
    gap: modernTheme.spacing.xs,
  },
  searchTypeOptionSelected: {
    backgroundColor: modernTheme.colors.primary,
    borderColor: modernTheme.colors.primary,
  },
  searchTypeOptionText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  searchTypeOptionTextSelected: {
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: modernTheme.spacing.xs,
    paddingVertical: modernTheme.spacing.sm,
    marginTop: modernTheme.spacing.sm,
  },
  clearFiltersText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: modernTheme.spacing.lg,
    paddingTop: modernTheme.spacing.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  resultsText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.secondary,
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.md,
    gap: modernTheme.spacing.xs,
  },
  downloadButtonText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.primary,
    fontWeight: '600',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: modernTheme.spacing.sm,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  dateInput: {
    ...modernTheme.componentStyles.input,
    paddingHorizontal: modernTheme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...modernTheme.componentStyles.card,
    marginBottom: modernTheme.spacing.md,
  },
  filtersButton: {
    ...modernTheme.componentStyles.button,
    ...modernTheme.componentStyles.buttonPrimary,
  },
  filtersButtonText: {
    ...modernTheme.typography.button,
    color: modernTheme.colors.text.inverse,
  },
  resultsText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: modernTheme.spacing.sm,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  listContainer: {
    paddingBottom: modernTheme.spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: modernTheme.colors.primary,
    paddingVertical: modernTheme.spacing.sm,
    paddingHorizontal: modernTheme.spacing.md,
    marginBottom: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.md,
  },
  tableHeaderCell: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: modernTheme.colors.surface.primary,
    paddingVertical: modernTheme.spacing.sm,
    paddingHorizontal: modernTheme.spacing.md,
    marginBottom: 1,
    borderRadius: modernTheme.borderRadius.sm,
    alignItems: 'center',
  },
  tableCell: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: modernTheme.spacing.xs,
  },
  dateCell: {
    flex: 1.2,
    minWidth: 80,
  },
  serviceCell: {
    flex: 2,
    minWidth: 120,
  },
  addressCell: {
    flex: 2.5,
    minWidth: 150,
  },
  phoneCell: {
    flex: 1.5,
    minWidth: 100,
  },
  statusCell: {
    flex: 1.5,
    minWidth: 90,
    alignItems: 'center',
  },
  userCell: {
    flex: 1.5,
    minWidth: 100,
  },
  serviceCard: {
    ...modernTheme.componentStyles.card,
    marginBottom: modernTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  serviceName: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: modernTheme.spacing.sm,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.xl,
  },
  statusBadgeText: {
    color: modernTheme.colors.text.inverse,
    ...modernTheme.typography.caption,
    fontWeight: '600',
  },
  serviceInfo: {
    marginBottom: modernTheme.spacing.sm,
  },
  serviceDate: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  serviceAddress: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  servicePhone: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  serviceShift: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  serviceHours: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  serviceUser: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: modernTheme.spacing.xxxl,
  },
  emptyText: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: modernTheme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.lg,
    margin: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    ...modernTheme.typography.h3,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  filtersScroll: {
    maxHeight: 300,
  },
  filterLabel: {
    ...modernTheme.typography.bodyLarge,
    fontWeight: '600',
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.sm,
    marginTop: modernTheme.spacing.md,
  },
  filterInput: {
    ...modernTheme.componentStyles.input,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: modernTheme.spacing.sm,
  },
  statusFilterOption: {
    paddingHorizontal: modernTheme.spacing.sm,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    marginRight: modernTheme.spacing.xs,
    marginBottom: modernTheme.spacing.xs,
  },
  statusFilterOptionSelected: {
    borderColor: modernTheme.colors.primary,
    backgroundColor: modernTheme.colors.background.tertiary,
  },
  statusFilterOptionText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  statusFilterOptionTextSelected: {
    color: modernTheme.colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: modernTheme.spacing.lg,
  },
  modalButton: {
    ...modernTheme.componentStyles.button,
    minWidth: 100,
  },
  clearButton: {
    backgroundColor: modernTheme.colors.text.muted,
  },
  applyButton: {
    ...modernTheme.componentStyles.buttonPrimary,
  },
  clearButtonText: {
    ...modernTheme.typography.button,
    color: modernTheme.colors.text.inverse,
  },
  applyButtonText: {
    ...modernTheme.typography.button,
    color: modernTheme.colors.text.inverse,
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