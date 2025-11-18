/**
 * Pantalla de Bonificaciones para Star Limpiezas Mobile
 * Solo accesible para administradores
 * Gestiona customer_loyalty y service_discount_config
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
import { bonificationService, DATABASE_CONFIG } from '../services';

const BonificationsScreen = () => {
  const navigation = useNavigation();
  const { userName, hasPermission, isAdmin } = useAuth();

  const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);
  const [discountConfigs, setDiscountConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('loyalty'); // 'loyalty' or 'discounts'
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const [loyaltyData, setLoyaltyData] = useState({
    user_id: '',
    service_type: '',
    points: 0
  });

  const [discountData, setDiscountData] = useState({
    service_type: '',
    discount_percentage: 0,
    active: true,
    services_required: 1
  });

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
  }, [isAdmin, hasPermission, navigation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loyaltyResult, discountResult] = await Promise.all([
        supabaseClient.getLoyaltyPrograms(),
        supabaseClient.getDiscountConfigs()
      ]);

      if (loyaltyResult.data) {
        setLoyaltyPrograms(loyaltyResult.data);
      }
      if (discountResult.data) {
        setDiscountConfigs(discountResult.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de bonificaciones');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  // Funciones para Loyalty Programs
  const openLoyaltyModal = (loyalty = null) => {
    setEditingLoyalty(loyalty);
    if (loyalty) {
      setLoyaltyData({
        user_id: loyalty.user_id || '',
        service_type: loyalty.service_type || '',
        points: loyalty.points || 0
      });
    } else {
      setLoyaltyData({
        user_id: '',
        service_type: '',
        points: 0
      });
    }
    setShowLoyaltyModal(true);
  };

  const handleSaveLoyalty = async () => {
    if (!loyaltyData.user_id || !loyaltyData.service_type) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    try {
      if (editingLoyalty) {
        // Actualizar
        const { data, error } = await bonificationService.updateLoyaltyProgram(
          editingLoyalty.id,
          loyaltyData
        );
        if (error) {
          Alert.alert('Error', 'No se pudo actualizar el programa de lealtad');
        } else {
          Alert.alert('Éxito', 'Programa de lealtad actualizado');
          setShowLoyaltyModal(false);
          loadData();
        }
      } else {
        // Crear
        const { data, error } = await bonificationService.createLoyaltyProgram(loyaltyData);
        if (error) {
          Alert.alert('Error', 'No se pudo crear el programa de lealtad');
        } else {
          Alert.alert('Éxito', 'Programa de lealtad creado');
          setShowLoyaltyModal(false);
          loadData();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
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
    } else {
      setDiscountData({
        service_type: '',
        discount_percentage: 0,
        active: true,
        services_required: 1
      });
    }
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountData.service_type || discountData.discount_percentage <= 0) {
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

  const renderLoyaltyItem = ({ item }) => (
    <View style={styles.loyaltyCard}>
      <View style={styles.loyaltyHeader}>
        <Text style={styles.loyaltyService}>{item.service_type}</Text>
        <Text style={styles.loyaltyPoints}>{item.points} puntos</Text>
      </View>
      <Text style={styles.loyaltyUser}>Usuario ID: {item.user_id}</Text>
      <Text style={styles.loyaltyDate}>
        Actualizado: {new Date(item.updated_at).toLocaleDateString('es-ES')}
      </Text>
      <View style={styles.loyaltyActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openLoyaltyModal(item)}
        >
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDiscountItem = ({ item }) => (
    <View style={styles.discountCard}>
      <View style={styles.discountHeader}>
        <Text style={styles.discountService}>{item.service_type}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.active ? '#2ecc71' : '#e74c3c' }
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
        Actualizado: {new Date(item.updated_at).toLocaleDateString('es-ES')}
      </Text>
      <View style={styles.discountActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openDiscountModal(item)}
        >
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: item.active ? '#e74c3c' : '#2ecc71' }]}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎁 Gestión de Bonificaciones</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loyalty' && styles.tabActive]}
          onPress={() => setActiveTab('loyalty')}
        >
          <Text style={[styles.tabText, activeTab === 'loyalty' && styles.tabTextActive]}>
            👑 Programas de Lealtad
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discounts' && styles.tabActive]}
          onPress={() => setActiveTab('discounts')}
        >
          <Text style={[styles.tabText, activeTab === 'discounts' && styles.tabTextActive]}>
            💰 Descuentos
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'loyalty' && (
          <>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openLoyaltyModal()}
              >
                <Text style={styles.addButtonText}>➕ Crear Programa de Lealtad</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Cargando programas de lealtad...</Text>
              </View>
            ) : (
              <FlatList
                data={loyaltyPrograms}
                renderItem={renderLoyaltyItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay programas de lealtad</Text>
                    <Text style={styles.emptySubtext}>
                      Crea el primer programa de lealtad para tus clientes
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}

        {activeTab === 'discounts' && (
          <>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openDiscountModal()}
              >
                <Text style={styles.addButtonText}>➕ Crear Configuración de Descuento</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Cargando configuraciones de descuento...</Text>
              </View>
            ) : (
              <FlatList
                data={discountConfigs}
                renderItem={renderDiscountItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay configuraciones de descuento</Text>
                    <Text style={styles.emptySubtext}>
                      Crea la primera configuración de descuento
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>

      {/* Modal para Loyalty Programs */}
      <Modal
        visible={showLoyaltyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoyaltyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLoyalty ? 'Editar Programa de Lealtad' : 'Crear Programa de Lealtad'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="ID de Usuario *"
              value={loyaltyData.user_id}
              onChangeText={(text) => setLoyaltyData(prev => ({ ...prev, user_id: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Tipo de Servicio *"
              value={loyaltyData.service_type}
              onChangeText={(text) => setLoyaltyData(prev => ({ ...prev, service_type: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Puntos"
              value={loyaltyData.points.toString()}
              onChangeText={(text) => setLoyaltyData(prev => ({
                ...prev,
                points: parseInt(text) || 0
              }))}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLoyaltyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveLoyalty}
              >
                <Text style={styles.saveButtonText}>
                  {editingLoyalty ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Discount Configs */}
      <Modal
        visible={showDiscountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDiscount ? 'Editar Configuración de Descuento' : 'Crear Configuración de Descuento'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tipo de Servicio *"
              value={discountData.service_type}
              onChangeText={(text) => setDiscountData(prev => ({ ...prev, service_type: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Porcentaje de Descuento *"
              value={discountData.discount_percentage.toString()}
              onChangeText={(text) => setDiscountData(prev => ({
                ...prev,
                discount_percentage: parseFloat(text) || 0
              }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Servicios Requeridos"
              value={discountData.services_required.toString()}
              onChangeText={(text) => setDiscountData(prev => ({
                ...prev,
                services_required: parseInt(text) || 1
              }))}
              keyboardType="numeric"
            />

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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
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
    backgroundColor: '#8e44ad',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#8e44ad',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  tabTextActive: {
    color: '#ffffff',
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
  listContainer: {
    paddingBottom: 20,
  },
  loyaltyCard: {
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
    borderLeftColor: '#8e44ad',
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loyaltyService: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  loyaltyPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  loyaltyUser: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  loyaltyDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  loyaltyActions: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  discountCard: {
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
    borderLeftColor: '#f39c12',
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountService: {
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
  discountDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  discountDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  discountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusButton: {
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5,
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 15,
  },
  switch: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  switchActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  switchText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#ffffff',
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
    backgroundColor: '#8e44ad',
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

export default BonificationsScreen;