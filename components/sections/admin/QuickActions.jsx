import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function QuickActions({ animatedStyle, onAddService, onNewBooking, onViewCustomers, onManageCategories }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  const actions = [
    {
      id: 'add-service',
      title: 'Add Service',
      subtitle: 'Create new service',
      icon: 'add-circle',
      color: colors.primary,
      onPress: onAddService,
    },
    {
      id: 'new-booking',
      title: 'New Booking',
      subtitle: 'Schedule appointment',
      icon: 'calendar',
      color: colors.success,
      onPress: onNewBooking,
    },
    {
      id: 'view-customers',
      title: 'View Customers',
      subtitle: 'Manage customers',
      icon: 'people',
      color: colors.info,
      onPress: onViewCustomers,
    },
    {
      id: 'manage-categories',
      title: 'Manage Categories',
      subtitle: 'Organize services',
      icon: 'grid',
      color: colors.warning,
      onPress: onManageCategories,
    },
  ];

  const styles = {
    actionsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    actionsHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    actionsSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    actionItem: {
      width: '50%',
      padding: spacing.lg,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
    },
    actionIcon: {
      marginBottom: spacing.sm,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    actionSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.actionsContainer}>
        <View style={styles.actionsHeader}>
          <ThemedText style={styles.actionsTitle}>Quick Actions</ThemedText>
          <ThemedText style={styles.actionsSubtitle}>
            Common tasks and shortcuts
          </ThemedText>
        </View>
        
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionItem}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon}
                size={32}
                color={action.color}
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionTitle}>
                {action.title}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {action.subtitle}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
