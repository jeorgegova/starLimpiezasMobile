/**
 * Pantalla de Login/Registro para Star Limpiezas Mobile
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const LoginScreen = () => {
  const { 
    user, 
    loading, 
    initializing,
    signIn, 
    signUp, 
    resetPassword,
  } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  // Limpiar errores cuando cambian los campos
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error específico del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validaciones adicionales para registro
    if (!isLoginMode) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isLoginMode) {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          // El usuario será navegado automáticamente por el sistema de navegación
        }
      } else {
        const result = await signUp(
          formData.email, 
          formData.password, 
          { name: formData.name.trim() }
        );
        if (result.success) {
          // Cambiar a modo login después del registro exitoso
          setTimeout(() => {
            setIsLoginMode(true);
            setFormData({
              email: formData.email,
              password: '',
              confirmPassword: '',
              name: ''
            });
          }, 2000);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(resetEmail)) {
      Alert.alert('Error', 'Formato de email inválido');
      return;
    }

    await resetPassword(resetEmail);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const getFieldStyle = (fieldName) => {
    return [
      styles.input,
      errors[fieldName] && styles.inputError
    ];
  };

  // Loading inicial
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Pantalla principal de login/registro
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🧹</Text>
            <Text style={styles.title}>Star Limpiezas Mobile</Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
            </Text>
          </View>

          {!isLoginMode && (
            <TextInput
              style={getFieldStyle('name')}
              placeholder="Nombre completo *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={getFieldStyle('email')}
            placeholder="Correo electrónico *"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={getFieldStyle('password')}
            placeholder="Contraseña *"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {!isLoginMode && (
            <>
              <TextInput
                style={getFieldStyle('confirmPassword')}
                placeholder="Confirmar contraseña *"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Text>
            )}
          </TouchableOpacity>

          {isLoginMode && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                name: ''
              });
              setErrors({});
            }}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>
              {isLoginMode 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </Text>
          </TouchableOpacity>

          {!isLoginMode && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Al registrarte, aceptarás nuestros términos de servicio y política de privacidad.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de recuperación de contraseña */}
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa tu email para recibir un enlace de recuperación
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Correo electrónico"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendButtonText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
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
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  sendButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;