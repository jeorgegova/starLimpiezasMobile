/**
 * Premium Loading Screen – Luminoso, moderno y con tu logo real
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { modernTheme } from '../theme/ModernTheme';
import logo from '../assets/logo.png';   // ← Tu logo real

const SimpleLoadingScreen = ({ message = "Cargando..." }) => {
  // Animaciones suaves
  const pulseAnim = new Animated.Value(1);
  const floatAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  const spinAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade-in del card
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Logo flotando suavemente
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsación sutil del logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Spinner giratorio suave (opcional, queda más bonito que el nativo)
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Fondo luminoso y con gradiente sutil */}
      <View style={styles.backdrop} />

      <Animated.View style={[styles.modalCard, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          {/* Tu logo real con animación flotante y breathing */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ translateY: floatY }],
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          <Text style={styles.appTitle}>Star Limpiezas</Text>
          <Text style={styles.loadingText}>{message}</Text>

          {/* Spinner personalizado más bonito que el nativo */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <ActivityIndicator size="large" color={modernTheme.colors.primary} />
          </Animated.View>

          {/* Barra de progreso sutil animada */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50, muy luminoso
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.92)', // fondo casi blanco con ligera opacidad
    // Si tienes expo-blur puedes poner:
    // <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 52,
    paddingHorizontal: 40,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)', // slate-300 sutil
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 30,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 110,
    height: 110,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: modernTheme.colors.text.primary || '#1e293b',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b', // slate-500
    marginBottom: 32,
    fontWeight: '500',
  },
  progressContainer: {
    width: '75%',
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 32,
  },
  progressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: modernTheme.colors.primary,
    borderRadius: 3,
    // Animación infinita de "carga"
    ...StyleSheet.absoluteFillObject,
    transform: [
      {
        translateX: new Animated.Value(-400).interpolate({
          inputRange: [0, 1],
          outputRange: [-400, 400],
        }),
      },
    ],
    opacity: 0.7,
  },
});

export default SimpleLoadingScreen;