import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function TodaysBookings({ animatedStyle, bookings = [], onBookingAction, selectedDate }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return { name: 'checkmark-circle', color: colors?.success || '#10B981' };
      case 'in-progress':
        return { name: 'time', color: colors?.warning || '#F59E0B' };
      case 'upcoming':
        return { name: 'clock', color: colors?.info || '#3B82F6' };
      case 'cancelled':
        return { name: 'close-circle', color: colors?.error || '#EF4444' };
      default:
        return { name: 'help-circle', color: colors?.textSecondary || '#666666' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors?.success || '#10B981';
      case 'in-progress':
        return colors?.warning || '#F59E0B';
      case 'upcoming':
        return colors?.info || '#3B82F6';
      case 'cancelled':
        return colors?.error || '#EF4444';
      default:
        return colors?.textSecondary || '#666666';
    }
  };

  const handleBookingAction = (bookingId, action) => {
    if (onBookingAction) {
      onBookingAction(bookingId, action);
    }
  };

  // Format the selected date for display
  const formatSelectedDate = (dateString) => {
    if (!dateString) return 'Today';
    
    const date = new Date(dateString);
    const today = new Date();
    const isToday = dateString === today.toISOString().split('T')[0];
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const displayDate = formatSelectedDate(selectedDate);

  const styles = {
    bookingsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl * 2, // Extra bottom margin for spacing
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    bookingsHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    bookingsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    bookingsSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    bookingsList: {
      maxHeight: 400,
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
    bookingPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: colors?.accent || '#D4AF37',
    },
    bookingStatus: {
      alignItems: 'center',
      marginRight: spacing.md,
    },
    bookingActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      marginLeft: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    acceptButton: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    rejectButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
    },
  };

  if (!bookings || bookings.length === 0) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.bookingsContainer}>
          <View style={styles.bookingsHeader}>
            <ThemedText style={styles.bookingsTitle}>📋 {displayDate}'s Bookings</ThemedText>
            <ThemedText style={styles.bookingsSubtitle}>
              No bookings scheduled for {displayDate.toLowerCase()}
            </ThemedText>
          </View>
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No appointments scheduled for {displayDate.toLowerCase()}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
        <View style={styles.bookingsContainer}>
          <View style={styles.bookingsHeader}>
            <ThemedText style={styles.bookingsTitle}>📋 {displayDate}'s Bookings</ThemedText>
            <ThemedText style={styles.bookingsSubtitle}>
              {bookings.length} appointment{bookings.length !== 1 ? 's' : ''} scheduled
            </ThemedText>
          </View>
        
        <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
          {bookings.map((booking) => {
            const statusIcon = getStatusIcon(booking.status);
            const statusColor = getStatusColor(booking.status);
            
            return (
              <View key={booking.id} style={styles.bookingItem}>
                <ThemedText style={styles.bookingTime}>
                  {booking.time}
                </ThemedText>
                
                <View style={styles.bookingDetails}>
                  <ThemedText style={styles.bookingCustomer}>
                    {booking.customer}
                  </ThemedText>
                  <ThemedText style={styles.bookingService}>
                    {booking.service}
                  </ThemedText>
                  <ThemedText style={styles.bookingPrice}>
                    ${booking.price}
                  </ThemedText>
                </View>
                
                <View style={styles.bookingStatus}>
                  <Ionicons 
                    name={statusIcon.name} 
                    size={20} 
                    color={statusColor} 
                  />
                </View>
                
                <View style={styles.bookingActions}>
                  {booking.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleBookingAction(booking.id, 'accept')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={16} color={colors?.success || '#10B981'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleBookingAction(booking.id, 'reject')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={16} color={colors?.error || '#EF4444'} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
