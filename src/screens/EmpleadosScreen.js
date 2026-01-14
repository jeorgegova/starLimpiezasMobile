/**
 * Pantalla de Empleados para Star Limpiezas Mobile
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
import { utilityService } from '../services';

const EmpleadosScreen = () => {
  const navigation = useNavigation();
  const { userName } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      // Placeholder - implementar cuando se necesite
      const { data, error } = await utilityService.getLocations(); // Temporal
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los empleados');
      } else {
        setEmpleados(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmpleados().finally(() => setRefreshing(false));
  };

  const renderEmpleado = ({ item }) => (
    <View style={styles.empleadoCard}>
      <View style={styles.empleadoHeader}>
        <View style={styles.empleadoAvatar}>
          <Text style={styles.empleadoAvatarText}>
            {(item.nombre || 'E')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.empleadoInfo}>
          <Text style={styles.empleadoNombre}>{item.nombre || 'Empleado'}</Text>
          <Text style={styles.empleadoCargo}>{item.cargo || 'Sin cargo asignado'}</Text>
          <Text style={styles.empleadoEmail}>{item.email || 'Sin email'}</Text>
        </View>
        <View style={styles.empleadoStatus}>
          <Text style={[
            styles.empleadoStatusText,
            { color: item.activo ? '#27ae60' : '#e74c3c' }
          ]}>
            {item.activo ? '✅' : '❌'}
          </Text>
        </View>
      </View>
      
      <View style={styles.empleadoContacto}>
        <Text style={styles.empleadoTelefono}>📱 {item.telefono || 'Sin teléfono'}</Text>
      </View>
      
      <View style={styles.empleadoFooter}>
        <TouchableOpacity 
          style={styles.botonEditar}
          onPress={() => Alert.alert('Editar', `Editar empleado: ${item.nombre}`)}
        >
          <Text style={styles.botonEditarText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.botonEliminar}
          onPress={() => Alert.alert('Eliminar', `Eliminar empleado: ${item.nombre}`)}
        >
          <Text style={styles.botonEliminarText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const addNuevoEmpleado = () => {
    Alert.alert(
      'Nuevo Empleado',
      'Funcionalidad para crear nuevo empleado próximamente...'
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
        <Text style={styles.headerTitle}>👨‍💼 Gestión de Empleados</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addNuevoEmpleado}
          >
            <Text style={styles.addButtonText}>➕ Agregar Nuevo Empleado</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando empleados...</Text>
          </View>
        ) : (
          <FlatList
            data={empleados}
            renderItem={renderEmpleado}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay empleados registrados</Text>
                <Text style={styles.emptySubtext}>
                  Toca el botón "Agregar Nuevo Empleado" para comenzar
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
    backgroundColor: '#f39c12',
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
    backgroundColor: '#e67e22',
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
  empleadoCard: {
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
  empleadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  empleadoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  empleadoAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  empleadoInfo: {
    flex: 1,
  },
  empleadoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  empleadoCargo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  empleadoEmail: {
    fontSize: 12,
    color: '#95a5a6',
  },
  empleadoStatus: {
    marginLeft: 10,
  },
  empleadoStatusText: {
    fontSize: 24,
  },
  empleadoContacto: {
    marginBottom: 15,
  },
  empleadoTelefono: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  empleadoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonEditar: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 5,
    flex: 0.45,
    alignItems: 'center',
  },
  botonEditarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  botonEliminar: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    flex: 0.45,
    alignItems: 'center',
  },
  botonEliminarText: {
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

export default EmpleadosScreen;