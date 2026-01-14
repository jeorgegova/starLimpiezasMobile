/**
 * Pantalla de Descuentos para Star Limpiezas Mobile
 * Solo accesible para administradores
 * Gestiona service_discount_config
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
import { bonificationService, serviceService, utilityService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Picker} from '@react-native-picker/picker';

const BonificationsScreen = () => {
  const navigation = useNavigation();
  const { userName, hasPermission, isAdmin } = useAuth();

  const [discountConfigs, setDiscountConfigs] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const [discountData, setDiscountData] = useState({
    service_type: '',
    discount_percentage: 0,
    active: true,
    services_required: 1
  });

  // Temporary string values for inputs
  const [discountPercentageText, setDiscountPercentageText] = useState('');
  const [servicesRequiredText, setServicesRequiredText] = useState('');

  useEffect(() => {
    // Verificar permisos
    if (!isAdmin() || !hasPermission('canManageBonuses')) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para acceder a esta sección.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    loadData();
    loadAvailableServices();
  }, [isAdmin, hasPermission, navigation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await bonificationService.getDiscountConfigs();
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las configuraciones de descuento');
      } else {
        const discounts = data || [];
        setDiscountConfigs(discounts);
        setFilteredDiscounts(discounts);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableServices = async () => {
    const { data, error } = await serviceService.getAvailableServices();
    if (!error) {
      setAvailableServices(data || []);
    }
  };

  // Filter discounts based on status
  const applyFilters = () => {
    let filtered = [...discountConfigs];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(discount =>
        statusFilter === 'active' ? discount.active : !discount.active
      );
    }
    setFilteredDiscounts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [discountConfigs, statusFilter]);

  const formatDate = (dateString) => utilityService.formatDate(dateString);

  const onRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  // Funciones para Discount Configs
  const openDiscountModal = (discount = null) => {
    setEditingDiscount(discount);
    if (discount) {
      setDiscountData({
        service_type: discount.service_type || '',
        discount_percentage: discount.discount_percentage || 0,
        active: discount.active !== false,
        services_required: discount.services_required || 1
      });
      setDiscountPercentageText(discount.discount_percentage ? discount.discount_percentage.toString() : '');
      setServicesRequiredText(discount.services_required ? discount.services_required.toString() : '');
    } else {
      setDiscountData({
        service_type: '',
        discount_percentage: 0,
        active: true,
        services_required: 1
      });
      setDiscountPercentageText('');
      setServicesRequiredText('');
    }
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountData.service_type || discountPercentageText === '' || parseFloat(discountPercentageText) < 0 || parseFloat(discountPercentageText) > 100 || servicesRequiredText === '' || parseInt(servicesRequiredText) < 1) {
      Alert.alert('Error', 'Por favor completa los campos requeridos correctamente');
      return;
    }

    try {
      if (editingDiscount) {
        // Actualizar
        const { data, error } = await bonificationService.updateDiscountConfig(
          editingDiscount.id,
          discountData
        );
        if (error) {
          Alert.alert('Error', 'No se pudo actualizar la configuración de descuento');
        } else {
          Alert.alert('Éxito', 'Configuración de descuento actualizada');
          setShowDiscountModal(false);
          loadData();
        }
      } else {
        // Crear
        const { data, error } = await bonificationService.createDiscountConfig(discountData);
        if (error) {
          Alert.alert('Error', 'No se pudo crear la configuración de descuento');
        } else {
          Alert.alert('Éxito', 'Configuración de descuento creada');
          setShowDiscountModal(false);
          loadData();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const toggleDiscountStatus = async (discount) => {
    try {
      const { data, error } = await bonificationService.updateDiscountConfig(
        discount.id,
        { active: !discount.active }
      );
      if (error) {
        Alert.alert('Error', 'No se pudo cambiar el estado del descuento');
      } else {
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const renderDiscountItem = ({ item }) => (
    <View style={styles.discountCard}>
      <View style={styles.discountHeader}>
        <Text style={styles.discountService}>{item.service_type}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.active ? modernTheme.colors.successDark : modernTheme.colors.error }
        ]}>
          <Text style={styles.statusBadgeText}>
            {item.active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
      <Text style={styles.discountDetails}>
        Descuento: {item.discount_percentage}% | Servicios requeridos: {item.services_required}
      </Text>
      <Text style={styles.discountDate}>
        Actualizado: {formatDate(item.updated_at)}
      </Text>
      <View style={styles.discountActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openDiscountModal(item)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: item.active ? modernTheme.colors.error : modernTheme.colors.successDark }]}
          onPress={() => toggleDiscountStatus(item)}
        >
          <Text style={styles.statusButtonText}>
            {item.active ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Verificar permisos antes de renderizar
  if (!isAdmin() || !hasPermission('canManageBonuses')) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedSubtext}>
          No tienes permisos para acceder a esta sección.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleSection}>
            <MaterialIcons name="card-giftcard" size={28} color={modernTheme.colors.text.inverse} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Gestión de Descuentos</Text>
              <Text style={styles.headerSubtitle}>
                Bienvenido, {userName}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
            Todos ({discountConfigs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('active')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'active' && styles.filterButtonTextActive]}>
            Activos ({discountConfigs.filter(d => d.active).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'inactive' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('inactive')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'inactive' && styles.filterButtonTextActive]}>
            Inactivos ({discountConfigs.filter(d => !d.active).length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={modernTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando configuraciones de descuento...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDiscounts}
            renderItem={renderDiscountItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[modernTheme.colors.primary]} tintColor={modernTheme.colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="discount" size={40} color={modernTheme.colors.text.muted} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No hay configuraciones de descuento</Text>
                <Text style={styles.emptySubtext}>
                  Crea la primera configuración de descuento
                </Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity style={styles.floatingButton} onPress={() => openDiscountModal()}>
        <MaterialIcons name="add" size={24} color={modernTheme.colors.text.inverse} />
      </TouchableOpacity>

      {/* Modal para Discount Configs */}
      <Modal
        visible={showDiscountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="discount" size={28} color={modernTheme.colors.primary} />
              <Text style={styles.modalTitle}>
                {editingDiscount ? 'Editar Configuración de Descuento' : 'Crear Configuración de Descuento'}
              </Text>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo de Servicio *</Text>
                <View style={styles.modalInput}>
                  <Picker
                    selectedValue={discountData.service_type}
                    onValueChange={(itemValue) => setDiscountData(prev => ({ ...prev, service_type: itemValue }))}
                    style={{color: modernTheme.colors.text.primary}}
                    itemStyle={{color: modernTheme.colors.text.primary}}
                  >
                    <Picker.Item label="Seleccionar tipo de servicio" value="" />
                    {availableServices.map((service) => (
                      <Picker.Item key={service.id} label={service.name} value={service.name} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Porcentaje de Descuento *</Text>
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    style={styles.percentageInput}
                    value={discountPercentageText}
                    onChangeText={(text) => {
                      setDiscountPercentageText(text);
                      const value = parseFloat(text) || 0;
                      setDiscountData(prev => ({ ...prev, discount_percentage: value }));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.percentageSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Servicios Requeridos *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={servicesRequiredText}
                  onChangeText={(text) => {
                    setServicesRequiredText(text);
                    const value = parseInt(text) || 1;
                    setDiscountData(prev => ({ ...prev, services_required: value }));
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Activo:</Text>
                <TouchableOpacity
                  style={[styles.switch, discountData.active && styles.switchActive]}
                  onPress={() => setDiscountData(prev => ({ ...prev, active: !prev.active }))}
                >
                  <Text style={[styles.switchText, discountData.active && styles.switchTextActive]}>
                    {discountData.active ? 'Sí' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDiscountModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveDiscount}
              >
                <Text style={styles.saveButtonText}>
                  {editingDiscount ? 'Actualizar' : 'Crear'}
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
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.primary,
  },

  // Acceso denegado
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.primary,
    padding: modernTheme.spacing.lg,
  },
  accessDeniedText: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.error,
    marginBottom: modernTheme.spacing.md,
  },
  accessDeniedSubtext: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.muted,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.xl,
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
  backButton: {
    marginBottom: modernTheme.spacing.md,
    padding: modernTheme.spacing.sm,
  },
  backButtonText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '500',
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

  // Filter
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: modernTheme.colors.surface.primary,
    marginHorizontal: modernTheme.spacing.lg,
    marginVertical: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.lg,
    padding: modernTheme.spacing.sm,
    ...modernTheme.shadows.medium,
  },
  filterButton: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.md,
  },
  filterButtonActive: {
    backgroundColor: modernTheme.colors.primary,
  },
  filterButtonText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: modernTheme.colors.text.inverse,
  },

  // Contenido
  content: {
    flex: 1,
    paddingHorizontal: modernTheme.spacing.lg,
  },

  // Loading
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

  // Lista
  listContainer: {
    paddingBottom: modernTheme.spacing.xl,
  },

  // Tarjetas de descuento
  discountCard: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.lg,
    marginBottom: modernTheme.spacing.sm,
    ...modernTheme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.warning,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  discountService: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.lg,
  },
  statusBadgeText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  discountDetails: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  discountDate: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
  },
  discountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: modernTheme.spacing.sm,
  },

  // Botones
  editButton: {
    backgroundColor: modernTheme.colors.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
    marginRight: modernTheme.spacing.xs,
  },
  editButtonText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  statusButton: {
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
    marginLeft: modernTheme.spacing.xs,
  },
  statusButtonText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },

  // Estado vacío
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

  // Botón flotante
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
    maxHeight: '80%',
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
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...modernTheme.componentStyles.input,
  },
  percentageInput: {
    flex: 1,
    color: modernTheme.colors.text.primary,
  },
  percentageSymbol: {
    marginLeft: modernTheme.spacing.sm,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    fontWeight: 'bold',
  },
  modalInput: {
    ...modernTheme.componentStyles.input,
    marginBottom: modernTheme.spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  switchLabel: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.primary,
    fontWeight: '600',
    marginRight: modernTheme.spacing.md,
  },
  switch: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.xl,
    borderWidth: 2,
    borderColor: modernTheme.colors.border.primary,
  },
  switchActive: {
    backgroundColor: modernTheme.colors.success,
    borderColor: modernTheme.colors.success,
  },
  switchText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    fontWeight: '600',
  },
  switchTextActive: {
    color: modernTheme.colors.text.inverse,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: modernTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: modernTheme.colors.text.secondary,
  },
  saveButton: {
    backgroundColor: modernTheme.colors.primary,
  },
  cancelButtonText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },
  saveButtonText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },
});

export default BonificationsScreen;