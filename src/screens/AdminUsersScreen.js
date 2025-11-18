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

const AdminUsersScreen = () => {
  const navigation = useNavigation();
  const { userName, hasPermission, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await userService.getUsers();
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los usuarios');
      } else {
        setUsers(data || []);
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
          <Text style={styles.botonEditarRolText}>👑 Cambiar Rol</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.botonDetalles}
          onPress={() => Alert.alert('Detalles', `Usuario: ${item.name}\nEmail: ${item.email}\nTeléfono: ${item.phone}`)}
        >
          <Text style={styles.botonDetallesText}>👁️ Ver Detalles</Text>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Administración de Usuarios</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
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
            data={users}
            renderItem={renderUser}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay usuarios registrados</Text>
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
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e44ad',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#95a5a6',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 15,
  },
  userAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  userCreatedAt: {
    fontSize: 12,
    color: '#95a5a6',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonEditarRol: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  botonEditarRolText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  botonDetalles: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  botonDetallesText: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalUserInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  roleSelectionContainer: {
    marginBottom: 20,
  },
  roleSelectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  roleOption: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  roleOptionSelected: {
    borderColor: '#8e44ad',
    backgroundColor: '#f8f4ff',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  roleOptionTextSelected: {
    color: '#8e44ad',
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

export default AdminUsersScreen;