/**
 * Modern Icon System for Star Limpiezas Mobile
 * Replaces emojis with elegant, professional icons
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { modernTheme } from './ModernTheme';

const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40
};

// Icon mappings using MaterialIcons names
export const iconMap = {
    // Navigation & UI
    'home': 'home',
    'home-outline': 'home',
    'back': 'arrow-back',
    'menu': 'menu',
    'settings': 'settings',
    'search': 'search',
    'filter': 'filter-list',
    'sort': 'sort',
    'refresh': 'refresh',
    'close': 'close',
    'check': 'check',
    'arrow-right': 'arrow-forward',
    'arrow-left': 'arrow-back',
    'arrow-up': 'arrow-upward',
    'arrow-down': 'arrow-downward',

    // Services & Cleaning
    'cleaning': 'cleaning-services',
    'sparkles': 'auto-awesome',
    'sparkles-outline': 'auto-awesome',
    'broom': 'cleaning-services',
    'vacuum': 'cleaning-services',
    'brush': 'brush',
    'water-drop': 'water-drop',
    'detergent': 'local-laundry-service',

    // People & Users
    'people': 'people',
    'people-outline': 'people-outline',
    'person': 'person',
    'person-outline': 'person-outline',
    'user': 'person',
    'user-outline': 'person-outline',
    'crown': 'admin-panel-settings',
    'admin': 'admin-panel-settings',
    'employee': 'engineering',
    'customer': 'people',

    // Reports & Analytics
    'chart': 'bar-chart',
    'bar-chart': 'bar-chart',
    'bar-chart-outline': 'bar-chart',
    'pie-chart': 'pie-chart',
    'trend': 'trending-up',
    'analytics': 'analytics',
    'statistics': 'assessment',

    // Actions
    'add': 'add',
    'create': 'add',
    'edit': 'edit',
    'delete': 'delete',
    'save': 'save',
    'cancel': 'cancel',
    'confirm': 'check-circle',
    'approve': 'check-circle',
    'reject': 'cancel',
    'complete': 'check-circle',
    'pending': 'schedule',
    'loading': 'hourglass-empty',

    // Time & Schedule
    'calendar': 'calendar-today',
    'clock': 'schedule',
    'time': 'schedule',
    'schedule': 'schedule',
    'appointment': 'event',
    'today': 'today',

    // Location & Address
    'location': 'location-on',
    'map': 'map',
    'address': 'location-on',
    'pin': 'location-on',
    'marker': 'location-on',

    // Communication
    'phone': 'phone',
    'call': 'call',
    'message': 'message',
    'email': 'email',
    'notification': 'notifications',

    // Status & Feedback
    'success': 'check-circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info',
    'status': 'info',
    'verified': 'verified',
    'unverified': 'help',

    // Money & Bonuses
    'money': 'attach-money',
    'bonus': 'card-giftcard',
    'gift': 'card-giftcard',
    'discount': 'local-offer',
    'reward': 'card-giftcard',
    'loyalty': 'loyalty',

    // UI Elements
    'star': 'star',
    'star-outline': 'star-outline',
    'heart': 'favorite',
    'heart-outline': 'favorite-border',
    'shield': 'security',
    'lock': 'lock',
    'unlock': 'lock-open',

    // Business
    'building': 'business',
    'office': 'business',
    'service': 'build',
    'tools': 'build',
    'equipment': 'handyman'
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
        <MaterialIcons
          name={iconMap[icon] || 'star'}
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
        <MaterialIcons
          name={iconMap[icon] || 'star'}
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
      <MaterialIcons name={iconMap[icon] || 'star'} size={size} {...props} />
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
  const iconSize = typeof size === 'number' ? size : iconSizes[size] || iconSizes.md;

  return (
    <View style={[
      styles.statusIcon,
      { backgroundColor: config.backgroundColor },
      style
    ]}>
      <MaterialIcons
        name={iconMap[config.icon] || 'info'}
        size={iconSize}
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

// Vector icon component using MaterialIcons
const VectorIcon = ({ name, size = 'md', color = modernTheme.colors.text.primary, style, animated = true, onPress }) => {
  const iconSize = typeof size === 'number' ? size : iconSizes[size] || iconSizes.md;
  const iconName = iconMap[name] || iconMap[`${name}-outline`] || 'star';

  const IconComponent = onPress ? TouchableOpacity : View;

  return (
    <IconComponent
      style={[styles.iconContainer, style]}
      onPress={onPress}
      activeOpacity={animated ? 0.7 : 1}
    >
      <MaterialIcons
        name={iconName}
        size={iconSize}
        color={color}
      />
    </IconComponent>
  );
};

export default VectorIcon;