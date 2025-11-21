/**
 * Modern Loading States and Components for Star Limpiezas Mobile
 * Elegant loading animations and interactions
 */
import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { modernTheme } from './ModernTheme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { iconMap } from './ModernIcon';

export const ModernSpinner = ({
    size = 'large',
    color = modernTheme.colors.primary,
    text,
    style,
    isModal = false,
    visible = true
}) => {
    const spinnerContent = (
        <View style={[styles.spinnerContainer, style]}>
            <ActivityIndicator size={size} color={color} />
            {text && (
                <Text style={[styles.spinnerText, { color }]}>
                    {text}
                </Text>
            )}
        </View>
    );

    if (isModal) {
        if (!visible) return null;
        return (
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {spinnerContent}
                </View>
            </View>
        );
    }

    return spinnerContent;
};

// Pulsing Loading Animation
export const PulsingLoader = ({
    text = 'Cargando...',
    style
}) => {
    const [pulseAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        const createPulseAnimation = () => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const animation = createPulseAnimation();
        animation.start();

        return () => animation.stop();
    }, []);

    return (
        <View style={[styles.pulsingContainer, style]}>
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        opacity: pulseAnim,
                    }
                ]}
            >
                <ActivityIndicator size="large" color={modernTheme.colors.primary} />
            </Animated.View>
            <Text style={styles.pulsingText}>{text}</Text>
        </View>
    );
};

// Skeleton Loader for content loading
export const SkeletonLoader = ({
    height = 20,
    width = '100%',
    style
}) => {
    const [skeletonAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        const createSkeletonAnimation = () => {
            return Animated.loop(
                Animated.timing(skeletonAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: false,
                })
            );
        };

        const animation = createSkeletonAnimation();
        animation.start();

        return () => animation.stop();
    }, []);

    const backgroundColor = skeletonAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [
            modernTheme.colors.background.tertiary,
            modernTheme.colors.background.secondary,
            modernTheme.colors.background.tertiary
        ]
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    height,
                    width,
                    backgroundColor
                },
                style
            ]}
        />
    );
};

// Modern Card Skeleton
export const CardSkeleton = ({ style }) => {
    return (
        <View style={[styles.cardSkeleton, style]}>
            <SkeletonLoader height={24} style={styles.skeletonTitle} />
            <SkeletonLoader height={16} width="80%" style={styles.skeletonLine} />
            <SkeletonLoader height={16} width="90%" style={styles.skeletonLine} />
            <View style={styles.skeletonActions}>
                <SkeletonLoader
                    height={40}
                    width="45%"
                    style={styles.skeletonButton}
                />
                <SkeletonLoader
                    height={40}
                    width="45%"
                    style={styles.skeletonButton}
                />
            </View>
        </View>
    );
};

// Pull-to-refresh indicator
export const ModernPullToRefresh = ({
    refreshing,
    onRefresh,
    colors = [modernTheme.colors.primary]
}) => {
    const [rotateAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        if (refreshing) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [refreshing]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.pullToRefreshContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialIcons name="refresh" size={24} color={modernTheme.colors.primary} />
            </Animated.View>
            {refreshing && (
                <Text style={styles.pullToRefreshText}>
                    Cargando...
                </Text>
            )}
        </View>
    );
};

// Toast notification component
export const ModernToast = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onClose
}) => {
    const [slideAnim] = React.useState(new Animated.Value(-100));
    const [opacityAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            // Slide in animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss
            if (duration > 0) {
                setTimeout(() => {
                    handleClose();
                }, duration);
            }
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose && onClose();
        });
    };

    if (!visible) return null;

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: modernTheme.colors.success,
                    icon: 'success'
                };
            case 'error':
                return {
                    backgroundColor: modernTheme.colors.error,
                    icon: 'error'
                };
            case 'warning':
                return {
                    backgroundColor: modernTheme.colors.warning,
                    icon: 'warning'
                };
            default:
                return {
                    backgroundColor: modernTheme.colors.primary,
                    icon: 'info'
                };
        }
    };

    const config = getToastConfig();

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: config.backgroundColor,
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim
                }
            ]}
        >
            <MaterialIcons name={iconMap[config.icon] || 'info'} size={20} color={modernTheme.colors.text.inverse} style={styles.toastIcon} />
            <Text style={styles.toastText}>{message}</Text>
            <TouchableOpacity onPress={handleClose}>
                <MaterialIcons name="close" size={20} color={modernTheme.colors.text.inverse} />
            </TouchableOpacity>
        </Animated.View>
    );
};

