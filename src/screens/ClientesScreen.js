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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { userService, DATABASE_CONFIG } from '../services';
import { modernTheme } from '../theme/ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ClientesScreen = () => {
  const navigation = useNavigation();
  const { userName } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      // Obtener usuarios con rol 'user' (clientes)
      const { data, error } = await userService.getUsersByRole(DATABASE_CONFIG.roles.USER);
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los clientes');
      } else {
        setClientes(data || []);
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
        <Text style={styles.clienteTelefono}>📱 {item.phone || 'Sin teléfono'}</Text>
        <Text style={styles.clienteDireccion}>📍 {item.address || 'Sin dirección'}</Text>
        <Text style={styles.clienteRegistro}>
          📅 Registrado: {formatDate(item.created_at)}
        </Text>
      </View>

      <View style={styles.clienteFooter}>
        <TouchableOpacity
          style={styles.botonVerServicios}
          onPress={() => Alert.alert('Servicios', `Ver servicios de: ${item.name}`)}
        >
          <Text style={styles.botonVerServiciosText}>🧹 Ver Servicios</Text>
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

  const addNuevoCliente = () => {
    Alert.alert(
      'Registro de Clientes',
      'Los clientes se registran automáticamente cuando crean una cuenta en la app.'
    );
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

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>
        ) : (
          <FlatList
            data={clientes}
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

      <TouchableOpacity style={styles.floatingButton} onPress={addNuevoCliente}>
        <MaterialIcons name="add" size={24} color={modernTheme.colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.primary,
  },
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
  clienteTelefono: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginBottom: modernTheme.spacing.xs,
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
    gap: modernTheme.spacing.sm,
    marginTop: modernTheme.spacing.sm,
    paddingTop: modernTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
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
    backgroundColor: modernTheme.colors.success || '#27ae60',
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
});

export default ClientesScreen;