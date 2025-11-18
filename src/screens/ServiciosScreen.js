/**
 * Pantalla de Servicios para Star Limpiezas Mobile
 * Funcionalidades diferentes según el rol:
 * - Admin: Puede confirmar, cancelar, editar y crear servicios
 * - User: Puede crear servicios que quedan en estado pendiente
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
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { serviceService, utilityService, DATABASE_CONFIG } from '../services';

const ServiciosScreen = () => {
  const navigation = useNavigation();
  const { 
    userName, 
    userProfile, 
    hasPermission, 
    isAdmin 
  } = useAuth();
  
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceData, setServiceData] = useState({
    service_name: '',
    assigned_date: '',
    address: '',
    phone: '',
    shift: DATABASE_CONFIG.shifts.MORNING,
    hours: '',
    location_id: null
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadServicios();
    loadLocations();
  }, []);

  const loadServicios = async () => {
    setLoading(true);
    try {
      const isAdminUser = isAdmin();
      const userId = userProfile?.id;

      const { data, error } = await serviceService.getUserServices(userId, isAdminUser);

      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      } else {
        setServicios(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabaseClient.getLocations();
      if (!error && data) {
        setLocations(data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServicios().finally(() => setRefreshing(false));
  };

  const openCreateModal = () => {
    setEditingService(null);
    setServiceData({
      service_name: '',
      assigned_date: '',
      address: '',
      phone: '',
      shift: DATABASE_CONFIG.shifts.MORNING,
      hours: '',
      location_id: null
    });
    setShowCreateModal(true);
  };

  const openEditModal = (servicio) => {
    setEditingService(servicio);
    setServiceData({
      service_name: servicio.service_name || '',
      assigned_date: servicio.assigned_date || '',
      address: servicio.address || '',
      phone: servicio.phone || '',
      shift: servicio.shift || DATABASE_CONFIG.shifts.MORNING,
      hours: servicio.hours || '',
      location_id: servicio.location_id || null
    });
    setShowCreateModal(true);
  };

  const handleSaveService = async () => {
    if (!serviceData.service_name || !serviceData.assigned_date) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    try {
      const isAdminUser = isAdmin();
      
      if (editingService) {
        // Editar servicio existente
        const { data, error } = await supabaseClient.updateService(
          editingService.id,
          {
            ...serviceData,
            isOwner: !isAdminUser && editingService.user_id === userProfile?.id
          },
          isAdminUser
        );
        
        if (error) {
          Alert.alert('Error', 'No se pudo actualizar el servicio');
        } else {
          Alert.alert('Éxito', 'Servicio actualizado exitosamente');
          setShowCreateModal(false);
          loadServicios();
        }
      } else {
        // Crear nuevo servicio
        const { data, error } = await supabaseClient.createUserService({
          ...serviceData,
          user_id: userProfile?.id
        });
        
        if (error) {
          Alert.alert('Error', 'No se pudo crear el servicio');
        } else {
          const status = isAdminUser ? 
            DATABASE_CONFIG.serviceStatus.CONFIRMED : 
            DATABASE_CONFIG.serviceStatus.PENDING;
          
          Alert.alert('Éxito', `Servicio creado exitosamente. Estado: ${status}`);
          setShowCreateModal(false);
          loadServicios();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleServiceAction = async (servicio, action) => {
    if (!isAdmin() || !hasPermission('canConfirmServices')) {
      Alert.alert('Error', 'No tienes permisos para realizar esta acción');
      return;
    }

    let newStatus;
    switch (action) {
      case 'confirm':
        newStatus = DATABASE_CONFIG.serviceStatus.CONFIRMED;
        break;
      case 'cancel':
        newStatus = DATABASE_CONFIG.serviceStatus.CANCELLED;
        break;
      case 'complete':
        newStatus = DATABASE_CONFIG.serviceStatus.COMPLETED;
        break;
      default:
        return;
    }

    try {
      const { data, error } = await supabaseClient.updateServiceStatus(
        servicio.id, 
        newStatus, 
        true
      );
      
      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el estado del servicio');
      } else {
        Alert.alert('Éxito', 'Estado del servicio actualizado');
        loadServicios();
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const formatDate = (dateString) => utilityService.formatDate(dateString);
  const getStatusColor = (status) => utilityService.getStatusColor(status);
  const getStatusDisplayName = (status) => utilityService.getStatusDisplayName(status);
  const getShiftDisplayName = (shift) => utilityService.getShiftDisplayName(shift);

  const renderServicio = ({ item }) => (
    <View style={styles.servicioCard}>
      <View style={styles.servicioHeader}>
        <Text style={styles.servicioNombre}>{item.service_name || 'Servicio'}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusBadgeText}>
            {getStatusDisplayName(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.servicioInfo}>
        <Text style={styles.servicioFecha}>📅 {formatDate(item.assigned_date)}</Text>
        <Text style={styles.servicioDireccion}>📍 {item.address || 'Sin dirección'}</Text>
        <Text style={styles.servicioTelefono}>📱 {item.phone || 'Sin teléfono'}</Text>
        <Text style={styles.servicioTurno}>🕐 {getShiftDisplayName(item.shift)}</Text>
        <Text style={styles.servicioHoras}>⏱️ {item.hours || 'Sin especificar'}</Text>
        {item.location && (
          <Text style={styles.servicioLocation}>📌 {item.location.location}</Text>
        )}
      </View>
      
      <View style={styles.servicioFooter}>
        {isAdmin() && hasPermission('canConfirmServices') && (
          <>
            {item.status === DATABASE_CONFIG.serviceStatus.PENDING && (
              <>
                <TouchableOpacity 
                  style={styles.botonConfirmar}
                  onPress={() => handleServiceAction(item, 'confirm')}
                >
                  <Text style={styles.botonConfirmarText}>✅ Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.botonCancelar}
                  onPress={() => handleServiceAction(item, 'cancel')}
                >
                  <Text style={styles.botonCancelarText}>❌ Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === DATABASE_CONFIG.serviceStatus.CONFIRMED && (
              <TouchableOpacity 
                style={styles.botonCompletar}
                onPress={() => handleServiceAction(item, 'complete')}
              >
                <Text style={styles.botonCompletarText}>🏁 Completar</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {(item.user_id === userProfile?.id || isAdmin()) && (
          <TouchableOpacity 
            style={styles.botonEditar}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.botonEditarText}>✏️ Editar</Text>
          </TouchableOpacity>
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
          {isAdmin() ? '🧹 Gestión de Servicios' : '🧹 Mis Servicios'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      <View style={styles.content}>
        {hasPermission('canCreateServices') && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={openCreateModal}
            >
              <Text style={styles.addButtonText}>
                ➕ {isAdmin() ? 'Crear Servicio' : 'Solicitar Servicio'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : (
          <FlatList
            data={servicios}
            renderItem={renderServicio}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isAdmin() ? 'No hay servicios registrados' : 'No tienes servicios solicitados'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {hasPermission('canCreateServices') && 
                    `Toca el botón "Crear Servicio" para ${isAdmin() ? 'crear' : 'solicitar'} un servicio`
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal para crear/editar servicio */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Editar Servicio' : isAdmin() ? 'Crear Servicio' : 'Solicitar Servicio'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del servicio *"
              value={serviceData.service_name}
              onChangeText={(text) => setServiceData(prev => ({ ...prev, service_name: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Fecha (YYYY-MM-DD) *"
              value={serviceData.assigned_date}
              onChangeText={(text) => setServiceData(prev => ({ ...prev, assigned_date: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Dirección"
              value={serviceData.address}
              onChangeText={(text) => setServiceData(prev => ({ ...prev, address: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Teléfono"
              value={serviceData.phone}
              onChangeText={(text) => setServiceData(prev => ({ ...prev, phone: text }))}
            />

            <View style={styles.shiftContainer}>
              <Text style={styles.shiftLabel}>Turno:</Text>
              {Object.values(DATABASE_CONFIG.shifts).map((shift) => (
                <TouchableOpacity
                  key={shift}
                  style={[
                    styles.shiftOption,
                    serviceData.shift === shift && styles.shiftOptionSelected
                  ]}
                  onPress={() => setServiceData(prev => ({ ...prev, shift }))}
                >
                  <Text style={[
                    styles.shiftOptionText,
                    serviceData.shift === shift && styles.shiftOptionTextSelected
                  ]}>
                    {getShiftDisplayName(shift)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Horas estimadas"
              value={serviceData.hours}
              onChangeText={(text) => setServiceData(prev => ({ ...prev, hours: text }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveService}
              >
                <Text style={styles.saveButtonText}>
                  {editingService ? 'Actualizar' : 'Guardar'}
                </Text>
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
  actionsContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  listaContainer: {
    paddingBottom: 20,
  },
  servicioCard: {
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
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  servicioNombre: {
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
  servicioInfo: {
    marginBottom: 15,
  },
  servicioFecha: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  servicioDireccion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicioTelefono: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicioTurno: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicioHoras: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicioLocation: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  servicioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  botonConfirmar: {
    backgroundColor: '#2ecc71',
    padding: 8,
    borderRadius: 5,
    flex: 0.32,
    alignItems: 'center',
  },
  botonConfirmarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  botonCancelar: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    flex: 0.32,
    alignItems: 'center',
  },
  botonCancelarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  botonCompletar: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  botonCompletarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  botonEditar: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  botonEditarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  shiftContainer: {
    marginBottom: 20,
  },
  shiftLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  shiftOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 5,
    alignItems: 'center',
  },
  shiftOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  shiftOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  shiftOptionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ServiciosScreen;