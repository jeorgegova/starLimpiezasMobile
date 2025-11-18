/**
 * Pantalla de Citas para Star Limpiezas Mobile
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

const CitasScreen = () => {
  const navigation = useNavigation();
  const { userName } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    setLoading(true);
    try {
      // Placeholder - implementar cuando se necesite
      const { data, error } = await utilityService.getLocations(); // Temporal
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las citas');
      } else {
        setCitas(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCitas().finally(() => setRefreshing(false));
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'programada':
        return '#3498db';
      case 'confirmada':
        return '#2ecc71';
      case 'completada':
        return '#27ae60';
      case 'cancelada':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const renderCita = ({ item }) => (
    <View style={styles.citaCard}>
      <View style={styles.citaHeader}>
        <Text style={styles.citaFecha}>
          📅 {formatDate(item.fecha_cita || item.created_at)}
        </Text>
        <View style={[
          styles.citaStatus,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.citaStatusText}>
            {item.status || 'Programada'}
          </Text>
        </View>
      </View>
      
      <View style={styles.citaInfo}>
        <Text style={styles.citaCliente}>
          👤 Cliente: {item.cliente_nombre || 'No especificado'}
        </Text>
        <Text style={styles.citaServicio}>
          🧹 Servicio: {item.servicio_nombre || 'No especificado'}
        </Text>
        <Text style={styles.citaEmpleado}>
          👨‍💼 Empleado: {item.empleado_nombre || 'No asignado'}
        </Text>
        {item.notas && (
          <Text style={styles.citaNotas}>
            📝 Notas: {item.notas}
          </Text>
        )}
      </View>
      
      <View style={styles.citaFooter}>
        <TouchableOpacity 
          style={styles.botonEditar}
          onPress={() => Alert.alert('Editar', `Editar cita del ${formatDate(item.fecha_cita || item.created_at)}`)}
        >
          <Text style={styles.botonEditarText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.botonEliminar}
          onPress={() => Alert.alert('Eliminar', `Eliminar cita del ${formatDate(item.fecha_cita || item.created_at)}`)}
        >
          <Text style={styles.botonEliminarText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const addNuevaCita = () => {
    Alert.alert(
      'Nueva Cita',
      'Funcionalidad para crear nueva cita próximamente...'
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
        <Text style={styles.headerTitle}>📅 Gestión de Citas</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addNuevaCita}
          >
            <Text style={styles.addButtonText}>➕ Programar Nueva Cita</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando citas...</Text>
          </View>
        ) : (
          <FlatList
            data={citas}
            renderItem={renderCita}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.listaContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay citas programadas</Text>
                <Text style={styles.emptySubtext}>
                  Toca el botón "Programar Nueva Cita" para comenzar
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
    backgroundColor: '#9b59b6',
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
    backgroundColor: '#8e44ad',
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
  citaCard: {
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
    borderLeftColor: '#9b59b6',
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  citaFecha: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  citaStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  citaStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  citaInfo: {
    marginBottom: 15,
  },
  citaCliente: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  citaServicio: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  citaEmpleado: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  citaNotas: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  citaFooter: {
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

export default CitasScreen;