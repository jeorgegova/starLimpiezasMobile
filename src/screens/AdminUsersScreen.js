/**
 * Pantalla de Administración de Usuarios para Star Limpiezas Mobile
 * Solo accesible para administradores
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
import { userService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AdminUsersScreen = () => {
  const navigation = useNavigation();
  const { userName, hasPermission, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersFiltrados, setUsersFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    // Verificar permisos
    if (!isAdmin() || !hasPermission('canManageUsers')) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para acceder a esta sección.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    loadUsers();
  }, []);

  // Función para filtrar usuarios por nombre, email o teléfono
  const filtrarUsuarios = (texto) => {
    if (!texto.trim()) {
      setUsersFiltrados(users);
    } else {
      const usuariosFiltrados = users.filter(user =>
        user.name?.toLowerCase().includes(texto.toLowerCase()) ||
        user.email?.toLowerCase().includes(texto.toLowerCase()) ||
        user.phone?.toLowerCase().includes(texto.toLowerCase())
      );
      setUsersFiltrados(usuariosFiltrados);
    }
  };

  // Aplicar filtro automáticamente cuando cambie la búsqueda
  useEffect(() => {
    filtrarUsuarios(busquedaUsuario);
  }, [busquedaUsuario, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await userService.getUsers();
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los usuarios');
      } else {
        const usersData = data || [];
        setUsers(usersData);
        setUsersFiltrados(usersData); // Inicializar usuarios filtrados
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers().finally(() => setRefreshing(false));
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || DATABASE_CONFIG.roles.USER);
    setShowRoleModal(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;

    try {
      const { data, error } = await userService.updateUserRole(selectedUser.id, newRole);
      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el rol del usuario');
      } else {
        Alert.alert('Éxito', 'Rol actualizado exitosamente');
        setShowRoleModal(false);
        loadUsers(); // Recargar la lista
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case DATABASE_CONFIG.roles.ADMIN:
        return 'Administrador';
      case DATABASE_CONFIG.roles.USER:
        return 'Usuario';
      default:
        return 'Usuario';
    }
  };

  const getRoleColor = (role) => {
    return role === DATABASE_CONFIG.roles.ADMIN ? '#e74c3c' : '#3498db';
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {(item.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Sin nombre'}</Text>
          <Text style={styles.userEmail}>{item.email || 'Sin email'}</Text>
          <Text style={styles.userPhone}>{item.phone || 'Sin teléfono'}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.roleBadgeText}>
            {getRoleDisplayName(item.role)}
          </Text>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <Text style={styles.userAddress}>📍 {item.address || 'Sin dirección'}</Text>
        <Text style={styles.userCreatedAt}>
          📅 Registrado: {formatDate(item.created_at)}
        </Text>
      </View>
      
      <View style={styles.userFooter}>
        <TouchableOpacity
          style={styles.botonEditarRol}
          onPress={() => openRoleModal(item)}
        >
          <Text style={styles.botonEditarRolText}>👤 Cambiar Rol</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Verificar permisos nuevamente antes de renderizar
  if (!isAdmin() || !hasPermission('canManageUsers')) {
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
            <MaterialIcons name="people" size={28} color={modernTheme.colors.text.inverse} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Administración de Usuarios</Text>
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
            value={busquedaUsuario}
            onChangeText={setBusquedaUsuario}
            placeholderTextColor={modernTheme.colors.text.muted}
          />
          {busquedaUsuario !== '' && (
            <TouchableOpacity
              onPress={() => setBusquedaUsuario('')}
              style={styles.clearSearchButton}
            >
              <MaterialIcons name="clear" size={18} color={modernTheme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        {busquedaUsuario !== '' && (
          <Text style={styles.searchResultsText}>
            {usersFiltrados.length} resultado{usersFiltrados.length !== 1 ? 's' : ''} encontrado{usersFiltrados.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === DATABASE_CONFIG.roles.ADMIN).length}
            </Text>
            <Text style={styles.statLabel}>Administradores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === DATABASE_CONFIG.roles.USER).length}
            </Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        ) : (
          <FlatList
            data={usersFiltrados}
            renderItem={renderUser}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[modernTheme.colors.primary]} tintColor={modernTheme.colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people" size={40} color={modernTheme.colors.text.muted} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No hay usuarios registrados</Text>
                <Text style={styles.emptySubtext}>
                  Los usuarios aparecerán aquí cuando se registren
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal para cambiar rol */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Rol de Usuario</Text>
            
            {selectedUser && (
              <>
                <Text style={styles.modalUserInfo}>
                  Usuario: {selectedUser.name}
                </Text>
                <Text style={styles.modalUserInfo}>
                  Email: {selectedUser.email}
                </Text>
              </>
            )}

            <View style={styles.roleSelectionContainer}>
              <Text style={styles.roleSelectionLabel}>Nuevo Rol:</Text>
              
              <TouchableOpacity 
                style={[
                  styles.roleOption,
                  newRole === DATABASE_CONFIG.roles.ADMIN && styles.roleOptionSelected
                ]}
                onPress={() => setNewRole(DATABASE_CONFIG.roles.ADMIN)}
              >
                <Text style={[
                  styles.roleOptionText,
                  newRole === DATABASE_CONFIG.roles.ADMIN && styles.roleOptionTextSelected
                ]}>
                  👑 Administrador
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.roleOption,
                  newRole === DATABASE_CONFIG.roles.USER && styles.roleOptionSelected
                ]}
                onPress={() => setNewRole(DATABASE_CONFIG.roles.USER)}
              >
                <Text style={[
                  styles.roleOptionText,
                  newRole === DATABASE_CONFIG.roles.USER && styles.roleOptionTextSelected
                ]}>
                  👤 Usuario
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRoleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateUserRole}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
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

  // Contenido principal
  content: {
    flex: 1,
  },

  // Estadísticas
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    marginHorizontal: modernTheme.spacing.lg,
    marginVertical: modernTheme.spacing.md,
    ...modernTheme.shadows.medium,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    ...modernTheme.typography.h3,
    color: modernTheme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginTop: modernTheme.spacing.xs,
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

  // Lista de usuarios
  listaContainer: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    paddingBottom: 80,
  },

  // Tarjeta de usuario
  userCard: {
    backgroundColor: modernTheme.colors.surface.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.lg,
    marginBottom: modernTheme.spacing.sm,
    ...modernTheme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: modernTheme.colors.primary,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: modernTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: modernTheme.spacing.md,
  },
  userAvatarText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
  },
  roleBadge: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.lg,
  },
  roleBadgeText: {
    color: modernTheme.colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: modernTheme.spacing.sm,
  },
  userAddress: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  userCreatedAt: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.muted,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: modernTheme.spacing.xs,
    marginTop: modernTheme.spacing.sm,
    paddingTop: modernTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
  },
  botonEditarRol: {
    backgroundColor: modernTheme.colors.primary,
    padding: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
  },
  botonEditarRolText: {
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
    ...modernTheme.shadows.xlarge,
  },
  modalTitle: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  modalUserInfo: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
  },
  roleSelectionContainer: {
    marginBottom: modernTheme.spacing.lg,
  },
  roleSelectionLabel: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.primary,
    fontWeight: '600',
    marginBottom: modernTheme.spacing.md,
  },
  roleOption: {
    padding: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: modernTheme.colors.border.primary,
    backgroundColor: modernTheme.colors.background.secondary,
    marginBottom: modernTheme.spacing.sm,
  },
  roleOptionSelected: {
    borderColor: modernTheme.colors.primary,
    backgroundColor: modernTheme.colors.primary + '15',
  },
  roleOptionText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  roleOptionTextSelected: {
    color: modernTheme.colors.primary,
    fontWeight: '600',
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

export default AdminUsersScreen;