/**
 * Modernized Login/Registration Screen for Star Limpiezas Mobile
 * Enhanced with bubble animations, responsive design, and optimized spacing
 */
import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Animated,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { modernTheme } from '../theme/ModernTheme';
import ModernIcon, { IconButton, StatusIcon } from '../theme/ModernIcon';

const bubbleArray = [
  { size: 70, left: "12%", delay: 0, dur: 8000, topFrom: 92, topTo: -16, opacity: 0.26 },
  { size: 100, left: "26%", delay: 2000, dur: 10000, topFrom: 96, topTo: -9, opacity: 0.19 },
  { size: 60, left: "53%", delay: 1000, dur: 9000, topFrom: 88, topTo: -13, opacity: 0.23 },
  { size: 120, left: "77%", delay: 3000, dur: 12000, topFrom: 90, topTo: -18, opacity: 0.22 },
  { size: 48, left: "36%", delay: 4000, dur: 7000, topFrom: 84, topTo: -10, opacity: 0.20 },
  { size: 85, left: "71%", delay: 500, dur: 11000, topFrom: 81, topTo: -10, opacity: 0.17 },
];

const BubbleBackground = () => {
  const bubbles = bubbleArray.map((b, i) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const startAnimation = () => {
        const animate = () => {
          Animated.timing(animValue, {
            toValue: 1,
            duration: b.dur,
            useNativeDriver: true,
          }).start(() => {
            // Reset animation value and start again
            animValue.setValue(0);
            animate();
          });
        };

        // Start with delay
        setTimeout(() => {
          animate();
        }, b.delay);
      };

      startAnimation();
    }, []);

    return (
      <Animated.View
        key={i}
        style={[
          styles.bubble,
          {
            width: b.size,
            height: b.size,
            left: b.left,
            opacity: animValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [b.opacity, b.opacity * 0.3, b.opacity],
            }),
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [`${b.topFrom}%`, `${b.topTo}%`, `${b.topFrom}%`],
                }),
              },
            ],
          },
        ]}
      />
    );
  });

  return <View style={styles.bubbleContainer}>{bubbles}</View>;
};

