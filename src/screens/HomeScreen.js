import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { serviceService, utilityService } from '../services';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { 
    user, 
    signOut, 
    userName, 
    userEmail, 
    isEmailVerified,
    userRole 
  } = useAuth();
  
  const [servicios, setServicios] = useState([]);
  const [stats, setStats] = useState({
    servicios: 0,
    clientes: 0,
    usuarios: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas usando utilityService
      const { data: statsData, error } = await utilityService.getDashboardStats();

      if (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback: obtener servicios básicos
        const { data: servicesData } = await serviceService.getUserServices(null, true);
        setStats({
          servicios: servicesData?.length || 0,
          clientes: 0, // Placeholder
          usuarios: 0  // Placeholder
        });
        setServicios(servicesData?.slice(0, 3) || []);
      } else {
        setStats({
          servicios: statsData.totalServices || 0,
          clientes: statsData.totalUsers || 0,
          usuarios: statsData.totalUsers || 0
        });

        // Obtener servicios recientes
        const { data: servicesData } = await serviceService.getUserServices(null, true);
        setServicios(servicesData?.slice(0, 3) || []);
      }

    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con información del usuario */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          ¡Hola, {userName}!
        </Text>
        <Text style={styles.subtitle}>Gestión de Servicios de Limpieza</Text>
        {userRole && (
          <Text style={styles.roleText}>
            Rol: {userRole === 'admin' ? 'Administrador' : 'Usuario'}
          </Text>
        )}
        {!isEmailVerified && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Email no verificado
            </Text>
          </View>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Resumen del Dashboard</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.statNumber}>{stats.servicios}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
            <Text style={styles.statNumber}>{stats.clientes}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f39c12' }]}>
            <Text style={styles.statNumber}>{stats.usuarios}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>
      </View>

      {/* Servicios recientes */}
      {servicios.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Servicios Recientes</Text>
          {servicios.map((servicio, index) => (
            <View key={index} style={styles.serviceCard}>
              <Text style={styles.serviceName}>{servicio.nombre || 'Servicio'}</Text>
              <Text style={styles.serviceDescription}>
                {servicio.descripcion || 'Sin descripción disponible'}
              </Text>
              <Text style={styles.servicePrice}>
                ${servicio.precio || 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Menú principal con navegación basada en rol */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>
          {userRole === 'admin' ? 'Panel de Administración' : 'Mi Panel de Usuario'}
        </Text>

        {/* Menú para Administradores */}
        {userRole === 'admin' && (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Servicios')}
            >
              <Text style={styles.menuButtonIcon}>🧹</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Gestionar Servicios</Text>
                <Text style={styles.menuButtonSubtext}>
                  Confirmar, cancelar, editar y crear servicios
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Clientes')}
            >
              <Text style={styles.menuButtonIcon}>👥</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Gestionar Clientes</Text>
                <Text style={styles.menuButtonSubtext}>
                  Ver y administrar la lista de clientes
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Empleados')}
            >
              <Text style={styles.menuButtonIcon}>👨‍💼</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Gestionar Empleados</Text>
                <Text style={styles.menuButtonSubtext}>
                  Administrar el equipo de trabajo
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('AdminUsers')}
            >
              <Text style={styles.menuButtonIcon}>👑</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Administrar Usuarios</Text>
                <Text style={styles.menuButtonSubtext}>
                  Gestionar roles y permisos de usuarios
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Bonifications')}
            >
              <Text style={styles.menuButtonIcon}>🎁</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Bonificaciones</Text>
                <Text style={styles.menuButtonSubtext}>
                  Gestionar programas de lealtad y descuentos
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Reports')}
            >
              <Text style={styles.menuButtonIcon}>📊</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Reportes</Text>
                <Text style={styles.menuButtonSubtext}>
                  Ver reportes de todos los servicios
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Menú para Usuarios */}
        {userRole === 'user' && (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Servicios')}
            >
              <Text style={styles.menuButtonIcon}>🧹</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Mis Servicios</Text>
                <Text style={styles.menuButtonSubtext}>
                  Solicitar y ver el estado de mis servicios
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Reportes')}
            >
              <Text style={styles.menuButtonIcon}>📊</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Mis Reportes</Text>
                <Text style={styles.menuButtonSubtext}>
                  Ver reportes de mis servicios con filtros
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateToScreen('Perfil')}
            >
              <Text style={styles.menuButtonIcon}>👤</Text>
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuButtonText}>Mi Perfil</Text>
                <Text style={styles.menuButtonSubtext}>
                  Editar mi información personal
                </Text>
              </View>
              <Text style={styles.menuButtonArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer con información del usuario */}
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.userStatus}>
            {isEmailVerified ? '✅ Email verificado' : '❌ Email sin verificar'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: '#bdc3c7',
    marginBottom: 5,
  },
  warningContainer: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
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
  sectionContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  serviceCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  menuButtonSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  menuButtonArrow: {
    fontSize: 18,
    color: '#bdc3c7',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  userEmail: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    marginBottom: 5,
  },
  userStatus: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;