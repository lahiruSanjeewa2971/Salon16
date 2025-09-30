import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import Animated, { Extrapolate, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToastHelpers } from '../../ui/ToastSystem';

export default function ServiceList({ 
  services, 
  fadeAnim, 
  onEditService, 
  onDeleteService, 
  onToggleServiceStatus 
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { showSuccess } = useToastHelpers();

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteService(service);
            showSuccess('Service deleted successfully!');
          },
        },
      ]
    );
  };

  const handleToggleServiceStatus = (service) => {
    onToggleServiceStatus(service);
    showSuccess(`Service ${service.isActive ? 'deactivated' : 'activated'}!`);
  };

  const styles = {
    servicesGrid: {
      paddingHorizontal: spacing.lg,
    },
    serviceCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
      ...shadows.medium,
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
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    serviceCategory: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    serviceDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: borderRadius.medium,
    },
    servicePrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    serviceDuration: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.small,
      marginRight: spacing.sm,
    },
    statusBadgeActive: {
      backgroundColor: colors.success + '20',
    },
    statusBadgeInactive: {
      backgroundColor: colors.error + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
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
      borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      alignItems: 'center',
    },
    actionButtonEdit: {
      backgroundColor: colors.primary + '20',
    },
    actionButtonDelete: {
      backgroundColor: colors.error + '20',
    },
    actionButtonToggle: {
      backgroundColor: colors.warning + '20',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
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
          key={service.id || `service-${index}`}
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
                {service.isActive ? 'Active' : 'Inactive'}
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
        </Animated.View>
      ))}
    </View>
  );
}
