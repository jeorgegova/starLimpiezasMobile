/**
 * Modern Icon System for Star Limpiezas Mobile
 * Replaces emojis with elegant, professional icons
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { modernTheme } from './ModernTheme';

const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40
};

// Modern icon component with smooth animations
const ModernIcon = ({ 
  name, 
  size = 'md', 
  color = modernTheme.colors.text.primary, 
  style,
  animated = true,
  onPress 
}) => {
  const iconSize = typeof size === 'number' ? size : iconSizes[size] || iconSizes.md;
  
  // Icon mappings using Unicode symbols for better cross-platform support
  const iconMap = {
    // Navigation & UI
    'home': '🏠',
    'home-outline': '🏠',
    'back': '←',
    'menu': '☰',
    'settings': '⚙️',
    'search': '🔍',
    'filter': '🔽',
    'sort': '↕️',
    'refresh': '🔄',
    'close': '✕',
    'check': '✓',
    'arrow-right': '→',
    'arrow-left': '←',
    'arrow-up': '↑',
    'arrow-down': '↓',
    
    // Services & Cleaning
    'cleaning': '🧹',
    'sparkles': '✨',
    'sparkles-outline': '✨',
    'broom': '🧹',
    'vacuum': '🌀',
    'brush': '🪣',
    'water-drop': '💧',
    'detergent': '🧴',
    
    // People & Users
    'people': '👥',
    'people-outline': '👥',
    'person': '👤',
    'person-outline': '👤',
    'user': '👤',
    'user-outline': '👤',
    'crown': '👑',
    'admin': '👑',
    'employee': '👨‍💼',
    'customer': '👥',
    
    // Reports & Analytics
    'chart': '📊',
    'bar-chart': '📊',
    'bar-chart-outline': '📊',
    'pie-chart': '🥧',
    'trend': '📈',
    'analytics': '📊',
    'statistics': '📋',
    
    // Actions
    'add': '➕',
    'create': '➕',
    'edit': '✏️',
    'delete': '🗑️',
    'save': '💾',
    'cancel': '❌',
    'confirm': '✅',
    'approve': '✅',
    'reject': '❌',
    'complete': '🏁',
    'pending': '⏳',
    'loading': '⏳',
    
    // Time & Schedule
    'calendar': '📅',
    'clock': '🕐',
    'time': '🕐',
    'schedule': '📅',
    'appointment': '📅',
    'today': '📅',
    
    // Location & Address
    'location': '📍',
    'map': '🗺️',
    'address': '📍',
    'pin': '📍',
    'marker': '📍',
    
    // Communication
    'phone': '📱',
    'call': '📞',
    'message': '💬',
    'email': '✉️',
    'notification': '🔔',
    
    // Status & Feedback
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'status': '📊',
    'verified': '✅',
    'unverified': '❓',
    
    // Money & Bonuses
    'money': '💰',
    'bonus': '🎁',
    'gift': '🎁',
    'discount': '🏷️',
    'reward': '🎁',
    'loyalty': '⭐',
    
    // UI Elements
    'star': '⭐',
    'star-outline': '⭐',
    'heart': '❤️',
    'heart-outline': '🤍',
    'shield': '🛡️',
    'lock': '🔒',
    'unlock': '🔓',
    
    // Business
    'building': '🏢',
    'office': '🏢',
    'service': '🛠️',
    'tools': '🛠️',
    'equipment': '🧰'
  };

  const iconChar = iconMap[name] || iconMap[`${name}-outline`] || '⭐';
  
  const IconComponent = onPress ? TouchableOpacity : View;
  
  return (
    <IconComponent
      style={[styles.iconContainer, style]}
      onPress={onPress}
      activeOpacity={animated ? 0.7 : 1}
    >
      <Text 
        style={[
          styles.icon,
          { 
            fontSize: iconSize,
            color 
          }
        ]}
      >
        {iconChar}
      </Text>
    </IconComponent>
  );
};

// Specialized button with icon
export const IconButton = ({ 
  icon, 
  text, 
  variant = 'primary',
  size = 'md',
  style,
  onPress,
  disabled = false,
  loading = false,
  iconPosition = 'left'
}) => {
  const buttonStyle = [
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`buttonSize${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonDisabled,
    style
  ];

  const textStyle = [
    styles.buttonText,
    styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`buttonTextSize${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonTextDisabled
  ];

  const iconSize = size === 'sm' ? iconSizes.sm : size === 'lg' ? iconSizes.lg : iconSizes.md;
  const iconColor = variant === 'outline' ? modernTheme.colors.primary : modernTheme.colors.surface.primary;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {iconPosition === 'left' && icon && (
        <ModernIcon
          name={icon}
          size={iconSize}
          color={iconColor}
          style={styles.buttonIconLeft}
        />
      )}
      
      {loading ? (
        <Text style={textStyle}>...</Text>
      ) : (
        <Text style={textStyle}>
          {text}
        </Text>
      )}
      
      {iconPosition === 'right' && icon && (
        <ModernIcon
          name={icon}
          size={iconSize}
          color={iconColor}
          style={styles.buttonIconRight}
        />
      )}
    </TouchableOpacity>
  );
};

// Icon with badge/notification
export const IconWithBadge = ({ 
  icon, 
  badge, 
  size = 'md',
  style,
  ...props 
}) => {
  const hasBadge = badge && badge > 0;
  
  return (
    <View style={[styles.iconWithBadgeContainer, style]}>
      <ModernIcon name={icon} size={size} {...props} />
      {hasBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
};

// Status indicator with icon
export const StatusIcon = ({ 
  status, 
  size = 'md',
  style 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'success':
        return {
          icon: 'success',
          color: modernTheme.colors.success,
          backgroundColor: modernTheme.colors.successLight + '20'
        };
      case 'pending':
      case 'waiting':
        return {
          icon: 'pending',
          color: modernTheme.colors.warning,
          backgroundColor: modernTheme.colors.warningLight + '20'
        };
      case 'cancelled':
      case 'rejected':
      case 'error':
        return {
          icon: 'error',
          color: modernTheme.colors.error,
          backgroundColor: modernTheme.colors.errorLight + '20'
        };
      case 'completed':
        return {
          icon: 'complete',
          color: modernTheme.colors.primary,
          backgroundColor: modernTheme.colors.primaryLight + '20'
        };
      default:
        return {
          icon: 'info',
          color: modernTheme.colors.text.tertiary,
          backgroundColor: modernTheme.colors.background.tertiary
        };
    }
  };

  const config = getStatusConfig();
  
  return (
    <View style={[
      styles.statusIcon,
      { backgroundColor: config.backgroundColor },
      style
    ]}>
      <ModernIcon
        name={config.icon}
        size={size}
        color={config.color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: modernTheme.borderRadius.md,
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: modernTheme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: modernTheme.colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: modernTheme.colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSizeSm: {
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.sm,
    minHeight: 36,
  },
  buttonSizeMd: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingVertical: modernTheme.spacing.md,
    minHeight: 48,
  },
  buttonSizeLg: {
    paddingHorizontal: modernTheme.spacing.xl,
    paddingVertical: modernTheme.spacing.lg,
    minHeight: 56,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: modernTheme.colors.surface.primary,
  },
  buttonTextSecondary: {
    color: modernTheme.colors.surface.primary,
  },
  buttonTextOutline: {
    color: modernTheme.colors.primary,
  },
  buttonTextGhost: {
    color: modernTheme.colors.text.primary,
  },
  buttonTextDisabled: {
    color: modernTheme.colors.text.muted,
  },
  buttonTextSizeSm: {
    fontSize: 14,
  },
  buttonTextSizeMd: {
    fontSize: 16,
  },
  buttonTextSizeLg: {
    fontSize: 18,
  },
  buttonIconLeft: {
    marginRight: modernTheme.spacing.sm,
  },
  buttonIconRight: {
    marginLeft: modernTheme.spacing.sm,
  },
  
  // Badge styles
  iconWithBadgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: modernTheme.colors.error,
    borderRadius: modernTheme.borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: modernTheme.colors.surface.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Status styles
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: modernTheme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModernIcon;