/**
 * Modernized Login/Registration Screen for Star Limpiezas Mobile
 * Enhanced with bubble animations, responsive design, and optimized spacing
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
  Modal,
  Animated,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { modernTheme } from '../theme/ModernTheme';
import ModernIcon, { IconButton, StatusIcon } from '../theme/ModernIcon';

const BubbleBackground = () => {
  const bubbles = Array.from({ length: 6 }).map((_, i) => {
    const animValue = new Animated.Value(0);
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000 + i * 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        key={i}
        style={[
          styles.bubble,
          {
            left: `${15 + i * 12}%`,
            opacity: animValue.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 0.3, 0],
            }),
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -600],
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

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    // Animate form elements on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: modernTheme.animations.timing.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: modernTheme.animations.timing.normal,
        useNativeDriver: true,
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoSection}>
            <Animated.View 
              style={[
                { transform: [{ scale: logoAnim }] }
              ]}
            >
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
            </Animated.View>
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
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  { 
                    scale: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.9]
                    })
                  }
                ]
              }
            ]}
          >
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
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background.primary,
    overflow: 'hidden',
  },
  
  bubbleContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    pointerEvents: 'none',
  },
  bubble: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: modernTheme.colors.primary + '15',
    bottom: -100,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.primary,
  },
  loadingText: {
    marginTop: modernTheme.spacing.md,
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: modernTheme.spacing.lg,
    minHeight: '100%',
  },
  content: {
    backgroundColor: modernTheme.colors.surface.primary,
    borderRadius: modernTheme.borderRadius.xl,
    ...modernTheme.shadows.large,
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
