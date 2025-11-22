import { Alert, Image, Platform, TouchableOpacity, View } from 'react-native';
import Animated, { Extrapolate, interpolate } from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { ThemedText } from '../../../ThemedText';

export default function ServiceList({ 
  services, 
  fadeAnim, 
  onEditService, 
  onDeleteService, 
  onToggleServiceStatus 
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const isWeb = Platform.OS === 'web';
  
  // Helper function to add alpha to hex color
  const addAlpha = (color, alpha) => {
    if (!color) return `rgba(255, 255, 255, ${alpha})`;
    // If color is already rgba, extract RGB values
    if (color.startsWith('rgba')) {
      const rgb = color.match(/\d+/g);
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
    // If color is hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Fallback
    return color;
  };
  
  // Web-compatible color helpers
  const getCardBackgroundColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.15)';
    }
    return 'rgba(255, 255, 255, 0.98)';
  };
  
  const getCardBorderColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.3)';
    }
    return 'rgba(0, 0, 0, 0.08)';
  };
  
  const getTextColor = () => {
    if (isWeb) {
      return '#FFFFFF';
    }
    return colors?.text || '#000000';
  };
  
  const getTextSecondaryColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.8)';
    }
    return colors?.textSecondary || '#666666';
  };
  
  const getActionBorderColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.2)';
    }
    return 'rgba(0, 0, 0, 0.08)';
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteService(service);
          },
        },
      ]
    );
  };

  const handleToggleServiceStatus = (service) => {
    onToggleServiceStatus(service);
  };

  const styles = {
    servicesGrid: {
      paddingHorizontal: spacing.lg,
    },
    serviceCard: {
      backgroundColor: getCardBackgroundColor(),
      borderRadius: borderRadius.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      overflow: 'hidden',
      ...Platform.select({
        web: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        default: shadows.large,
      }),
    },
    serviceImageContainer: {
      height: 180,
      backgroundColor: addAlpha(colors?.background || '#FFFFFF', 0.2),
    },
    serviceImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    serviceImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: addAlpha(colors?.primary || '#6C2A52', 0.1),
      justifyContent: 'center',
      alignItems: 'center',
    },
    serviceContent: {
      padding: spacing.lg,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    serviceInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    serviceName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: getTextColor(),
      marginBottom: spacing.xs,
    },
    serviceCategory: {
      fontSize: 14,
      color: getTextSecondaryColor(),
      fontWeight: '500',
      marginBottom: spacing.sm,
    },
    serviceDescription: {
      fontSize: 15,
      color: getTextSecondaryColor(),
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: addAlpha(colors?.primary || '#6C2A52', 0.08),
      borderRadius: borderRadius.large,
    },
    servicePrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isWeb ? '#FFFFFF' : (colors?.primary || '#6C2A52'),
    },
    serviceDuration: {
      fontSize: 16,
      color: getTextSecondaryColor(),
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
    },
    statusBadgeActive: {
      backgroundColor: addAlpha(colors?.success || '#10B981', 0.15),
      borderWidth: 1,
      borderColor: addAlpha(colors?.success || '#10B981', 0.3),
    },
    statusBadgeInactive: {
      backgroundColor: addAlpha(colors?.error || '#EF4444', 0.15),
      borderWidth: 1,
      borderColor: addAlpha(colors?.error || '#EF4444', 0.3),
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    statusTextActive: {
      color: colors?.success || '#10B981',
    },
    statusTextInactive: {
      color: colors?.error || '#EF4444',
    },
    serviceActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: getActionBorderColor(),
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
    },
    actionButtonEdit: {
      backgroundColor: isWeb 
        ? 'rgba(236, 72, 153, 0.4)' // Pink/rose color for web
        : addAlpha(colors?.primary || '#6C2A52', 0.4),
    },
    actionButtonDelete: {
      backgroundColor: isWeb
        ? 'rgba(239, 68, 68, 0.5)' // Red color for web
        : addAlpha(colors?.error || '#EF4444', 0.5),
    },
    actionButtonToggle: {
      backgroundColor: isWeb
        ? 'rgba(251, 146, 60, 0.5)' // Orange/yellow color for web
        : addAlpha(colors?.warning || '#F59E0B', 0.5),
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionButtonTextEdit: {
      color: '#FFFFFF',
    },
    actionButtonTextDelete: {
      color: '#FFFFFF',
    },
    actionButtonTextToggle: {
      color: '#FFFFFF',
    },
  };

  return (
    <View style={styles.servicesGrid}>
      {services.map((service, index) => (
        <Animated.View
          key={`service-${service.id}-${index}`}
          style={[
            styles.serviceCard,
            {
              opacity: fadeAnim.value,
              transform: [
                {
                  translateY: interpolate(
                    fadeAnim.value,
                    [0, 1],
                    [50 + index * 10, 0],
                    Extrapolate.CLAMP
                  ),
                },
              ],
            },
          ]}
        >
          {/* Service Image */}
          <View style={styles.serviceImageContainer}>
            {service.image && service.image.trim() ? (
              <Image
                source={{ uri: service.image }}
                style={styles.serviceImage}
                resizeMode="cover"
                onError={() => {
                  console.log('Image failed to load:', service.image);
                }}
              />
            ) : (
              <View style={styles.serviceImagePlaceholder}>
                <ThemedText style={{ color: isWeb ? '#FFFFFF' : (colors?.primary || '#6C2A52'), fontSize: 16, fontWeight: '600' }}>
                  No Image
                </ThemedText>
              </View>
            )}
          </View>

          {/* Service Content */}
          <View style={styles.serviceContent}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <ThemedText style={styles.serviceName}>
                  {service.name}
                </ThemedText>
                <ThemedText style={styles.serviceCategory}>
                  {service.category}
                </ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                service.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  service.isActive ? styles.statusTextActive : styles.statusTextInactive
                ]}>
                  {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.serviceDescription}>
              {service.description}
            </ThemedText>

            <View style={styles.serviceDetails}>
              <ThemedText style={styles.servicePrice}>
                ${service.price}
              </ThemedText>
              <ThemedText style={styles.serviceDuration}>
                {service.duration} min
              </ThemedText>
            </View>

            <View style={styles.serviceActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonEdit]}
                onPress={() => onEditService(service)}
              >
                <ThemedText style={[styles.actionButtonText, styles.actionButtonTextEdit]}>
                  Edit
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonToggle]}
                onPress={() => handleToggleServiceStatus(service)}
              >
                <ThemedText style={[styles.actionButtonText, styles.actionButtonTextToggle]}>
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDelete]}
                onPress={() => handleDeleteService(service)}
              >
                <ThemedText style={[styles.actionButtonText, styles.actionButtonTextDelete]}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
