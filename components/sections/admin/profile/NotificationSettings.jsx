import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  Extrapolate,
  FadeIn,
} from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { ThemedButton } from '../../../themed/ThemedButton';

const NotificationSettings = ({ 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  fadeAnim,
}) => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    dailySummary: true,
    bookingReminders: true,
    newBookingAlerts: true,
    rescheduleAlerts: true,
  });

  const styles = StyleSheet.create({
    sectionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      ...shadows.small,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1A1A1A',
    },
    notificationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: '#F9FAFB',
      borderRadius: borderRadius.medium,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    notificationInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    notificationLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: spacing.xs,
    },
    notificationDescription: {
      fontSize: 12,
      color: '#6B7280',
      lineHeight: 16,
    },
    toggleButton: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.success,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    toggleButtonOff: {
      backgroundColor: '#D1D5DB',
      alignItems: 'flex-start',
    },
    toggleCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    saveButton: {
      marginTop: spacing.md,
      borderRadius: borderRadius.medium,
    },
  });

  const handleToggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = () => {
    // TODO: Implement save notification settings
    console.log('Save notification settings:', notifications);
  };

  const notificationItems = [
    {
      key: 'emailAlerts',
      label: 'Email Alerts',
      description: 'Receive email notifications for important events',
      icon: 'mail-outline',
    },
    {
      key: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Get instant push notifications on your device',
      icon: 'notifications-outline',
    },
    {
      key: 'dailySummary',
      label: 'Daily Summary',
      description: 'Receive daily booking and revenue summaries',
      icon: 'bar-chart-outline',
    },
    {
      key: 'bookingReminders',
      label: 'Booking Reminders',
      description: 'Remind customers about upcoming appointments',
      icon: 'time-outline',
    },
    {
      key: 'newBookingAlerts',
      label: 'New Booking Alerts',
      description: 'Get notified when customers make new bookings',
      icon: 'calendar-outline',
    },
    {
      key: 'rescheduleAlerts',
      label: 'Reschedule Alerts',
      description: 'Be notified when customers request reschedules',
      icon: 'refresh-outline',
    },
  ];

  return (
    <Animated.View
      entering={FadeIn.delay(400)}
      style={[
        styles.sectionCard,
        {
          opacity: fadeAnim.value,
          transform: [
            {
              translateY: interpolate(
                fadeAnim.value,
                [0, 1],
                [50, 0],
                Extrapolate.CLAMP
              ),
            },
          ],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={colors.accent} 
          style={styles.sectionIcon}
        />
        <ThemedText style={styles.sectionTitle}>
          Notification Settings
        </ThemedText>
      </View>

      {notificationItems.map((item, index) => (
        <Animated.View 
          key={item.key} 
          entering={FadeIn.delay(500 + index * 100)}
          style={styles.notificationItem}
        >
          <View style={styles.notificationInfo}>
            <ThemedText style={styles.notificationLabel}>
              {item.label}
            </ThemedText>
            <ThemedText style={styles.notificationDescription}>
              {item.description}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !notifications[item.key] && styles.toggleButtonOff
            ]}
            onPress={() => handleToggleNotification(item.key)}
          >
            <View style={styles.toggleCircle} />
          </TouchableOpacity>
        </Animated.View>
      ))}

      <ThemedButton
        title="Save Notification Settings"
        onPress={handleSaveSettings}
        variant="primary"
        style={styles.saveButton}
        icon={<Ionicons name="save-outline" size={20} color="white" />}
      />
    </Animated.View>
  );
};

export default NotificationSettings;