const LoginScreen = () => {
  const { 
    user, 
    loading, 
    initializing,
    signIn, 
    signUp, 
    resetPassword,
  } = useAuth();

  const { height, width } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const isTablet = width >= 768;
  
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

  // Simple fade animation
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: modernTheme.animations.timing.normal,
      useNativeDriver: true,
    }).start();
  }, []);

  // Clear errors when form fields change
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

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

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
          // User will be navigated automatically by navigation system
        }
      } else {
        const result = await signUp(
          formData.email, 
          formData.password, 
          { name: formData.name.trim() }
        );
        if (result.success) {
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

  const responsiveSpacing = {
    contentPadding: isTablet ? modernTheme.spacing.xxl : modernTheme.spacing.xl,
    logoSize: isTablet ? 100 : 80,
    logoBgSize: isTablet ? 120 : 80,
    titleSize: isTablet ? 32 : 28,
    scrollPadding: isTablet ? modernTheme.spacing.xl : modernTheme.spacing.lg,
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={modernTheme.colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BubbleBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: responsiveSpacing.scrollPadding }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { padding: responsiveSpacing.contentPadding },
            {
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.logoSection}>
            <View style={[
              styles.logoBackground,
              {
                width: responsiveSpacing.logoBgSize,
                height: responsiveSpacing.logoBgSize,
                borderRadius: responsiveSpacing.logoBgSize / 2,
              }
            ]}>
              <ModernIcon
                name="cleaning"
                size={responsiveSpacing.logoSize > 100 ? "xxl" : "xl"}
                color={modernTheme.colors.primary}
              />
            </View>
            <Text style={[
              styles.title,
              { fontSize: responsiveSpacing.titleSize }
            ]}>
              Star Limpiezas
            </Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
            </Text>
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={getFieldStyle('name')}
                placeholder="Tu nombre completo"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoCapitalize="words"
                autoCorrect={false}
                placeholderTextColor={modernTheme.colors.text.muted}
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <ModernIcon name="error" size="xs" color={modernTheme.colors.error} />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={getFieldStyle('email')}
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={modernTheme.colors.text.muted}
            />
            {errors.email && (
              <View style={styles.errorContainer}>
                <ModernIcon name="error" size="xs" color={modernTheme.colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={getFieldStyle('password')}
              placeholder="Tu contraseña"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={modernTheme.colors.text.muted}
            />
            {errors.password && (
              <View style={styles.errorContainer}>
                <ModernIcon name="error" size="xs" color={modernTheme.colors.error} />
                <Text style={styles.errorText}>{errors.password}</Text>
              </View>
            )}
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar contraseña</Text>
              <TextInput
                style={getFieldStyle('confirmPassword')}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={modernTheme.colors.text.muted}
              />
              {errors.confirmPassword && (
                <View style={styles.errorContainer}>
                  <ModernIcon name="error" size="xs" color={modernTheme.colors.error} />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>
          )}

          <IconButton
            icon={loading ? undefined : 'check'}
            text={loading ? 'Procesando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta')}
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          />

          {isLoginMode && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <ModernIcon name="question" size="sm" color={modernTheme.colors.primary} />
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.toggleModeButton}
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
            activeOpacity={0.7}
          >
            <Text style={styles.toggleModeText}>
              {isLoginMode 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </Text>
          </TouchableOpacity>

          {!isLoginMode && (
            <View style={styles.infoContainer}>
              <ModernIcon name="info" size="xs" color={modernTheme.colors.text.muted} />
              <Text style={styles.infoText}>
                Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ModernIcon name="lock" size="lg" color={modernTheme.colors.primary} />
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Ingresa tu email para recibir un enlace de recuperación
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="tu@email.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={modernTheme.colors.text.muted}
            />

            <View style={styles.modalButtons}>
              <IconButton
                text="Cancelar"
                variant="outline"
                size="md"
                onPress={() => setShowForgotPassword(false)}
                style={styles.modalButton}
              />
              
              <IconButton
                text="Enviar"
                variant="primary"
                size="md"
                onPress={handleForgotPassword}
                disabled={loading}
                loading={loading}
                style={styles.modalButton}
              />
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
    backgroundColor: modernTheme.colors.background.primary,
  },

  bubbleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(187, 238, 249, 0.6)',
    borderRadius: 50,
    shadowColor: '#93d4ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.dark,
  },
  loadingText: {
    marginTop: modernTheme.spacing.md,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.inverse,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: modernTheme.spacing.lg,
    minHeight: '100%',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: modernTheme.borderRadius.xl,
    ...modernTheme.shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  
  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  logoBackground: {
    backgroundColor: modernTheme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: modernTheme.spacing.lg,
    ...modernTheme.shadows.medium,
  },
  title: {
    ...modernTheme.typography.h1,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  subtitle: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Input styles
  inputGroup: {
    marginBottom: modernTheme.spacing.md,
  },
  inputLabel: {
    ...modernTheme.typography.label,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  input: {
    ...modernTheme.componentStyles.input,
    fontSize: 16,
  },
  inputError: {
    ...modernTheme.componentStyles.inputError,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: modernTheme.spacing.xs,
  },
  errorText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.error,
    marginLeft: modernTheme.spacing.sm,
  },
  
  // Button styles
  submitButton: {
    marginTop: modernTheme.spacing.md,
    marginBottom: modernTheme.spacing.sm,
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: modernTheme.spacing.sm,
    marginBottom: modernTheme.spacing.md,
  },
  forgotPasswordText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.primary,
    marginLeft: modernTheme.spacing.sm,
  },
  toggleModeButton: {
    alignItems: 'center',
    paddingVertical: modernTheme.spacing.md,
  },
  toggleModeText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  
  // Info styles
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: modernTheme.spacing.md,
    backgroundColor: modernTheme.colors.background.secondary,
    borderRadius: modernTheme.borderRadius.md,
    marginTop: modernTheme.spacing.md,
  },
  infoText: {
    ...modernTheme.typography.bodySmall,
    color: modernTheme.colors.text.secondary,
    marginLeft: modernTheme.spacing.sm,
    flex: 1,
  },
  
  // Modal styles
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  modalTitle: {
    ...modernTheme.typography.h3,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginTop: modernTheme.spacing.sm,
  },
  modalSubtitle: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  modalInput: {
    ...modernTheme.componentStyles.input,
    marginBottom: modernTheme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: modernTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default LoginScreen;
