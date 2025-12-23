/**
 * Pantalla de Clientes para Star Limpiezas Mobile
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
import { userService, serviceService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const ClientesScreen = () => {
  const navigation = useNavigation();
  const { userName } = useAuth();


  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  
  // Estados para el modal de servicios
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Estados para el modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  const [serviciosCliente, setServiciosCliente] = useState([]);
  const [serviciosCargados, setServiciosCargados] = useState([]); // Todos los servicios originales
  const [serviciosLoading, setServiciosLoading] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busquedaFiltro, setBusquedaFiltro] = useState('');

  const [estadoVisible, setEstadoVisible] = useState(true); // Controlar visibilidad de filtros por estado




  useEffect(() => {
    loadClientes();
  }, []);

  // Función para filtrar clientes por nombre
  const filtrarClientes = (texto) => {
    if (!texto.trim()) {
      setClientesFiltrados(clientes);
    } else {
      const clientesFiltrados = clientes.filter(cliente =>
        cliente.name?.toLowerCase().includes(texto.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(texto.toLowerCase()) ||
        cliente.phone?.toLowerCase().includes(texto.toLowerCase())
      );
      setClientesFiltrados(clientesFiltrados);
    }
  };

  // Aplicar filtro automáticamente cuando cambie la búsqueda
  useEffect(() => {
    filtrarClientes(busquedaCliente);
  }, [busquedaCliente, clientes]);


  const loadClientes = async () => {
    setLoading(true);
    try {
      // Obtener usuarios con rol 'user' (clientes)
      const { data, error } = await userService.getUsersByRole(DATABASE_CONFIG.roles.USER);
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los clientes');
      } else {
        const clientesData = data || [];
        setClientes(clientesData);
        setClientesFiltrados(clientesData); // Inicializar clientes filtrados
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientes().finally(() => setRefreshing(false));
  };

  // Función para abrir el modal de servicios
  const openServicesModal = async (cliente) => {
    setSelectedCliente(cliente);
    setShowServicesModal(true);
    setServiciosLoading(true);
    
    try {
      // Cargar todos los servicios sin filtros
      const { data, error } = await serviceService.getUserServices(cliente.id, false);
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
        console.error('Error loading services:', error);
      } else {
        const servicios = data || [];
        setServiciosCargados(servicios);
        setServiciosCliente(servicios); // Mostrar todos inicialmente
        

        // Limpiar filtros al abrir modal
        setEstadoFiltro('');
        setBusquedaFiltro('');
        
        console.log('Servicios del cliente cargados:', servicios.length);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error('Error:', error);
    } finally {
      setServiciosLoading(false);
    }
  };


  // Función para aplicar filtros por estado y búsqueda automáticamente
  const aplicarFiltros = () => {
    try {
      let serviciosFiltrados = [...serviciosCargados]; // Copia de todos los servicios
      
      // Filtrar por estado
      if (estadoFiltro !== '') {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => 
          servicio.status === estadoFiltro
        );
      }
      
      // Filtrar por texto de búsqueda
      if (busquedaFiltro.trim() !== '') {
        serviciosFiltrados = serviciosFiltrados.filter(servicio => 
          servicio.service_name?.toLowerCase().includes(busquedaFiltro.toLowerCase()) ||
          servicio.address?.toLowerCase().includes(busquedaFiltro.toLowerCase()) ||
          servicio.location?.location?.toLowerCase().includes(busquedaFiltro.toLowerCase())
        );
      }
      
      setServiciosCliente(serviciosFiltrados);
      console.log(`Filtros aplicados: ${serviciosFiltrados.length} servicios encontrados de ${serviciosCargados.length}`);
    } catch (error) {
      Alert.alert('Error', 'Error al aplicar filtros');
      console.error('Error filtering services:', error);
    }
  };


  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setEstadoFiltro('');
    setBusquedaFiltro('');
    setServiciosCliente(serviciosCargados); // Mostrar todos los servicios cargados
  };



  // Función para contar servicios por estado
  const contarServiciosPorEstado = () => {
    const contadores = {
      todos: serviciosCargados.length,
      pending: serviciosCargados.filter(s => s.status === 'pending').length,
      confirmed: serviciosCargados.filter(s => s.status === 'confirmed').length,
      in_progress: serviciosCargados.filter(s => s.status === 'in_progress').length,
      completed: serviciosCargados.filter(s => s.status === 'completed').length,
      cancelled: serviciosCargados.filter(s => s.status === 'cancelled').length,
    };
    return contadores;
  };

  // Aplicar filtros automáticamente cuando cambien los valores de filtro
  useEffect(() => {
    if (showServicesModal && serviciosCargados.length > 0) {
      aplicarFiltros();
    }
  }, [estadoFiltro, busquedaFiltro, showServicesModal, serviciosCargados]);

  // Función para manejar cambio de estado sin delay
  const handleEstadoChange = (estado) => {
    setEstadoFiltro(estado);
  };

  // Función para manejar cambio de búsqueda sin delay
  const handleBusquedaChange = (texto) => {
    setBusquedaFiltro(texto);
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'confirmed':
        return '#3498db';
      case 'in_progress':
        return '#9b59b6';
      case 'completed':
        return '#27ae60';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };



  const getStatusSpanish = (status) => {
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

  const renderCliente = ({ item }) => (
    <View style={styles.clienteCard}>
      <View style={styles.clienteHeader}>
        <Text style={styles.clienteNombre}>{item.name || 'Cliente'}</Text>
        <View style={styles.clienteStatus}>
          <Text style={styles.clienteStatusText}>
            👤 Usuario
          </Text>
        </View>
      </View>



      <View style={styles.clienteInfo}>
        <Text style={styles.clienteEmail}>📧 {item.email || 'Sin email'}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.clienteTelefono}>📱 {item.phone || 'Sin teléfono'}</Text>
          <TouchableOpacity
            style={styles.botonEditarInline}
            onPress={() => openEditModal(item)}
          >
            <MaterialIcons name="edit" size={16} color={modernTheme.colors.text.inverse} />
            <Text style={styles.botonEditarInlineText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.clienteDireccion}>📍 {item.address || 'Sin dirección'}</Text>
        <Text style={styles.clienteRegistro}>
          📅 Registrado: {formatDate(item.created_at)}
        </Text>
      </View>

      <View style={styles.clienteFooter}>
        <TouchableOpacity
          style={styles.botonVerServicios}
          onPress={() => openServicesModal(item)}
        >
          <Text style={styles.botonVerServiciosText}>🧹 Ver Servicios ({item.total_services || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonContactar}
          onPress={() => Alert.alert('Contactar', `Contactar a: ${item.name}`)}
        >
          <Text style={styles.botonContactarText}>📞 Contactar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  // Función para abrir el modal de creación
  const openCreateModal = () => {
    setCreateFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    });
    setShowCreateModal(true);
  };

  // Función para abrir el modal de edición
  const openEditModal = (cliente) => {
    setSelectedCliente(cliente);
    setEditFormData({
      name: cliente.name || '',
      email: cliente.email || '',
      phone: cliente.phone || '',
      address: cliente.address || ''
    });
    setShowEditModal(true);
  };

  // Función para cerrar el modal de edición
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCliente(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para guardar cambios
  const saveEditChanges = async () => {
    if (!selectedCliente) return;

    setEditLoading(true);
    try {
      console.log('Actualizando usuario con ID:', selectedCliente.id);
      console.log('Datos a actualizar:', editFormData);


      const { data, error } = await userService.updateUserProfile(selectedCliente.id, editFormData);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil del usuario');
        console.error('Error updating user:', error);
      } else if (!data || data.length === 0) {
        Alert.alert('Error', 'No se encontró el usuario para actualizar');
      } else {
        // Actualizar la lista de clientes localmente
        const clientesActualizados = clientes.map(cliente =>
          cliente.id === selectedCliente.id
            ? { ...cliente, ...editFormData }
            : cliente
        );
        setClientes(clientesActualizados);

        Alert.alert('Éxito', 'Usuario actualizado correctamente');
        closeEditModal();
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error('Error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Función para guardar nuevo cliente
  const saveCreateChanges = async () => {
    setCreateLoading(true);
    try {
      console.log('Creando nuevo cliente:', createFormData);

      const { success, error } = await userService.createClient(createFormData);

      if (error) {
        Alert.alert('Error', 'No se pudo crear el cliente: ' + error.message);
        console.error('Error creating client:', error);
      } else if (success) {
        Alert.alert('Éxito', 'Cliente creado correctamente');
        closeCreateModal();
        // Recargar la lista de clientes
        loadClientes();
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error('Error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  // Función para cerrar el modal de creación
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    });
  };

  // Función para manejar cambios en el formulario de creación
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleSection}>
            <MaterialIcons name="people" size={28} color={modernTheme.colors.text.inverse} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Gestión de Clientes</Text>
              <Text style={styles.headerSubtitle}>
                Bienvenido, {userName}
              </Text>
            </View>
          </View>
        </View>

      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={modernTheme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o teléfono..."
            value={busquedaCliente}
            onChangeText={setBusquedaCliente}
            placeholderTextColor={modernTheme.colors.text.muted}
          />
          {busquedaCliente !== '' && (
            <TouchableOpacity 
              onPress={() => setBusquedaCliente('')}
              style={styles.clearSearchButton}
            >
              <MaterialIcons name="clear" size={18} color={modernTheme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        {busquedaCliente !== '' && (
          <Text style={styles.searchResultsText}>
            {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>

        ) : (
          <FlatList
            data={clientesFiltrados}
            renderItem={renderCliente}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people" size={40} color={modernTheme.colors.text.muted} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No hay clientes registrados</Text>
                <Text style={styles.emptySubtext}>
                  Toca el botón "Agregar Nuevo Cliente" para comenzar
                </Text>
              </View>
            }
          />
        )}
      </View>


      <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
        <MaterialIcons name="add" size={24} color={modernTheme.colors.text.inverse} />
      </TouchableOpacity>



      {/* Modal de Servicios del Cliente */}
      <Modal
        visible={showServicesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.servicesModalContent}>

            {/* Header */}
            <View style={styles.servicesHeader}>
              <Text style={styles.servicesTitle}>
                🧹 Servicios de {selectedCliente?.name || 'Cliente'}
              </Text>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowServicesModal(false)}
              >
                <MaterialIcons name="close" size={24} color={modernTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>



            {/* Barra de búsqueda - Siempre visible */}
            <View style={styles.searchSection}>


              {/* Barra de búsqueda con botón de filtros */}
              <View style={styles.searchRow}>
                <MaterialIcons name="search" size={18} color={modernTheme.colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar servicios..."
                  value={busquedaFiltro}
                  onChangeText={handleBusquedaChange}
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
                <TouchableOpacity 
                  onPress={() => setEstadoVisible(!estadoVisible)}
                  style={styles.clearSearchButton}
                >
                  <MaterialIcons 
                    name={estadoVisible ? "expand-less" : "expand-more"} 
                    size={18} 
                    color={modernTheme.colors.primary} 
                  />
                </TouchableOpacity>
                {busquedaFiltro !== '' && (
                  <TouchableOpacity onPress={() => handleBusquedaChange('')}>
                    <MaterialIcons name="close" size={18} color={modernTheme.colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtros por estado - Condicional */}
              {estadoVisible && (
              <View style={styles.filtersPanel}>



              {/* Panel de filtros */}

              <View style={styles.filtersPanel}>
                <View style={styles.filtersLabelContainer}>
                  <Text style={styles.filtersLabel}>
                    Estado
                  </Text>
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        estadoFiltro === '' && styles.statusButtonActive
                      ]}
                      onPress={() => handleEstadoChange('')}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        estadoFiltro === '' && styles.statusButtonTextActive
                      ]}>
                        Todos({contarServiciosPorEstado().todos})
                      </Text>
                    </TouchableOpacity>

                    {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          estadoFiltro === status && styles.statusButtonActive
                        ]}
                        onPress={() => handleEstadoChange(status)}
                      >
                        <Text style={[
                          styles.statusButtonText,
                          estadoFiltro === status && styles.statusButtonTextActive
                        ]}>
                          {getStatusSpanish(status)}({contarServiciosPorEstado()[status]})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>



                {(estadoFiltro !== '' || busquedaFiltro !== '') && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={limpiarFiltros}
                  >
                    <MaterialIcons name="clear-all" size={16} color={modernTheme.colors.error} />
                    <Text style={styles.clearFiltersText}>
                      Limpiar filtros
                    </Text>
                  </TouchableOpacity>


                )}
              </View>
              </View>
              )}
            </View>

            {/* Lista de Servicios */}
            <View style={styles.servicesList}>
              {serviciosLoading ? (
                <View style={styles.loadingServices}>
                  <ActivityIndicator size="large" color={modernTheme.colors.primary} />
                  <Text style={styles.loadingServicesText}>
                    Cargando servicios...
                  </Text>
                </View>
              ) : serviciosCliente.length > 0 ? (
                <>
                  <Text style={styles.servicesCount}>
                    {serviciosCliente.length} Servicios Solicitados
                  </Text>
                  <FlatList
                    data={serviciosCliente}
                    renderItem={({ item }) => (
                      <View style={styles.serviceCard}>
                        <View style={styles.serviceHeader}>
                          <Text style={styles.serviceName}>
                            {item.service_name || 'Sin nombre'}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                            <Text style={styles.statusText}>
                              {getStatusSpanish(item.status) || 'Desconocido'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.serviceDetail}>
                          📍 {item.location?.location || 'Sin ubicación'}
                        </Text>
                        <Text style={styles.serviceDetail}>
                          🏠 {item.address || 'Sin dirección'}
                        </Text>
                        <Text style={styles.serviceDetail}>
                          📅 {formatDate(item.assigned_date)}
                        </Text>
                        <Text style={styles.serviceDetail}>
                          ⏰ {item.shift || 'Sin turno'} - {item.hours || '0'}h
                        </Text>
                        {item.notes && (
                          <Text style={styles.serviceNotes}>
                            📝 {item.notes}
                          </Text>
                        )}
                      </View>
                    )}
                    keyExtractor={(item, index) => `service-${item.id || index}`}
                    style={styles.servicesFlatList}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              ) : (
                <View style={styles.noServices}>
                  <MaterialIcons 
                    name="cleaning-services" 
                    size={40} 
                    color={modernTheme.colors.text.muted} 
                  />
                  <Text style={styles.noServicesText}>
                    No hay servicios registrados
                  </Text>

                  <Text style={styles.noServicesSubtext}>
                    {estadoFiltro 
                      ? 'No se encontraron servicios con el filtro aplicado' 
                      : 'Este cliente aún no tiene servicios'}
                  </Text>
                </View>
              )}
            </View>

          </View>
        </View>
      </Modal>



      {/* Modal de Edición de Usuario */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <MaterialIcons name="edit" size={28} color={modernTheme.colors.text.inverse} />
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeEditModal}
              >
                <MaterialIcons name="close" size={28} color={modernTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Contenido con Scroll */}
            <ScrollView 
              style={styles.formScrollView}
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nombre */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre Completo *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editFormData.name}
                  onChangeText={(value) => handleFormChange('name', value)}
                  placeholder="Ingresa el nombre completo"
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Correo Electrónico *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editFormData.email}
                  onChangeText={(value) => handleFormChange('email', value)}
                  placeholder="Ingresa el email"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Teléfono */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Número de Teléfono</Text>
                <TextInput
                  style={styles.formInput}
                  value={editFormData.phone}
                  onChangeText={(value) => handleFormChange('phone', value)}
                  placeholder="Ingresa el teléfono"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Dirección */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dirección</Text>
                <TextInput
                  style={[styles.formInput, styles.multilineInput]}
                  value={editFormData.address}
                  onChangeText={(value) => handleFormChange('address', value)}
                  placeholder="Ingresa la dirección completa"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Espacio adicional para scroll */}
              <View style={styles.scrollSpacer} />
            </ScrollView>

            {/* Botones */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditModal}
                disabled={editLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, editLoading && styles.disabledButton]}
                onPress={saveEditChanges}
                disabled={editLoading || !editFormData.name.trim() || !editFormData.email.trim()}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={modernTheme.colors.text.inverse} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Modal de Creación de Nuevo Cliente */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <MaterialIcons name="person-add" size={28} color={modernTheme.colors.text.inverse} />
              <Text style={styles.modalTitle}>Crear Nuevo Cliente</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeCreateModal}
              >
                <MaterialIcons name="close" size={28} color={modernTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Contenido con Scroll */}
            <ScrollView
              style={styles.formScrollView}
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nombre */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre Completo *</Text>
                <TextInput
                  style={styles.formInput}
                  value={createFormData.name}
                  onChangeText={(value) => handleCreateFormChange('name', value)}
                  placeholder="Ingresa el nombre completo"
                  placeholderTextColor={modernTheme.colors.text.muted}
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Correo Electrónico *</Text>
                <TextInput
                  style={styles.formInput}
                  value={createFormData.email}
                  onChangeText={(value) => handleCreateFormChange('email', value)}
                  placeholder="Ingresa el email"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Contraseña */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contraseña *</Text>
                <TextInput
                  style={styles.formInput}
                  value={createFormData.password}
                  onChangeText={(value) => handleCreateFormChange('password', value)}
                  placeholder="Ingresa una contraseña"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Teléfono */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Número de Teléfono</Text>
                <TextInput
                  style={styles.formInput}
                  value={createFormData.phone}
                  onChangeText={(value) => handleCreateFormChange('phone', value)}
                  placeholder="Ingresa el teléfono"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Dirección */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dirección</Text>
                <TextInput
                  style={[styles.formInput, styles.multilineInput]}
                  value={createFormData.address}
                  onChangeText={(value) => handleCreateFormChange('address', value)}
                  placeholder="Ingresa la dirección completa"
                  placeholderTextColor={modernTheme.colors.text.muted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Espacio adicional para scroll */}
              <View style={styles.scrollSpacer} />
            </ScrollView>

            {/* Botones */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeCreateModal}
                disabled={createLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, createLoading && styles.disabledButton]}
                onPress={saveCreateChanges}
                disabled={createLoading || !createFormData.name.trim() || !createFormData.email.trim() || !createFormData.password.trim()}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color={modernTheme.colors.text.inverse} />
                ) : (
                  <Text style={styles.saveButtonText}>Crear Cliente</Text>
                )}
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

  // Contenido principal
  content: {
    flex: 1,
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

  // Lista de clientes
  listaContainer: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    paddingBottom: 80,
  },

  // Tarjeta de cliente
  clienteCard: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.lg,
    marginBottom: modernTheme.spacing.sm,
    ...modernTheme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  clienteNombre: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  clienteStatus: {
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    backgroundColor: modernTheme.colors.background.secondary,
  },
  clienteStatusText: {
    ...modernTheme.typography.bodySmall,
    fontWeight: '500',
  },
  clienteInfo: {
    marginBottom: modernTheme.spacing.sm,
  },
  clienteEmail: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  clienteTelefono: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    flex: 1,
  },
  clienteDireccion: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  clienteRegistro: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
  },
  clienteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: modernTheme.spacing.xs,
    marginTop: modernTheme.spacing.sm,
    paddingTop: modernTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
  },

  // Botones
  botonEditarInline: {
    backgroundColor: modernTheme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: modernTheme.spacing.sm,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.sm,
    gap: modernTheme.spacing.xs,
  },
  botonEditarInlineText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
  },
  botonVerServicios: {
    backgroundColor: modernTheme.colors.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    flex: 0.48,
    alignItems: 'center',
  },
  botonVerServiciosText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  botonContactar: {
    backgroundColor: '#27ae60',
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    flex: 0.48,
    alignItems: 'center',
  },
  botonContactarText: {
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

  // Modal general
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: modernTheme.borderRadius.lg,
    width: '95%',
    height: '90%',
    ...modernTheme.shadows.large,
    flexDirection: 'column',
  },
  modalHeader: {
    backgroundColor: modernTheme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: modernTheme.spacing.lg,
    borderTopLeftRadius: modernTheme.borderRadius.lg,
    borderTopRightRadius: modernTheme.borderRadius.lg,
  },
  modalTitle: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.inverse,
    flex: 1,
    marginLeft: modernTheme.spacing.md,
  },
  closeButton: {
    padding: modernTheme.spacing.sm,
  },

  // Búsqueda
  searchContainer: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    backgroundColor: modernTheme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.secondary,
    borderRadius: modernTheme.borderRadius.lg,
    paddingHorizontal: modernTheme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: modernTheme.spacing.sm,
    marginRight: modernTheme.spacing.sm,
    fontSize: 16,
    color: modernTheme.colors.text.primary,
  },
  clearSearchButton: {
    padding: modernTheme.spacing.xs,
  },
  searchResultsText: {
    marginTop: modernTheme.spacing.sm,
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },

  // Formulario
  formGroup: {
    marginBottom: modernTheme.spacing.lg,
  },
  formLabel: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.primary,
    fontWeight: '600',
    marginBottom: modernTheme.spacing.sm,
  },
  formInput: {
    ...modernTheme.typography.body,
    borderWidth: 2,
    borderColor: modernTheme.colors.border.primary,
    borderRadius: modernTheme.borderRadius.md,
    padding: modernTheme.spacing.md,
    backgroundColor: modernTheme.colors.background.primary,
    color: modernTheme.colors.text.primary,
    minHeight: 56,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: modernTheme.spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: modernTheme.spacing.md,
    padding: modernTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.secondary,
    borderBottomLeftRadius: modernTheme.borderRadius.lg,
    borderBottomRightRadius: modernTheme.borderRadius.lg,
  },
  cancelButton: {
    flex: 1,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.primary,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    backgroundColor: modernTheme.colors.primary,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },

  // Modal grande para edición
  modalContainerLarge: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: modernTheme.borderRadius.lg,
    width: '95%',
    maxHeight: '90%',
    ...modernTheme.shadows.large,
    flexDirection: 'column',
  },
  formScrollView: {
    paddingHorizontal: modernTheme.spacing.lg,
  },
  formScrollContent: {
    paddingTop: modernTheme.spacing.lg,
    paddingBottom: modernTheme.spacing.sm,
  },
  scrollSpacer: {
    height: modernTheme.spacing.md,
  },

  // Servicios modal styles (unified)
  servicesModalContent: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: modernTheme.borderRadius.lg,
    width: '95%',
    height: '85%',
    padding: modernTheme.spacing.lg,
    flexDirection: 'column',
    ...modernTheme.shadows.large,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: modernTheme.colors.border.primary,
    paddingBottom: modernTheme.spacing.md,
  },
  servicesTitle: {
    ...modernTheme.typography.h5,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  searchSection: {
    backgroundColor: modernTheme.colors.background.secondary,
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.md,
    marginBottom: modernTheme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.primary,
    borderRadius: modernTheme.borderRadius.md,
    paddingHorizontal: modernTheme.spacing.md,
    height: 40,
    gap: modernTheme.spacing.sm,
    marginBottom: modernTheme.spacing.md,
  },
  filtersPanel: {
    backgroundColor: modernTheme.colors.background.secondary,
    borderRadius: modernTheme.borderRadius.sm,
  },
  filtersLabelContainer: {
    marginBottom: modernTheme.spacing.md,
  },
  filtersLabel: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: modernTheme.spacing.xs,
  },
  statusButton: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.primary,
  },
  statusButtonActive: {
    backgroundColor: modernTheme.colors.primary,
    borderColor: modernTheme.colors.primary,
  },
  statusButtonText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  statusButtonTextActive: {
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
  servicesList: {
    flex: 1,
  },
  loadingServices: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingServicesText: {
    marginTop: modernTheme.spacing.md,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  servicesCount: {
    marginBottom: modernTheme.spacing.sm,
    color: modernTheme.colors.primary,
    ...modernTheme.typography.h6,
    fontWeight: 'bold',
  },
  serviceCard: {
    backgroundColor: modernTheme.colors.background.secondary,
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.md,
    marginBottom: modernTheme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
    ...modernTheme.shadows.small,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  serviceName: {
    ...modernTheme.typography.h6,
    color: modernTheme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: modernTheme.colors.primary,
    padding: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.xs,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse,
    fontWeight: '500',
  },
  serviceDetail: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: 4,
  },
  serviceNotes: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
    fontStyle: 'italic',
  },
  noServices: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noServicesIcon: {
    size: 40,
    color: modernTheme.colors.text.muted,
  },
  noServicesText: {
    ...modernTheme.typography.h6,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
    marginTop: modernTheme.spacing.md,
    marginBottom: modernTheme.spacing.sm,
  },
  noServicesSubtext: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
    textAlign: 'center',
  },
});

export default ClientesScreen;