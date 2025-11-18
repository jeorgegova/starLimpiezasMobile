/**
 * Pantalla de Perfil de Usuario para Star Limpiezas Mobile
 * Permite a los usuarios editar su propia información de registro
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { userService, utilityService } from '../services';

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const {
    userName,
    userProfile,
    updateUserProfile,
    isUser,
    isAdmin
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    // Verificar permisos - solo usuarios normales pueden acceder
    if (isAdmin()) {
      Alert.alert(
        'Acceso Denegado',
        'Los administradores deben usar la sección de administración de usuarios.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!isUser()) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para acceder a esta sección.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    loadUserProfile();
  }, [isAdmin, isUser, navigation]);

  const loadUserProfile = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // Cargar datos adicionales del perfil desde la base de datos
      const { data, error } = await userService.getUserProfile(userProfile.id);

      if (error) {
        Alert.alert('Error', 'No se pudo cargar la información del perfil');
      } else {
        setProfileData({
          name: data?.name || userProfile.name || '',
          phone: data?.phone || '',
          address: data?.address || '',
          email: data?.email || userProfile.email || ''
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserProfile(profileData);

      if (result.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error?.message || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Verificar permisos antes de renderizar
  if (isAdmin()) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedSubtext}>
          Los administradores deben usar la sección de administración de usuarios.
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

  if (!isUser()) {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, {userName}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Información Personal</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profileData.email}
              editable={false}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#95a5a6"
            />
            <Text style={styles.inputHelp}>
              El correo electrónico no se puede cambiar desde la app
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={profileData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Ingresa tu número de teléfono"
              placeholderTextColor="#95a5a6"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={profileData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Ingresa tu dirección completa"
              placeholderTextColor="#95a5a6"
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ℹ️ Información Importante</Text>
          <Text style={styles.infoText}>
            • Los campos marcados con * son obligatorios
          </Text>
          <Text style={styles.infoText}>
            • Tu información se mantiene privada y segura
          </Text>
          <Text style={styles.infoText}>
            • Para cambiar tu contraseña, usa la opción "Olvidé mi contraseña" en el login
          </Text>
          <Text style={styles.infoText}>
            • Si necesitas cambiar tu correo electrónico, contacta al administrador
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: '#3498db',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#2c3e50',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#7f8c8d',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#e8f4fd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserProfileScreen;