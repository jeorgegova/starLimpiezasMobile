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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Gestión de Clientes</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addNuevoCliente}
          >
            <Text style={styles.addButtonText}>➕ Agregar Nuevo Cliente</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={styles.emptyText}>No hay clientes registrados</Text>
                <Text style={styles.emptySubtext}>
                  Toca el botón "Agregar Nuevo Cliente" para comenzar
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2ecc71',
    padding: 20,
    paddingTop: 50,
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
  actionsContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#27ae60',
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
  listaContainer: {
    paddingBottom: 20,
  },
  clienteCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  clienteStatus: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: '#ecf0f1',
  },
  clienteStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clienteInfo: {
    marginBottom: 15,
  },
  clienteEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  clienteTelefono: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  clienteDireccion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  clienteRegistro: {
    fontSize: 12,
    color: '#95a5a6',
  },
  clienteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonVerServicios: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  botonVerServiciosText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  botonContactar: {
    backgroundColor: '#2ecc71',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  botonContactarText: {
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
});

export default ClientesScreen;