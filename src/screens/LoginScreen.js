/**
 * Modernized Login/Registration Screen for Star Limpiezas Mobile
 * Enhanced with bubble animations INSIDE the card, slow rising bubbles
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
  Image,
  ImageBackground,
  useWindowDimensions,
  BackHandler
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import { modernTheme } from '../theme/ModernTheme';
import Icon from 'react-native-vector-icons/FontAwesome';
import { IconButton } from '../theme/ModernIcon';
import logo from '../assets/logo.png';

const { height: screenHeight } = Dimensions.get('window');

// ======================== BURBUJAS ULTRA SUAVES DESDE EL SEGUNDO 1 ========================
const BubbleBackground = () => {
  const bubblesRef = useRef([]);

  const createBubble = (initialProgress = 0) => {
    const id = Date.now() + Math.random();
    const bubble = {
      id,
      left: Math.random() * 70 + 15 + '%',
      size: Math.random() * 40 + 30,
      totalDuration: 30000 + Math.random() * 10000, // 30-40 segundos de vida
      moveAnim: new Animated.Value(initialProgress),     // controla la posición Y
      fadeAnim: new Animated.Value(0),                    // siempre empieza invisible
    };

    bubblesRef.current = [...bubblesRef.current, bubble];

    // 1. Animación de movimiento (el resto del recorrido)
    Animated.timing(bubble.moveAnim, {
      toValue: 1,
      duration: bubble.totalDuration * (1 - initialProgress),
      useNativeDriver: true,
    }).start(() => {
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== id);
    });

    // 2. Fade-in MUY lento y bonito (4 segundos) + fade-out al final
    Animated.sequence([
      Animated.timing(bubble.fadeAnim, {
        toValue: 1,
        duration: 4000,               // ← 4 segundos para aparecer completamente
        useNativeDriver: true,
      }),
      Animated.delay(bubble.totalDuration * (1 - initialProgress) - 8000), // mantiene opacidad
      Animated.timing(bubble.fadeAnim, {
        toValue: 0,
        duration: 4000,               // ← 4 segundos para desaparecer arriba
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    // === 10 burbujas que aparecen repartidas y con fade-in lento ===
    for (let i = 0; i < 10; i++) {
      const progress = Math.random() * 0.75; // ya han recorrido 0-75%
      setTimeout(() => createBubble(progress), i * 120);
    }

    // === Nuevas burbujas desde abajo cada 5 segundos ===
    const interval = setInterval(() => createBubble(0), 5000);

    return () => clearInterval(interval);
  }, []);

  // Re-render ligero
  const [, setTick] = useState(0);
  useEffect(() => {
    const ticker = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  return (
    <View style={styles.bubbleOverlay} pointerEvents="none">
      {bubblesRef.current.map(bubble => (
        <Animated.View
          key={bubble.id}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              left: bubble.left,
              bottom: -100,
              opacity: bubble.fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.48],        // máxima opacidad sutil
              }),
              transform: [
                {
                  translateY: bubble.moveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -screenHeight - 400],
                  }),
                },
                {
                  translateX: bubble.moveAnim.interpolate({
                    inputRange: [0, 0.35, 0.65, 1],
                    outputRange: [0, 25, -20, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

// ======================== LOGIN SCREEN ========================
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

  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: modernTheme.animations.timing.normal,
      useNativeDriver: true,
    }).start();
  }, []);

  // Limpia errores al escribir
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [formData, errors]);

  // Back button en modo registro
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isLoginMode) {
        setIsLoginMode(true);
        setFormData({ email: '', password: '', confirmPassword: '', name: '' });
        setErrors({});
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isLoginMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!validateEmail(formData.email)) newErrors.email = 'Formato de email inválido';

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (!isLoginMode) {
      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isLoginMode) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, { name: formData.name.trim() });
        if (!loading) {
          setTimeout(() => {
            setIsLoginMode(true);
            setFormData({ ...formData, password: '', confirmPassword: '', name: '' });
          }, 1500);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !validateEmail(resetEmail)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }
    await resetPassword(resetEmail);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const getFieldStyle = (field) => [styles.input, errors[field] && styles.inputError];

  const responsiveSpacing = {
    contentPadding: isTablet ? modernTheme.spacing.xxl : modernTheme.spacing.xl,
    logoSize: isTablet ? 100 : 80,
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
    <ImageBackground source={require('../assets/fondo.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: responsiveSpacing.scrollPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { padding: responsiveSpacing.contentPadding },
              { opacity: fadeAnim }
            ]}
          >
            {/* === BURBUJAS DENTRO DEL CARD === */}
            <BubbleBackground />

            {/* === CONTENIDO DEL FORMULARIO === */}
            <View style={styles.logoSection}>
              <Image source={logo} style={{ width: responsiveSpacing.logoSize, height: responsiveSpacing.logoSize, resizeMode: 'contain', marginBottom: modernTheme.spacing.lg }} />
              <Text style={[styles.title, { fontSize: responsiveSpacing.titleSize }]}>Star Limpiezas</Text>
              <Text style={styles.subtitle}>
                {isLoginMode ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
              </Text>
            </View>

            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre completo</Text>
                <TextInput style={getFieldStyle('name')} placeholder="Tu nombre completo" value={formData.name} onChangeText={v => handleInputChange('name', v)} autoCapitalize="words" placeholderTextColor={modernTheme.colors.text.muted} />
                {errors.name && <View style={styles.errorContainer}><Icon name="exclamation-triangle" size={16} color={modernTheme.colors.error} /><Text style={styles.errorText}>{errors.name}</Text></View>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput style={getFieldStyle('email')} placeholder="tu@email.com" value={formData.email} onChangeText={v => handleInputChange('email', v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={modernTheme.colors.text.muted} />
              {errors.email && <View style={styles.errorContainer}><Icon name="exclamation-triangle" size={16} color={modernTheme.colors.error} /><Text style={styles.errorText}>{errors.email}</Text></View>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput style={getFieldStyle('password')} placeholder="Tu contraseña" value={formData.password} onChangeText={v => handleInputChange('password', v)} secureTextEntry autoCapitalize="none" placeholderTextColor={modernTheme.colors.text.muted} />
              {errors.password && <View style={styles.errorContainer}><Icon name="exclamation-triangle" size={16} color={modernTheme.colors.error} /><Text style={styles.errorText}>{errors.password}</Text></View>}
            </View>

            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                <TextInput style={getFieldStyle('confirmPassword')} placeholder="Repite tu contraseña" value={formData.confirmPassword} onChangeText={v => handleInputChange('confirmPassword', v)} secureTextEntry autoCapitalize="none" placeholderTextColor={modernTheme.colors.text.muted} />
                {errors.confirmPassword && <View style={styles.errorContainer}><Icon name="exclamation-triangle" size={16} color={modernTheme.colors.error} /><Text style={styles.errorText}>{errors.confirmPassword}</Text></View>}
              </View>
            )}

            <IconButton
              text={loading ? 'Procesando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta')}
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              style={styles.submitButton}
            />

            {isLoginMode && (
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => setShowForgotPassword(true)}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.toggleModeButton}
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                setFormData({ email: '', password: '', confirmPassword: '', name: '' });
                setErrors({});
              }}
            >
              <Text style={styles.toggleModeText}>
                {isLoginMode ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </TouchableOpacity>

            {!isLoginMode && (
              <View style={styles.infoContainer}>
                <Icon name="info-circle" size={16} color={modernTheme.colors.text.muted} />
                <Text style={styles.infoText}>
                  Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Modal recuperar contraseña */}
        <Modal visible={showForgotPassword} transparent animationType="slide" onRequestClose={() => setShowForgotPassword(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Icon name="lock" size={28} color={modernTheme.colors.primary} />
                <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              </View>
              <Text style={styles.modalSubtitle}>Ingresa tu email para recibir un enlace de recuperación</Text>
              <TextInput style={styles.modalInput} placeholder="tu@email.com" value={resetEmail} onChangeText={setResetEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={modernTheme.colors.text.muted} />
              <View style={styles.modalButtons}>
                <IconButton text="Cancelar" variant="outline" size="md" onPress={() => setShowForgotPassword(false)} style={styles.modalButton} />
                <IconButton text="Enviar" variant="primary" size="md" onPress={handleForgotPassword} loading={loading} style={styles.modalButton} />
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

// ======================== ESTILOS (con cambios clave) ========================
const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  container: { flex: 1 },

  // Burbujas solo dentro del card
  bubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(187, 238, 249, 0.45)',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 200, 255, 0.4)',
    shadowColor: '#00c6ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: modernTheme.colors.background.dark },
  loadingText: { marginTop: modernTheme.spacing.md, ...modernTheme.typography.body, color: modernTheme.colors.text.inverse },

  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: modernTheme.spacing.lg, minHeight: '100%' },

  // IMPORTANTE: overflow hidden para que las burbujas no se salgan
  content: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: modernTheme.borderRadius.xl,
    ...modernTheme.shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.59)',
    position: 'relative',
    overflow: 'hidden', // ← Aquí está la magia
  },

  logoSection: { alignItems: 'center', marginBottom: modernTheme.spacing.lg, zIndex: 1 },
  title: { ...modernTheme.typography.h1, color: modernTheme.colors.text.primary, textAlign: 'center', marginBottom: modernTheme.spacing.xs },
  subtitle: { ...modernTheme.typography.body, color: modernTheme.colors.text.secondary, textAlign: 'center' },

  inputGroup: { marginBottom: modernTheme.spacing.md, zIndex: 1 },
  inputLabel: { ...modernTheme.typography.label, color: modernTheme.colors.text.primary, marginBottom: modernTheme.spacing.xs },
  input: { ...modernTheme.componentStyles.input, fontSize: 16 },
  inputError: { ...modernTheme.componentStyles.inputError },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: modernTheme.spacing.xs },
  errorText: { ...modernTheme.typography.bodySmall, color: modernTheme.colors.error, marginLeft: modernTheme.spacing.sm },

  submitButton: { marginTop: modernTheme.spacing.md, marginBottom: modernTheme.spacing.sm, borderWidth: 2, borderColor: modernTheme.colors.primary, borderRadius: modernTheme.borderRadius.lg, paddingVertical: modernTheme.spacing.md, ...modernTheme.shadows.medium },
  forgotPasswordButton: { alignItems: 'center', paddingVertical: modernTheme.spacing.sm, marginBottom: modernTheme.spacing.md },
  forgotPasswordText: { ...modernTheme.typography.body, color: modernTheme.colors.primary },
  toggleModeButton: { alignItems: 'center', paddingVertical: modernTheme.spacing.md },
  toggleModeText: { ...modernTheme.typography.body, color: modernTheme.colors.text.secondary },

  infoContainer: { flexDirection: 'row', alignItems: 'flex-start', padding: modernTheme.spacing.md, backgroundColor: modernTheme.colors.background.secondary, borderRadius: modernTheme.borderRadius.md, marginTop: modernTheme.spacing.md },
  infoText: { ...modernTheme.typography.bodySmall, color: modernTheme.colors.text.secondary, marginLeft: modernTheme.spacing.sm, flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: modernTheme.colors.text.primary + '80', justifyContent: 'center', alignItems: 'center', padding: modernTheme.spacing.lg },
  modalContent: { backgroundColor: modernTheme.colors.surface.primary, padding: modernTheme.spacing.xl, borderRadius: modernTheme.borderRadius.lg, width: '100%', maxWidth: 400, ...modernTheme.shadows.xlarge },
  modalHeader: { alignItems: 'center', marginBottom: modernTheme.spacing.md },
  modalTitle: { ...modernTheme.typography.h3, color: modernTheme.colors.text.primary, marginTop: modernTheme.spacing.sm },
  modalSubtitle: { ...modernTheme.typography.body, color: modernTheme.colors.text.secondary, textAlign: 'center', marginBottom: modernTheme.spacing.lg },
  modalInput: { ...modernTheme.componentStyles.input, marginBottom: modernTheme.spacing.lg },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: modernTheme.spacing.md },
  modalButton: { flex: 1 },
});

export default LoginScreen;