/**
 * Simple Loading Screen for App Initialization
 * Prevents blank screen during authentication setup
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { modernTheme } from '../theme/ModernTheme';
import ModernIcon from '../theme/ModernIcon';

const SimpleLoadingScreen = ({ message = "Cargando..." }) => {
  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      
      <View style={styles.modalCard}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <ModernIcon 
                name="cleaning" 
                size="xl" 
                color={modernTheme.colors.primary}
              />
            </View>
          </View>
          
          <Text style={styles.appTitle}>
            Star Limpiezas
          </Text>
          
          <Text style={styles.loadingText}>
            {message}
          </Text>
          
          <ActivityIndicator 
            size="large" 
            color={modernTheme.colors.primary}
            style={styles.spinner}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    backgroundColor: modernTheme.colors.background.primary,
    borderRadius: modernTheme.borderRadius.xl,
    paddingVertical: modernTheme.spacing.xl,
    paddingHorizontal: modernTheme.spacing.lg,
    width: '85%',
    maxWidth: 350,
    ...modernTheme.shadows.large,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: modernTheme.spacing.xl,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: modernTheme.borderRadius.xl,
    backgroundColor: modernTheme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...modernTheme.shadows.medium,
  },
  appTitle: {
    ...modernTheme.typography.h2,
    color: modernTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.md,
    fontWeight: 'bold',
  },
  loadingText: {
    ...modernTheme.typography.body,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  spinner: {
    marginTop: modernTheme.spacing.md,
  },
});

export default SimpleLoadingScreen;
