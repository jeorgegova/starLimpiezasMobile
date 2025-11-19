/**
 * Modernized Services Screen for Star Limpiezas Mobile
 * Elegant design with smooth animations and modern icons
 * Different functionality based on role:
 * - Admin: Can confirm, cancel, edit and create services
 * - User: Can create services that remain in pending status
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
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { serviceService, utilityService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import ModernIcon, { IconButton, StatusIcon } from '../theme/ModernIcon';

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

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadServicios();
    loadLocations();
    
    // Animate content fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: modernTheme.animations.timing.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: modernTheme.animations.timing.normal,
        useNativeDriver: true,
      }),
    ]).start();
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
      // Note: This should use serviceService or a location service
      // For now, we'll just keep it simple
      setLocations([]);
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
        // Edit existing service
        Alert.alert('Info', 'Funcionalidad de edición pendiente de implementar');
        setShowCreateModal(false);
        loadServicios();
      } else {
        // Create new service
        Alert.alert('Info', 'Funcionalidad de creación pendiente de implementar');
        setShowCreateModal(false);
        loadServicios();
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
      Alert.alert('Info', `Funcionalidad de ${action} pendiente de implementar`);
      // loadServicios(); // Uncomment when backend is implemented
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const formatDate = (dateString) => utilityService.formatDate(dateString);
  const getStatusColor = (status) => utilityService.getStatusColor(status);
  const getStatusDisplayName = (status) => utilityService.getStatusDisplayName(status);
  const getShiftDisplayName = (shift) => utilityService.getShiftDisplayName(shift);

  const renderServicio = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.servicioCard,
        {
          opacity: fadeAnim,
          transform: [
            { 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20 * index]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.servicioHeader}>
        <View style={styles.servicioTitleContainer}>
          <ModernIcon name="cleaning" size="md" color={modernTheme.colors.primary} />
          <Text style={styles.servicioNombre}>{item.service_name || 'Servicio'}</Text>
        </View>
        <StatusIcon status={item.status} size="sm" />
      </View>
      
      <View style={styles.servicioInfo}>
        <View style={styles.infoRow}>
          <ModernIcon name="calendar" size="sm" color={modernTheme.colors.text.secondary} />
          <Text style={styles.servicioText}>{formatDate(item.assigned_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <ModernIcon name="location" size="sm" color={modernTheme.colors.text.secondary} />
          <Text style={styles.servicioText}>{item.address || 'Sin dirección'}</Text>
        </View>
        <View style={styles.infoRow}>
          <ModernIcon name="phone" size="sm" color={modernTheme.colors.text.secondary} />
          <Text style={styles.servicioText}>{item.phone || 'Sin teléfono'}</Text>
        </View>
        <View style={styles.infoRow}>
          <ModernIcon name="clock" size="sm" color={modernTheme.colors.text.secondary} />
          <Text style={styles.servicioText}>{getShiftDisplayName(item.shift)}</Text>
        </View>
        {item.hours && (
          <View style={styles.infoRow}>
            <ModernIcon name="time" size="sm" color={modernTheme.colors.text.secondary} />
            <Text style={styles.servicioText}>{item.hours}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.infoRow}>
            <ModernIcon name="pin" size="sm" color={modernTheme.colors.text.secondary} />
            <Text style={styles.servicioText}>{item.location.location}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.servicioFooter}>
        {isAdmin() && hasPermission('canConfirmServices') && (
          <>
            {item.status === DATABASE_CONFIG.serviceStatus.PENDING && (
              <View style={styles.actionButtonsRow}>
                <IconButton
                  icon="confirm"
                  text="Confirmar"
                  variant="success"
                  size="sm"
                  onPress={() => handleServiceAction(item, 'confirm')}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="reject"
                  text="Cancelar"
                  variant="error"
                  size="sm"
                  onPress={() => handleServiceAction(item, 'cancel')}
                  style={styles.actionButton}
                />
              </View>
            )}
            {item.status === DATABASE_CONFIG.serviceStatus.CONFIRMED && (
              <IconButton
                icon="complete"
                text="Completar"
                variant="primary"
                size="sm"
                onPress={() => handleServiceAction(item, 'complete')}
                style={styles.actionButtonFull}
              />
            )}
          </>
        )}
        
        {(item.user_id === userProfile?.id || isAdmin()) && (
          <IconButton
            icon="edit"
            text="Editar"
            variant="outline"
            size="sm"
            onPress={() => openEditModal(item)}
            style={styles.actionButtonFull}
          />
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <ModernIcon name="cleaning" size="lg" color={modernTheme.colors.text.inverse} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {isAdmin() ? 'Gestión de Servicios' : 'Mis Servicios'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Bienvenido, {userName}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {hasPermission('canCreateServices') && (
          <Animated.View 
            style={[
              styles.actionsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <IconButton
              icon="add"
              text={isAdmin() ? 'Crear Servicio' : 'Solicitar Servicio'}
              variant="primary"
              size="md"
              onPress={openCreateModal}
              style={styles.addButton}
            />
          </Animated.View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={modernTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : (
          <FlatList
            data={servicios}
            renderItem={renderServicio}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[modernTheme.colors.primary]}
                tintColor={modernTheme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ModernIcon 
                  name="cleaning" 
                  size="xl" 
                  color={modernTheme.colors.text.muted}
                  style={styles.emptyIcon}
                />
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

      {/* Modern Create/Edit Service Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { 
                    scale: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.9]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <ModernIcon name="cleaning" size="lg" color={modernTheme.colors.primary} />
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Servicio' : isAdmin() ? 'Crear Servicio' : 'Solicitar Servicio'}
              </Text>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del servicio *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre del servicio"
                  value={serviceData.service_name}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, service_name: text }))}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="2024-12-25"
                  value={serviceData.assigned_date}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, assigned_date: text }))}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Calle 123, Ciudad"
                  value={serviceData.address}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, address: text }))}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+57 300 123 4567"
                  value={serviceData.phone}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.shiftContainer}>
                <Text style={styles.inputLabel}>Turno</Text>
                <View style={styles.shiftOptions}>
                  {Object.values(DATABASE_CONFIG.shifts).map((shift) => (
                    <TouchableOpacity
                      key={shift}
                      style={[
                        styles.shiftOption,
                        serviceData.shift === shift && styles.shiftOptionSelected
                      ]}
                      onPress={() => setServiceData(prev => ({ ...prev, shift }))}
                    >
                      <ModernIcon 
                        name="clock" 
                        size="sm" 
                        color={serviceData.shift === shift ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
                      />
                      <Text style={[
                        styles.shiftOptionText,
                        serviceData.shift === shift && styles.shiftOptionTextSelected
                      ]}>
                        {getShiftDisplayName(shift)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Horas estimadas</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="2 horas"
                  value={serviceData.hours}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, hours: text }))}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <IconButton
                text="Cancelar"
                variant="outline"
                size="md"
                onPress={() => setShowCreateModal(false)}
                style={styles.modalButton}
              />
              
              <IconButton
                text={editingService ? 'Actualizar' : 'Guardar'}
                variant="primary"
                size="md"
                onPress={handleSaveService}
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.primary,
  },
  
  // Header styles
  header: {
    backgroundColor: modernTheme.colors.primary,
    paddingTop: modernTheme.spacing.xl + modernTheme.spacing.md,
    paddingBottom: modernTheme.spacing.xl,
  },
  headerContent: {
    paddingHorizontal: modernTheme.spacing.lg,
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: modernTheme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    ...modernTheme.typography.h3,
    color: modernTheme.colors.text.inverse,
    marginBottom: modernTheme.spacing.xs,
  },
  headerSubtitle: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse + '90',
  },
  
  // Content styles
  content: {
    flex: 1,
    padding: modernTheme.spacing.lg,
  },
  actionsContainer: {
    marginBottom: modernTheme.spacing.lg,
  },
  addButton: {
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: modernTheme.spacing.md,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  listaContainer: {
    paddingBottom: modernTheme.spacing.xl,
  },
  
  // Service card styles
  servicioCard: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    marginBottom: modernTheme.spacing.lg,
    ...modernTheme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
  },
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  servicioTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  servicioNombre: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    marginLeft: modernTheme.spacing.sm,
    flex: 1,
  },
  servicioInfo: {
    marginBottom: modernTheme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  servicioText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginLeft: modernTheme.spacing.md,
    flex: 1,
  },
  servicioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: modernTheme.spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: modernTheme.spacing.sm,
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonFull: {
    flex: 1,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: modernTheme.spacing.xxl,
  },
  emptyIcon: {
    marginBottom: modernTheme.spacing.lg,
  },
  emptyText: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  emptySubtext: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.muted,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: modernTheme.colors.text.primary + '80',
    justifyContent: 'center',
    alignItems: 'center',
    padding: modernTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.xl,
    borderRadius: modernTheme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    ...modernTheme.shadows.xlarge,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xl,
  },
  modalTitle: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginTop: modernTheme.spacing.md,
  },
  modalForm: {
    marginBottom: modernTheme.spacing.xl,
  },
  inputGroup: {
    marginBottom: modernTheme.spacing.lg,
  },
  inputLabel: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.sm,
  },
  modalInput: {
    ...modernTheme.componentStyles.input,
  },
  
  // Shift selector styles
  shiftContainer: {
    marginBottom: modernTheme.spacing.lg,
  },
  shiftOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: modernTheme.spacing.sm,
  },
  shiftOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.secondary,
  },
  shiftOptionSelected: {
    borderColor: modernTheme.colors.primary,
    backgroundColor: modernTheme.colors.primary + '15',
  },
  shiftOptionText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginLeft: modernTheme.spacing.sm,
  },
  shiftOptionTextSelected: {
    color: modernTheme.colors.primary,
    fontWeight: '600',
  },
  
  // Modal buttons
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: modernTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default ServiciosScreen;