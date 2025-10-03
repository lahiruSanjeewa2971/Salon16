import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function TodaysSchedule({ schedule, animatedStyle, onViewBooking }) {
  const { spacing, borderRadius, colors } = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in-progress': return colors.warning;
      case 'upcoming': return colors.accent; // Changed from colors.info to colors.accent for better visibility
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'time';
      case 'upcoming': return 'clock';
      case 'cancelled': return 'close-circle';
      default: return 'ellipse';
    }
  };

  const styles = {
    scheduleContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    scheduleHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    scheduleTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    scheduleSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    bookingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    bookingTime: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      width: 60,
    },
    bookingDetails: {
      flex: 1,
      marginLeft: spacing.md,
    },
    bookingService: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginBottom: spacing.xs,
    },
    bookingCustomer: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    bookingStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: spacing.md,
    },
    statusIcon: {
      marginRight: spacing.xs,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleHeader}>
          <ThemedText style={styles.scheduleTitle}>Today's Schedule</ThemedText>
          <ThemedText style={styles.scheduleSubtitle}>
            {schedule.length} appointments scheduled
          </ThemedText>
        </View>
        
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No appointments scheduled for today
            </ThemedText>
          </View>
        ) : (
          schedule.map((booking, index) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingItem}
              onPress={() => onViewBooking(booking)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.bookingTime}>
                {booking.time}
              </ThemedText>
              <View style={styles.bookingDetails}>
                <ThemedText style={styles.bookingService}>
                  {booking.service}
                </ThemedText>
                <ThemedText style={styles.bookingCustomer}>
                  {booking.customer}
                </ThemedText>
              </View>
              <View style={styles.bookingStatus}>
                <Ionicons
                  name={getStatusIcon(booking.status)}
                  size={16}
                  color={getStatusColor(booking.status)}
                  style={styles.statusIcon}
                />
                <ThemedText style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </Animated.View>
  );
}