// Empty state component
export const ModernEmptyState = ({
    icon = 'info',
    title = 'No hay datos disponibles',
    subtitle = 'Intenta actualizar o agregar nuevo contenido',
    actionText,
    onAction,
    style
}) => {
    const [bounceAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const bounce = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1]
    });

    return (
        <View style={[styles.emptyStateContainer, style]}>
            <Animated.View
                style={[
                    styles.emptyStateIcon,
                    { transform: [{ scale: bounce }] }
                ]}
            >
                <MaterialIcons name={iconMap[icon] || 'info'} size={64} color={modernTheme.colors.primary} />
            </Animated.View>
            <Text style={styles.emptyStateTitle}>{title}</Text>
            <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
            {actionText && onAction && (
                <TouchableOpacity
                    style={styles.emptyStateAction}
                    onPress={onAction}
                >
                    <Text style={styles.emptyStateActionText}>{actionText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Progress indicator
export const ModernProgress = ({
    progress = 0,
    color = modernTheme.colors.primary,
    height = 4,
    showPercentage = false,
    style
}) => {
    const [progressAnim] = React.useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const width = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={[styles.progressContainer, style, { height }]}>
            <Animated.View
                style={[
                    styles.progressBar,
                    {
                        width,
                        backgroundColor: color
                    }
                ]}
            />
            {showPercentage && (
                <Text style={styles.progressText}>
                    {Math.round(progress * 100)}%
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Spinner styles
    spinnerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinnerText: {
        marginTop: modernTheme.spacing.md,
        ...modernTheme.typography.body,
        fontWeight: '500',
    },

    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: modernTheme.colors.surface.primary,
        borderRadius: modernTheme.borderRadius.lg,
        padding: modernTheme.spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        ...modernTheme.shadows.large,
    },

    // Pulsing loader styles
    pulsingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: modernTheme.spacing.xxl,
    },
    pulseRing: {
        width: 80,
        height: 80,
        borderRadius: modernTheme.borderRadius.full,
        backgroundColor: modernTheme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: modernTheme.spacing.lg,
    },
    pulsingText: {
        ...modernTheme.typography.body,
        color: modernTheme.colors.text.secondary,
        fontWeight: '500',
    },

    // Skeleton styles
    skeleton: {
        borderRadius: modernTheme.borderRadius.sm,
    },
    cardSkeleton: {
        backgroundColor: modernTheme.colors.surface.primary,
        padding: modernTheme.spacing.lg,
        borderRadius: modernTheme.borderRadius.lg,
        marginBottom: modernTheme.spacing.md,
        ...modernTheme.shadows.small,
    },
    skeletonTitle: {
        marginBottom: modernTheme.spacing.md,
    },
    skeletonLine: {
        marginBottom: modernTheme.spacing.sm,
    },
    skeletonActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: modernTheme.spacing.lg,
    },
    skeletonButton: {
        borderRadius: modernTheme.borderRadius.sm,
    },

    // Pull to refresh styles
    pullToRefreshContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: modernTheme.spacing.md,
    },
    pullToRefreshText: {
        ...modernTheme.typography.bodySmall,
        color: modernTheme.colors.text.secondary,
        marginLeft: modernTheme.spacing.sm,
    },

    // Toast styles
    toastContainer: {
        position: 'absolute',
        top: 50,
        left: modernTheme.spacing.lg,
        right: modernTheme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: modernTheme.spacing.md,
        borderRadius: modernTheme.borderRadius.lg,
        ...modernTheme.shadows.medium,
    },
    toastIcon: {
        marginRight: modernTheme.spacing.sm,
    },
    toastText: {
        ...modernTheme.typography.body,
        color: modernTheme.colors.text.inverse,
        flex: 1,
    },

    // Empty state styles
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: modernTheme.spacing.xxl,
        paddingHorizontal: modernTheme.spacing.lg,
    },
    emptyStateIcon: {
        marginBottom: modernTheme.spacing.lg,
    },
    emptyStateTitle: {
        ...modernTheme.typography.h4,
        color: modernTheme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: modernTheme.spacing.sm,
    },
    emptyStateSubtitle: {
        ...modernTheme.typography.body,
        color: modernTheme.colors.text.muted,
        textAlign: 'center',
        marginBottom: modernTheme.spacing.lg,
    },
    emptyStateAction: {
        backgroundColor: modernTheme.colors.primary,
        paddingHorizontal: modernTheme.spacing.lg,
        paddingVertical: modernTheme.spacing.md,
        borderRadius: modernTheme.borderRadius.md,
        ...modernTheme.shadows.small,
    },
    emptyStateActionText: {
        ...modernTheme.typography.body,
        color: modernTheme.colors.text.inverse,
        fontWeight: '600',
    },

    // Progress styles
    progressContainer: {
        backgroundColor: modernTheme.colors.background.tertiary,
        borderRadius: modernTheme.borderRadius.full,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: modernTheme.borderRadius.full,
    },
    progressText: {
        ...modernTheme.typography.caption,
        marginTop: modernTheme.spacing.xs,
        textAlign: 'center',
    },
});
