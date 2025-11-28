/**
 * Modernized Home Screen for Star Limpiezas Mobile
 * Elegant design with smooth animations and modern icons
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  BackHandler
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { serviceService, utilityService } from '../services';
import { modernTheme } from '../theme/ModernTheme';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { IconButton, StatusIcon } from '../theme/ModernIcon';

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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDashboardData();
    // Animate content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: modernTheme.animations.timing.normal,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle back button press on home screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleSignOut();
        return true; // Prevent default back action
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get statistics using utilityService
      const { data: statsData, error } = await utilityService.getDashboardStats();

      if (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback: get basic services
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

        // Get recent services
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

  const menuItems = userRole === 'admin' ? [
    {
      icon: 'cleaning',
      title: 'Gestionar Servicios',
      subtitle: 'Confirmar, cancelar, editar y crear servicios',
      onPress: () => navigateToScreen('Servicios'),
      color: modernTheme.colors.primary
    },
    {
      icon: 'people',
      title: 'Gestionar Clientes',
      subtitle: 'Ver y administrar la lista de clientes',
      onPress: () => navigateToScreen('Clientes'),
      color: modernTheme.colors.secondary
    },
    {
      icon: 'employee',
      title: 'Gestionar Empleados',
      subtitle: 'Administrar el equipo de trabajo',
      onPress: () => navigateToScreen('Empleados'),
      color: modernTheme.colors.accent
    },
    {
      icon: 'admin',
      title: 'Administrar Usuarios',
      subtitle: 'Gestionar roles y permisos de usuarios',
      onPress: () => navigateToScreen('AdminUsers'),
      color: modernTheme.colors.warning
    },
    {
      icon: 'bonus',
      title: 'Bonificaciones',
      subtitle: 'Gestionar programas de lealtad y descuentos',
      onPress: () => navigateToScreen('Bonifications'),
      color: modernTheme.colors.success
    },
    {
      icon: 'chart',
      title: 'Reportes',
      subtitle: 'Ver reportes de todos los servicios',
      onPress: () => navigateToScreen('Reports'),
      color: modernTheme.colors.primary
    }
  ] : [
    {
      icon: 'cleaning',
      title: 'Mis Servicios',
      subtitle: 'Solicitar y ver el estado de mis servicios',
      onPress: () => navigateToScreen('Servicios'),
      color: modernTheme.colors.primary
    },
    {
      icon: 'chart',
      title: 'Mis Reportes',
      subtitle: 'Ver reportes de mis servicios con filtros',
      onPress: () => navigateToScreen('Reportes'),
      color: modernTheme.colors.secondary
    },
    {
      icon: 'person',
      title: 'Mi Perfil',
      subtitle: 'Editar mi información personal',
      onPress: () => navigateToScreen('Perfil'),
      color: modernTheme.colors.accent
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[modernTheme.colors.primary]}
          tintColor={modernTheme.colors.primary}
        />
      }
    >
      {/* Modern Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIconContainer}>
              <Text style={[styles.welcomeIcon, { color: modernTheme.colors.accent }]}>⭐</Text>
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                ¡Hola, {userName}!
              </Text>
              <Text style={styles.subtitle}>
                {userRole === 'admin' ? 'Panel de Administración' : 'Mi Panel Personal'}
              </Text>
            </View>
          </View>

          {userRole && (
            <View style={styles.roleContainer}>
              <StatusIcon
                status={userRole === 'admin' ? 'approved' : 'info'}
                size="sm"
                style={styles.roleIcon}
              />
              <Text style={styles.roleText}>
                {userRole === 'admin' ? 'Administrador' : 'Usuario'}
              </Text>
            </View>
          )}

          {!isEmailVerified && (
            <View style={styles.warningContainer}>
              <Text style={[styles.warningIcon, { color: modernTheme.colors.warning }]}>⚠️</Text>
              <Text style={styles.warningText}>
                Email no verificado
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Modern Statistics Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Resumen del Dashboard</Text>
        <View style={styles.statsGrid}>
          <View style={[
            styles.statCard,
            {
              backgroundColor: modernTheme.colors.primary + '15',
              borderLeftColor: modernTheme.colors.primary
            }
          ]}>
            <Text style={[styles.statIcon, { color: modernTheme.colors.primary }]}>🧹</Text>
            <Text style={styles.statNumber}>{stats.servicios}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>

          <View style={[
            styles.statCard,
            {
              backgroundColor: modernTheme.colors.secondary + '15',
              borderLeftColor: modernTheme.colors.secondary
            }
          ]}>
            <Text style={[styles.statIcon, { color: modernTheme.colors.secondary }]}>👥</Text>
            <Text style={styles.statNumber}>{stats.clientes}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>

          <View style={[
            styles.statCard,
            {
              backgroundColor: modernTheme.colors.accent + '15',
              borderLeftColor: modernTheme.colors.accent
            }
          ]}>
            <Text style={[styles.statIcon, { color: modernTheme.colors.accent }]}>👤</Text>
            <Text style={styles.statNumber}>{stats.usuarios}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>
      </View>

      {/* Recent Services */}
      {servicios.length > 0 && userRole !== 'admin' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Servicios Recientes</Text>
          {servicios.map((servicio, index) => (
            <TouchableOpacity
              key={index}
              style={styles.serviceCard}
              onPress={() => navigateToScreen('Servicios')}
            >
              <View style={styles.serviceHeader}>
                <Text style={[styles.serviceIcon, { color: modernTheme.colors.primary }]}>🧹</Text>
                <Text style={styles.serviceName}>{servicio.nombre || 'Servicio'}</Text>
              </View>
              <Text style={styles.serviceDescription}>
                {servicio.descripcion || 'Sin descripción disponible'}
              </Text>
              <Text style={styles.servicePrice}>
                ${servicio.precio || 'N/A'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modern Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>
          {userRole === 'admin' ? 'Panel de Administración' : 'Mi Panel de Usuario'}
        </Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.menuItemIconText, { color: item.color }]}>
                {item.icon === 'cleaning' ? '🧹' : item.icon === 'people' ? '👥' : item.icon === 'employee' ? '👷' : item.icon === 'admin' ? '⚙️' : item.icon === 'bonus' ? '🎁' : item.icon === 'chart' ? '📊' : item.icon === 'person' ? '👤' : '⭐'}
              </Text>
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: modernTheme.colors.text.muted }]}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modern Footer */}
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <View style={styles.statusContainer}>
            <StatusIcon
              status={isEmailVerified ? 'approved' : 'pending'}
              size="xs"
            />
            <Text style={[
              styles.userStatus,
              { color: isEmailVerified ? modernTheme.colors.success : modernTheme.colors.warning }
            ]}>
              {isEmailVerified ? 'Email verificado' : 'Email sin verificar'}
            </Text>
          </View>
        </View>

        <IconButton
          icon="back"
          text="Cerrar Sesión"
          variant="outline"
          onPress={handleSignOut}
          disabled={loading}
          iconPosition="left"
          style={styles.signOutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.primary,
  },
  contentContainer: {
    paddingBottom: modernTheme.spacing.xxl,
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
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  welcomeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: modernTheme.borderRadius.xl,
    backgroundColor: modernTheme.colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: modernTheme.spacing.lg,
    ...modernTheme.shadows.small,
  },
  welcomeIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    ...modernTheme.typography.h2,
    color: modernTheme.colors.text.inverse,
    marginBottom: modernTheme.spacing.xs,
  },
  subtitle: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.inverse + '90',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.surface.primary + '20',
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.lg,
    alignSelf: 'flex-start',
    marginBottom: modernTheme.spacing.sm,
  },
  roleIcon: {
    marginRight: modernTheme.spacing.sm,
  },
  roleText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.warning + '20',
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  warningText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.inverse,
    fontWeight: '500',
    marginLeft: modernTheme.spacing.sm,
  },

  // Stats styles
  statsContainer: {
    backgroundColor: modernTheme.colors.surface.primary,
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    ...modernTheme.shadows.medium,
  },
  statsTitle: {
    ...modernTheme.typography.h4,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
    color: modernTheme.colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '30%',
    backgroundColor: modernTheme.colors.surface.secondary,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
    borderLeftWidth: 4,
  },
  statIcon: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  statNumber: {
    ...modernTheme.typography.h3,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  statLabel: {
    ...modernTheme.typography.caption,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },

  // Section styles
  sectionContainer: {
    backgroundColor: modernTheme.colors.surface.primary,
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    ...modernTheme.shadows.small,
  },
  sectionTitle: {
    ...modernTheme.typography.h4,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.lg,
  },
  serviceCard: {
    backgroundColor: modernTheme.colors.background.secondary,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    marginBottom: modernTheme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: modernTheme.colors.primary,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: modernTheme.spacing.sm,
  },
  serviceName: {
    ...modernTheme.typography.bodyLarge,
    fontWeight: '600',
    color: modernTheme.colors.text.primary,
    marginLeft: modernTheme.spacing.sm,
    flex: 1,
  },
  serviceDescription: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.sm,
  },
  servicePrice: {
    ...modernTheme.typography.body,
    fontWeight: '600',
    color: modernTheme.colors.success,
  },

  // Menu styles
  menuContainer: {
    backgroundColor: modernTheme.colors.surface.primary,
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    ...modernTheme.shadows.medium,
  },
  menuTitle: {
    ...modernTheme.typography.h4,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
    color: modernTheme.colors.text.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.md,
    marginBottom: modernTheme.spacing.md,
    backgroundColor: modernTheme.colors.background.secondary,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
  },
  menuItemIcon: {
    width: 45,
    height: 45,
    borderRadius: modernTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: modernTheme.spacing.lg,
  },
  menuItemIconText: {
    fontSize: 24,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    ...modernTheme.typography.bodyLarge,
    fontWeight: '600',
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  menuItemSubtitle: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
  },
  menuItemArrow: {
    fontSize: 20,
    textAlign: 'center',
  },

  // Footer styles
  footer: {
    backgroundColor: modernTheme.colors.surface.primary,
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
    borderRadius: modernTheme.borderRadius.lg,
    ...modernTheme.shadows.small,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  userEmail: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.primary,
    fontWeight: '500',
    marginBottom: modernTheme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatus: {
    ...modernTheme.typography.bodySmall,
    marginLeft: modernTheme.spacing.sm,
  },
  signOutButton: {
    alignSelf: 'stretch',
  },
});

export default HomeScreen;