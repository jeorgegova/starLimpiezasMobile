/**
 * Pantalla de Reportes para Star Limpiezas Mobile
 * Funcionalidades diferentes según el rol:
 * - Admin: Reportes de todos los servicios con filtros personalizables
 * - User: Reportes de sus propios servicios con filtros personalizables
 */
import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { serviceService, DATABASE_CONFIG } from '../services';

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
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    service_type: '',
    date_from: '',
    date_to: '',
    user_id: isUser() ? userProfile?.id : ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [services, filters, applyFilters]);

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
        calculateStats(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (servicesData) => {
    const newStats = {
      total: servicesData.length,
      pending: servicesData.filter(s => s.status === DATABASE_CONFIG.serviceStatus.PENDING).length,
      confirmed: servicesData.filter(s => s.status === DATABASE_CONFIG.serviceStatus.CONFIRMED).length,
      cancelled: servicesData.filter(s => s.status === DATABASE_CONFIG.serviceStatus.CANCELLED).length,
      completed: servicesData.filter(s => s.status === DATABASE_CONFIG.serviceStatus.COMPLETED).length
    };
    setStats(newStats);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices().finally(() => setRefreshing(false));
  };

  const applyFilters = () => {
    let filtered = [...services];

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

    setFilteredServices(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      service_type: '',
      date_from: '',
      date_to: '',
      user_id: isUser() ? userProfile?.id : ''
    });
    setShowFiltersModal(false);
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
        return '#f39c12';
      case DATABASE_CONFIG.serviceStatus.CONFIRMED:
        return '#2ecc71';
      case DATABASE_CONFIG.serviceStatus.CANCELLED:
        return '#e74c3c';
      case DATABASE_CONFIG.serviceStatus.COMPLETED:
        return '#3498db';
      default:
        return '#7f8c8d';
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
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.service_name || 'Servicio'}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusBadgeText}>
            {getStatusDisplayName(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceDate}>📅 {formatDate(item.assigned_date)}</Text>
        <Text style={styles.serviceAddress}>📍 {item.address || 'Sin dirección'}</Text>
        <Text style={styles.servicePhone}>📱 {item.phone || 'Sin teléfono'}</Text>
        <Text style={styles.serviceShift}>🕐 {item.shift || 'Sin turno'}</Text>
        <Text style={styles.serviceHours}>⏱️ {item.hours || 'Sin especificar'}</Text>
        {isAdmin() && item.user_name && (
          <Text style={styles.serviceUser}>👤 {item.user_name}</Text>
        )}
      </View>
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

      <View style={styles.content}>
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
              <Text style={styles.statNumber}>{stats.confirmed}</Text>
              <Text style={styles.statLabel}>Confirmados</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e74c3c' }]}>
              <Text style={styles.statNumber}>{stats.cancelled}</Text>
              <Text style={styles.statLabel}>Cancelados</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Text style={styles.filtersButtonText}>🔍 Filtros</Text>
          </TouchableOpacity>
          <Text style={styles.resultsText}>
            {filteredServices.length} de {services.length} servicios
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginBottom: 10,
    padding: 5,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 5,
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
  },
  filtersButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  listContainer: {
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceInfo: {
    marginBottom: 10,
  },
  serviceDate: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  serviceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicePhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  serviceShift: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  serviceHours: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  serviceUser: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  filtersScroll: {
    maxHeight: 300,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 15,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statusFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  statusFilterOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  statusFilterOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusFilterOptionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#95a5a6',
  },
  applyButton: {
    backgroundColor: '#3498db',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReportsScreen;