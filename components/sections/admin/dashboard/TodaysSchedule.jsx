import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function TodaysSchedule({ bookings, loading, animatedStyle, onViewBooking }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const colors = theme?.colors || {};

  // Add null safety for bookings
  const safeBookings = bookings || [];

  // Format time helper
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors?.success || '#10B981';
      case 'in-progress': return colors?.warning || '#F59E0B';
      case 'upcoming': return colors?.info || '#3B82F6';
      case 'pending': return colors?.warning || '#F59E0B';
      case 'accepted': return colors?.success || '#10B981';
      case 'cancelled': return colors?.error || '#EF4444';
      case 'rejected': return colors?.error || '#EF4444';
      default: return colors?.textSecondary || '#666666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'time';
      case 'upcoming': return 'time-outline';
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
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
      marginRight: spacing.md,
    },
    bookingDetails: {
      flex: 1,
      marginRight: spacing.md,
    },
    bookingCustomer: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginBottom: spacing.xs,
    },
    bookingService: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: spacing.xs,
    },
    bookingPriceDurationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    bookingPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: colors?.accent || '#D4AF37',
      marginRight: spacing.xs,
    },
    bookingDuration: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    bookingStatus: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusIcon: {
      marginBottom: spacing.xs,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'capitalize',
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

  if (loading) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleHeader}>
            <ThemedText style={styles.scheduleTitle}>Today&apos;s Schedule</ThemedText>
            <ThemedText style={styles.scheduleSubtitle}>Loading bookings...</ThemedText>
          </View>
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>Loading...</ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleHeader}>
          <ThemedText style={styles.scheduleTitle}>Today&apos;s Schedule</ThemedText>
          <ThemedText style={styles.scheduleSubtitle}>
            {safeBookings.length} appointment{safeBookings.length !== 1 ? 's' : ''} scheduled
          </ThemedText>
        </View>
        
        {safeBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No appointments scheduled for today
            </ThemedText>
          </View>
        ) : (
          safeBookings.map((booking) => {
            const statusColor = getStatusColor(booking.status);
            const statusIcon = getStatusIcon(booking.status);
            
            return (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingItem}
                onPress={() => onViewBooking && onViewBooking(booking)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.bookingTime}>
                  {formatTime(booking.time)}
                </ThemedText>
                <View style={styles.bookingDetails}>
                  <ThemedText style={styles.bookingCustomer}>
                    {booking.customer}
                  </ThemedText>
                  <ThemedText style={styles.bookingService}>
                    {booking.service}
                  </ThemedText>
                  <View style={styles.bookingPriceDurationRow}>
                    <ThemedText style={styles.bookingPrice}>
                      ${booking.price}
                    </ThemedText>
                    {booking.duration != null && booking.duration > 0 ? (
                      <ThemedText style={styles.bookingDuration}>
                        {' • '}
                        {booking.duration} min
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
                <View style={styles.bookingStatus}>
                  <Ionicons
                    name={statusIcon}
                    size={20}
                    color={statusColor}
                    style={styles.statusIcon}
                  />
                  <ThemedText style={[styles.statusText, { color: statusColor }]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/-/g, ' ')}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </Animated.View>
  );
}
