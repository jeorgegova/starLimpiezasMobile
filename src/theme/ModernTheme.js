/**
 * Modern Theme System for Star Limpiezas Mobile
 * Elegant, modern design with smooth animations
 */

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Modern color palette
export const colors = {
  // Color principal: gris azulado muy suave y profesional (en vez de azul fuerte)
  primary: '#4e73a8ff',      // Slate-500 → elegante y neutro
  primaryLight: '#94a3b8',  // Slate-400
  primaryDark: '#475569',   // Slate-600

  // Secundario: verde muy suave para éxito
  secondary: '#86efac',     // Green-300 → fresco pero no chillón
  secondaryLight: '#bbf7d0',
  secondaryDark: '#4ade80',

  // Acento: un toque cálido sutil (opcional, para resaltar algo)
  accent: '#cbd5e1',        // Slate-300 → casi gris, muy sutil
  accentLight: '#e2e8f0',
  accentDark: '#94a3b8',

  // Error: rojo suave pero visible
  error: '#f87171',         // Red-400
  errorLight: '#fca5a5',
  errorDark: '#ef4444',

  // Warning: ámbar suave
  warning: '#fbbf24',
  warningLight: '#fcd34d',
  warningDark: '#f59e0b',

  // Success: verde suave
  success: '#86efac',
  successLight: '#bbf7d0',
  successDark: '#4ade80',

  // Fondos: limpios y nítidos (sin tintes que opaquen)
  background: {
    primary: '#ffffff',     // Blanco puro
    secondary: '#f8fafc',   // Gris casi blanco (muy sutil)
    tertiary: '#f1f5f9',    // Slate-100
    dark: '#1e293b'         // Slate-800 para modo oscuro si lo usas
  },

  surface: {
    primary: '#ffffff',
    secondary: '#ffffff',
    elevated: '#ffffff'     // Sin sombras fuertes ni elevación que opaque
  },

  text: {
    primary: '#1e293b',     // Gris oscuro → excelente legibilidad
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    muted: '#94a3b8'
  },

  border: {
    primary: '#e2e8f0',      // Borde muy claro → separa sin pesar
    secondary: '#cbd5e1',
    focus: '#64748b'        // Focus sutil en el primary
  },

  // Glass morphism: muy sutil o casi eliminado para evitar opacidad
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',  // Más opaco → menos velo
    border: 'rgba(255, 255, 255, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.08)'
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
    lineHeight: 14,
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
  lg: 20,
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