import React from 'react';
import { View, TouchableOpacity, Alert, Image } from 'react-native';
import Animated, { Extrapolate, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ServiceList({ 
  services, 
  fadeAnim, 
  onEditService, 
  onDeleteService, 
  onToggleServiceStatus 
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();

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
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderRadius: borderRadius.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      ...shadows.large,
    },
    serviceImageContainer: {
      height: 180,
      backgroundColor: colors.background + '20',
    },
    serviceImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    serviceImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.primary + '10',
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
      color: colors.text,
      marginBottom: spacing.xs,
    },
    serviceCategory: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: spacing.sm,
    },
    serviceDescription: {
      fontSize: 15,
      color: colors.textSecondary,
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
      backgroundColor: colors.primary + '08',
      borderRadius: borderRadius.large,
    },
    servicePrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    serviceDuration: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.large,
    },
    statusBadgeActive: {
      backgroundColor: colors.success + '15',
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    statusBadgeInactive: {
      backgroundColor: colors.error + '15',
      borderWidth: 1,
      borderColor: colors.error + '30',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    statusTextActive: {
      color: colors.success,
    },
    statusTextInactive: {
      color: colors.error,
    },
    serviceActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.08)',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.large,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonEdit: {
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    actionButtonDelete: {
      backgroundColor: colors.error + '15',
      borderWidth: 1,
      borderColor: colors.error + '30',
    },
    actionButtonToggle: {
      backgroundColor: colors.warning + '15',
      borderWidth: 1,
      borderColor: colors.warning + '30',
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '700',
    },
    actionButtonTextEdit: {
      color: colors.primary,
    },
    actionButtonTextDelete: {
      color: colors.error,
    },
    actionButtonTextToggle: {
      color: colors.warning,
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
                <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
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
