/**
 * Modern Theme System for Star Limpiezas Mobile
 * Elegant, modern design with smooth animations
 */

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Modern color palette
export const colors = {
  primary: '#6366f1', // Modern indigo
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  secondary: '#10b981', // Modern emerald
  secondaryLight: '#34d399',
  secondaryDark: '#059669',
  
  accent: '#f59e0b', // Modern amber
  accentLight: '#fbbf24',
  accentDark: '#d97706',
  
  error: '#ef4444', // Modern red
  errorLight: '#f87171',
  errorDark: '#dc2626',
  
  warning: '#f59e0b', // Amber
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  success: '#10b981', // Emerald
  successLight: '#34d399',
  successDark: '#059669',
  
  // Neutral colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a'
  },
  
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    elevated: '#ffffff'
  },
  
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    muted: '#94a3b8'
  },
  
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#6366f1'
  },
  
  // Glass morphism effects
  glass: {
    background: 'rgba(255, 255, 255, 0.25)',
    border: 'rgba(255, 255, 255, 0.18)',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }
};

// Modern typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: colors.text.primary,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.text.primary,
    letterSpacing: -0.25
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.text.primary
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text.primary
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text.primary
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.text.tertiary
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.text.secondary
  }
};

// Modern spacing system (8pt grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
};

// Modern border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999
};

// Modern shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  }
};

// Modern animations
export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// Component styles
export const componentStyles = {
  // Modern card component
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border.primary
  },
  
  // Modern button component
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
    ...shadows.small
  },
  
  buttonSecondary: {
    backgroundColor: colors.secondary,
    ...shadows.small
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary
  },
  
  // Modern input component
  input: {
    backgroundColor: colors.surface.secondary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 48
  },
  
  inputFocused: {
    borderColor: colors.border.focus,
    backgroundColor: colors.surface.primary
  },
  
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#fef2f2'
  }
};

// Export the complete theme
export const modernTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  componentStyles,
  dimensions: { width, height }
};

export default modernTheme;