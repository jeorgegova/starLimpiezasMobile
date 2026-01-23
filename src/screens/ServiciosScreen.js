/**
 * Modernized Services Screen for Star Limpiezas Mobile
 * Optimized layout with compact filters and better content visualization
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
  Animated,
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import { serviceService, utilityService, userService, bonificationService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { IconButton, StatusIcon } from '../theme/ModernIcon';

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
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
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
  const [availableServices, setAvailableServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [discountConfigs, setDiscountConfigs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('location');

  const filteredServicios = useMemo(() => {
    return servicios.filter(item => {
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (searchText) {
        let value = '';
        switch (searchType) {
          case 'location':
            value = item.address || '';
            break;
          case 'service_name':
            value = item.service_name || '';
            break;
          case 'user':
            value = item.user?.name || '';
            break;
        }
        if (!value.toLowerCase().includes(searchText.toLowerCase())) return false;
      }
      return true;
    });
  }, [servicios, selectedStatus, searchText, searchType]);

  // Check discount eligibility when service or user changes
  useEffect(() => {
    if (isAdmin() && serviceData.service_name && selectedUserId) {
      checkDiscountEligibility();
    } else {
      setDiscountInfo(null);
    }
  }, [serviceData.service_name, selectedUserId, isAdmin]);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadServicios();
    loadLocations();
    loadAvailableServices();

    if (isAdmin()) {
      loadUsers();
      loadDiscountConfigs();
    }

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
    const { data, error } = await serviceService.getLocations();
    if (!error) {
      setLocations(data || []);
    }
  };

  const loadAvailableServices = async () => {
    const { data, error } = await serviceService.getAvailableServices();
    if (!error) {
      setAvailableServices(data || []);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await userService.getUsersByRole(DATABASE_CONFIG.roles.USER);
    if (!error) {
      setUsers(data || []);
    }
  };

  const loadDiscountConfigs = async () => {
    const { data, error } = await bonificationService.getDiscountConfigs();
    if (!error) {
      setDiscountConfigs(data || []);
    }
  };

  const checkDiscountEligibility = async () => {
    try {
      // Get user's services for this service type
      const { data: userServices, error } = await serviceService.getUserServices(selectedUserId, false);
      if (error) return;

      // Find discount config for this service type
      const discountConfig = discountConfigs.find(config =>
        config.service_type == serviceData.service_name && config.active
      );

      if (!discountConfig) {
        setDiscountInfo(null);
        return;
      }

      // Count completed services of this type
      const completedServices = userServices.filter(service =>
        service.service_name.toLowerCase() === serviceData.service_name.toLowerCase() &&
        service.status === DATABASE_CONFIG.serviceStatus.COMPLETED
      ).length;

      // Check if user has services_required - 1 services
      if (completedServices >= discountConfig.services_required - 1) {
        setDiscountInfo({
          discountPercentage: discountConfig.discount_percentage,
          servicesCompleted: completedServices,
          servicesRequired: discountConfig.services_required
        });
      } else {
        setDiscountInfo(null);
      }
    } catch (error) {
      console.error('Error checking discount eligibility:', error);
      setDiscountInfo(null);
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
      assigned_date: new Date().toISOString().split('T')[0],
      address: '',
      phone: '',
      shift: DATABASE_CONFIG.shifts.MORNING,
      hours: '4',
      location_id: null
    });
    setSelectedUserId(isAdmin() ? null : userProfile?.id);
    setDiscountInfo(null);
    setSelectedDate(new Date());
    setAttemptedSave(false);
    setShowCreateModal(true);
  };

  const openEditModal = (servicio) => {
    setEditingService(servicio);
    setServiceData({
      service_name: servicio.service_name || '',
      assigned_date: servicio.assigned_date || new Date().toISOString().split('T')[0],
      address: servicio.address || '',
      phone: servicio.phone || '',
      shift: servicio.shift || DATABASE_CONFIG.shifts.MORNING,
      hours: servicio.hours || '4',
      location_id: servicio.location_id || null
    });
    const date = servicio.assigned_date ? new Date(servicio.assigned_date) : new Date();
    setSelectedDate(date);
    setAttemptedSave(false);
    setShowCreateModal(true);
  };

  const handleSaveService = async () => {
    setAttemptedSave(true);
    if (!serviceData.service_name || !serviceData.assigned_date || !serviceData.address || !serviceData.phone || !serviceData.shift || !serviceData.location_id || (isAdmin() && !selectedUserId)) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      if (editingService) {
        const { error } = await serviceService.updateService(editingService.id, serviceData);
        if (error) {
          Alert.alert('Error', 'No se pudo actualizar el servicio');
        } else {
          Alert.alert('Éxito', 'Servicio actualizado');
          setShowCreateModal(false);
          loadServicios();
        }
      } else {
        if (serviceData.service_name === 'Limpieza de Casas') {
          setShowPriceModal(true);
        } else {
          Alert.alert('Solicitud en proceso', 'Su solicitud está en proceso de validación y se comunicarán para concretar el servicio.');
          const userId = isAdmin() ? selectedUserId : userProfile?.id;
          const { error } = await serviceService.createUserService({ ...serviceData, user_id: userId });
          if (error) {
            Alert.alert('Error', 'No se pudo crear el servicio');
          } else {
            Alert.alert('Éxito', 'Servicio solicitado');
            setShowCreateModal(false);
            loadServicios();
          }
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

    try {
      const actions = {
        confirm: 'confirmed',
        cancel: 'cancelled',
        complete: 'completed'
      };
      const status = actions[action];
      if (status) {
        const { error } = await serviceService.updateServiceStatus(servicio.id, status);
        if (error) {
          Alert.alert('Error', 'No se pudo actualizar el estado');
        } else {
          Alert.alert('Éxito', `Servicio ${action}ado`);
          loadServicios();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const formatDate = (dateString) => utilityService.formatDate(dateString);
  const getStatusColor = (status) => utilityService.getStatusColor(status);
  const getStatusDisplayName = (status) => utilityService.getStatusDisplayName(status);
  const getShiftDisplayName = (shift) => utilityService.getShiftDisplayName(shift);

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  // Contar servicios por estado
  const statusCounts = useMemo(() => {
    const counts = {};
    Object.values(DATABASE_CONFIG.serviceStatus).forEach(status => {
      counts[status] = servicios.filter(s => s.status === status).length;
    });
    return counts;
  }, [servicios]);

  const renderServicio = ({ item, index }) => {
    const getBorderColor = (status) => {
      switch (status) {
        case DATABASE_CONFIG.serviceStatus.PENDING:
          return modernTheme.colors.warning || '#FFE082'; // Very soft orange
        case DATABASE_CONFIG.serviceStatus.CONFIRMED:
          return modernTheme.colors.success || '#C8E6C9'; // Very soft green
        case DATABASE_CONFIG.serviceStatus.CANCELLED:
          return modernTheme.colors.error || '#FFCDD2'; // Very soft red
        case DATABASE_CONFIG.serviceStatus.COMPLETED:
          return modernTheme.colors.success || '#C8E6C9'; // Green for completed
        default:
          return modernTheme.colors.primary;
      }
    };

    return (
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
            ],
            borderLeftColor: getBorderColor(item.status)
          }
        ]}
      >
        <View style={styles.servicioHeader}>
          <View style={styles.servicioTitleContainer}>
            <MaterialIcons name="cleaning-services" size={20} color={modernTheme.colors.primary} />
            <Text style={styles.servicioNombre}>{item.service_name || 'Servicio'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <StatusIcon status={item.status} size="sm" />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {isAdmin() && item.user && (
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={16} color={modernTheme.colors.text.secondary} />
            <Text style={styles.servicioText}>{item.user.name}</Text>
          </View>
        )}

        <View style={styles.servicioInfoContainer}>
          <View style={styles.servicioInfoRow}>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={16} color={modernTheme.colors.text.secondary} />
                <Text style={styles.servicioText}>{formatDate(item.assigned_date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={16} color={modernTheme.colors.text.secondary} />
                <Text style={styles.servicioText}>{getShiftDisplayName(item.shift)}</Text>
              </View>
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={16} color={modernTheme.colors.text.secondary} />
                <Text style={styles.servicioText}>{item.address || 'Sin dirección'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={16} color={modernTheme.colors.text.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.servicioText}>{item.phone || 'No especificado'}</Text>
                </View>
                {isAdmin() && item.phone && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                    <MaterialIcons name="call" size={16} color={modernTheme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {(item.hours || item.location) && (
            <View style={styles.servicioInfoRow}>
              <View style={styles.infoSection}>
                {item.hours && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="access-time" size={16} color={modernTheme.colors.text.secondary} />
                    <Text style={styles.servicioText}>{item.hours} horas</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <MaterialIcons name="attach-money" size={16} color={modernTheme.colors.text.secondary} />
                  <Text style={styles.servicioText}>${item.price || item.cost || 'Por definir'}</Text>
                </View>
              </View>
              <View style={styles.infoSection}>
                {item.location && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="place" size={16} color={modernTheme.colors.text.secondary} />
                    <Text style={styles.servicioText}>{item.location.location}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.servicioFooter}>
          {isAdmin() && hasPermission('canConfirmServices') && item.status === DATABASE_CONFIG.serviceStatus.PENDING && (
            <View style={styles.actionButtonsRow}>
              <IconButton
                icon="confirm"
                text="Confirmar"
                variant="primary"
                size="sm"
                onPress={() => handleServiceAction(item, 'confirm')}
                style={styles.actionButton}
              />
              <IconButton
                icon="reject"
                text="Cancelar"
                variant="primary"
                size="sm"
                onPress={() => handleServiceAction(item, 'cancel')}
                style={styles.actionButton}
              />
              {isAdmin() && (item.user_id === userProfile?.id || isAdmin()) && (
                <IconButton
                  icon="edit"
                  text="Editar"
                  variant="outline"
                  size="sm"
                  onPress={() => openEditModal(item)}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}
          {isAdmin() && hasPermission('canConfirmServices') && item.status === DATABASE_CONFIG.serviceStatus.CONFIRMED && (
            <View style={styles.actionButtonsRow}>
              <IconButton
                icon="complete"
                text="Completar"
                variant="primary"
                size="sm"
                onPress={() => handleServiceAction(item, 'complete')}
                style={styles.actionButton}
              />
              {isAdmin() && (item.user_id === userProfile?.id || isAdmin()) && (
                <IconButton
                  icon="edit"
                  text="Editar"
                  variant="outline"
                  size="sm"
                  onPress={() => openEditModal(item)}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}
          {isAdmin() && (!hasPermission('canConfirmServices') || item.status !== DATABASE_CONFIG.serviceStatus.PENDING && item.status !== DATABASE_CONFIG.serviceStatus.CONFIRMED) && (item.user_id === userProfile?.id || isAdmin()) && (
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

  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <MaterialIcons name="cleaning-services" size={28} color={modernTheme.colors.text.inverse} />
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

      {/* Compact Search and Filter Bar */}
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
          onPress={() => setShowFiltersMenu(!showFiltersMenu)}
        >
          <MaterialIcons
            name="tune"
            size={20}
            color={showFiltersMenu ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Filter Menu */}
      {showFiltersMenu && (
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
            <Text style={styles.filterSectionTitle}>Buscar por</Text>
            <View style={styles.searchTypeOptions}>
              <TouchableOpacity
                style={[styles.searchTypeOption, searchType === 'location' && styles.searchTypeOptionSelected]}
                onPress={() => setSearchType('location')}
              >
                <MaterialIcons
                  name="location-on"
                  size={16}
                  color={searchType === 'location' ? modernTheme.colors.primary : modernTheme.colors.text.secondary}
                />
                <Text style={[styles.searchTypeOptionText, searchType === 'location' && styles.searchTypeOptionTextSelected]}>
                  Ubicación
                </Text>
              </TouchableOpacity>
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
                  Tipo
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
              onPress={() => {
                setSelectedStatus(null);
                setSearchText('');
              }}
            >
              <MaterialIcons name="clear-all" size={16} color={modernTheme.colors.error} />
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={modernTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredServicios}
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
                <MaterialIcons
                  name="cleaning-services"
                  size={40}
                  color={modernTheme.colors.text.muted}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>
                  {isAdmin() ? 'No hay servicios registrados' : 'No tienes servicios solicitados'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {hasPermission('canCreateServices') &&
                    `Toca el botón "+" para ${isAdmin() ? 'crear' : 'solicitar'} un servicio`
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>

      {hasPermission('canCreateServices') && (
        <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
          <MaterialIcons name="add" size={24} color={modernTheme.colors.text.inverse} />
        </TouchableOpacity>
      )}

      {/* Modal */}
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
              <MaterialIcons name="cleaning-services" size={28} color={modernTheme.colors.primary} />
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Servicio' : isAdmin() ? 'Crear Servicio' : 'Solicitar Servicio'}
              </Text>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del servicio *</Text>
                <View style={[styles.modalInput, attemptedSave && !serviceData.service_name && styles.errorInput]}>
                  <Picker
                    selectedValue={serviceData.service_name}
                    onValueChange={(itemValue) => setServiceData(prev => ({ ...prev, service_name: itemValue }))}
                    style={{ color: modernTheme.colors.text.primary }}
                    itemStyle={{ color: modernTheme.colors.text.primary }}
                  >
                    <Picker.Item label="Seleccionar tipo de servicio" value="" />
                    {availableServices.map((service) => (
                      <Picker.Item key={service.id} label={service.name} value={service.name} />
                    ))}
                  </Picker>
                </View>
              </View>

              {isAdmin() && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cliente *</Text>
                  <View style={[styles.modalInput, attemptedSave && !selectedUserId && styles.errorInput]}>
                    <Picker
                      selectedValue={selectedUserId}
                      onValueChange={(itemValue) => setSelectedUserId(itemValue)}
                      style={{ color: modernTheme.colors.text.primary }}
                      itemStyle={{ color: modernTheme.colors.text.primary }}
                    >
                      <Picker.Item label="Seleccionar cliente" value={null} />
                      {users.map((user) => (
                        <Picker.Item key={user.id} label={`${user.name} (${user.email})`} value={user.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fecha *</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.modalInput, attemptedSave && !serviceData.assigned_date && styles.errorInput]}>
                  <Text style={{ color: serviceData.assigned_date ? modernTheme.colors.text.primary : modernTheme.colors.text.muted, fontSize: 14 }}>
                    {serviceData.assigned_date ? formatDate(serviceData.assigned_date) : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
                <Modal visible={showDatePicker} transparent={true} animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' }}>
                      <Calendar
                        onDayPress={(day) => {
                          setSelectedDate(new Date(day.year, day.month - 1, day.day));
                          setServiceData(prev => ({ ...prev, assigned_date: day.dateString }));
                          setShowDatePicker(false);
                        }}
                        markedDates={{
                          [serviceData.assigned_date]: { selected: true, selectedColor: modernTheme.colors.primary }
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: 10, alignSelf: 'center' }}>
                        <Text style={{ color: modernTheme.colors.text.primary }}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección *</Text>
                <TextInput
                  style={[styles.modalInput, attemptedSave && !serviceData.address && styles.errorInput]}
                  placeholder="Calle 123, Ciudad"
                  value={serviceData.address}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, address: text }))}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación *</Text>
                <View style={[styles.modalInput, attemptedSave && !serviceData.location_id && styles.errorInput]}>
                  <Picker
                    selectedValue={serviceData.location_id}
                    onValueChange={(itemValue) => setServiceData(prev => ({ ...prev, location_id: itemValue }))}
                    style={{ color: modernTheme.colors.text.primary }}
                    itemStyle={{ color: modernTheme.colors.text.primary }}
                  >
                    <Picker.Item label="Seleccionar ubicación" value={null} />
                    {locations.map((location) => (
                      <Picker.Item key={location.id} label={location.location} value={location.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={[styles.modalInput, attemptedSave && !serviceData.phone && styles.errorInput]}
                  placeholder="+34 600 123 456"
                  value={serviceData.phone}
                  onChangeText={(text) => setServiceData(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              <View style={styles.shiftContainer}>
                <Text style={styles.inputLabel}>Turno *</Text>
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
                      <MaterialIcons
                        name="schedule"
                        size={18}
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
                <View style={styles.modalInput}>
                  <Picker
                    selectedValue={serviceData.hours}
                    onValueChange={(itemValue) => setServiceData(prev => ({ ...prev, hours: itemValue }))}
                    style={{ color: modernTheme.colors.text.primary }}
                    itemStyle={{ color: modernTheme.colors.text.primary }}
                  >
                    <Picker.Item label="Seleccionar horas" value="" />
                    {Array.from({ length: 9 }, (_, i) => i + 4).map((hour) => (
                      <Picker.Item key={hour} label={`${hour} horas`} value={hour.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>

              {discountInfo && (
                <View style={styles.discountInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: modernTheme.spacing.sm }}>
                    <MaterialIcons name="local-offer" size={20} color={modernTheme.colors.success} />
                    <Text style={styles.discountInfoText}>
                      ¡Este cliente puede recibir un descuento {discountInfo.discountPercentage}%!
                    </Text>
                  </View>
                  <Text style={styles.discountInfoSubtext}>
                    Ha completado {discountInfo.servicesCompleted} de {discountInfo.servicesRequired} servicios requeridos.
                  </Text>
                </View>
              )}
            </ScrollView>

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

      {/* Price Modal */}
      <Modal
        visible={showPriceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información de Precios</Text>
            <Text style={{ marginBottom: 10 }}>Precio: 20€ por hora</Text>
            <Text style={{ marginBottom: 10 }}>Se cobra por horas con un mínimo de 4 horas. Vendrán 2 personas (cada persona realiza 2 horas de trabajo).</Text>
            <Text style={{ marginBottom: 20, fontWeight: 'bold' }}>Total a pagar: {20 * parseInt(serviceData.hours)}€</Text>
            <View style={styles.modalButtons}>
              <IconButton
                text="Cancelar"
                variant="outline"
                size="md"
                onPress={() => setShowPriceModal(false)}
                style={styles.modalButton}
              />
              <IconButton
                text="Confirmar"
                variant="primary"
                size="md"
                onPress={async () => {
                  const userId = isAdmin() ? selectedUserId : userProfile?.id;
                  const { error } = await serviceService.createUserService({ ...serviceData, user_id: userId });
                  if (error) {
                    Alert.alert('Error', 'No se pudo crear el servicio');
                  } else {
                    Alert.alert('Éxito', 'Servicio creado');
                    setShowPriceModal(false);
                    setShowCreateModal(false);
                    loadServicios();
                  }
                }}
                style={styles.modalButton}
              />
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
    backgroundColor: modernTheme.colors.background.primary,
  },

  // Header
  header: {
    backgroundColor: modernTheme.colors.primary,
    paddingTop: modernTheme.spacing.lg + 8,
    paddingBottom: modernTheme.spacing.md,
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
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.inverse,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse + '90',
  },

  // Search Bar
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

  // Filter Panel
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

  // Content
  content: {
    flex: 1,
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
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    paddingBottom: 80,
  },

  // Service Card
  servicioCard: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.lg,
    marginBottom: modernTheme.spacing.sm,
    ...modernTheme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
  },
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  servicioTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: modernTheme.spacing.sm,
  },
  servicioNombre: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginLeft: modernTheme.spacing.xs,
  },
  servicioInfoContainer: {
    marginBottom: modernTheme.spacing.sm,
  },
  servicioInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: modernTheme.spacing.xs,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: modernTheme.spacing.sm,
  },
  servicioInfoGrid: {
    flexDirection: 'row',
    marginBottom: modernTheme.spacing.xs,
    gap: modernTheme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: modernTheme.spacing.xs,
    marginBottom: modernTheme.spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: modernTheme.spacing.xs,
    marginBottom: 0,
  },
  infoLabel: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.primary,
    fontWeight: '600',
  },
  servicioText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    flex: 1,
  },
  servicioFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: modernTheme.spacing.sm,
    marginTop: modernTheme.spacing.sm,
    paddingTop: modernTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: modernTheme.spacing.xs,
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonFull: {
    flex: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: modernTheme.spacing.xxl,
  },
  emptyIcon: {
    marginBottom: modernTheme.spacing.lg,
    opacity: 0.5,
  },
  emptyText: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  emptySubtext: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
    textAlign: 'center',
  },

  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: modernTheme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...modernTheme.shadows.medium,
  },

  // Modal
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
    marginBottom: modernTheme.spacing.lg,
  },
  modalTitle: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginTop: modernTheme.spacing.md,
  },
  modalForm: {
    marginBottom: modernTheme.spacing.lg,
    maxHeight: '70%',
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
  errorInput: {
    borderColor: modernTheme.colors.error || '#e74c3c',
  },
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
  discountInfo: {
    backgroundColor: modernTheme.colors.success + '15',
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.md,
    marginBottom: modernTheme.spacing.md,
  },
  discountInfoText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.success,
    fontWeight: '600',
  },
  discountInfoSubtext: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginTop: modernTheme.spacing.xs,
  },
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