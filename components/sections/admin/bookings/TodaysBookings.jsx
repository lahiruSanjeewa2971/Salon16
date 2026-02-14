import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { ThemedText } from '../../../ThemedText';

export default function TodaysBookings({ animatedStyle, bookings = [], onBookingAction, selectedDate, salonStatus = null, loading = false }) {
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
      case 'completed': return '#10B981'; // Bright green
      case 'in-progress': return '#F59E0B'; // Bright orange
      case 'upcoming': return '#3B82F6'; // Bright blue
      case 'pending': return '#F59E0B'; // Bright orange
      case 'accepted': return '#10B981'; // Bright green
      case 'cancelled': return '#EF4444'; // Bright red
      case 'rejected': return '#FF4444'; // Bright red for better visibility
      default: return '#FFFFFF'; // White for better visibility
    }
  };

  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case 'rejected': return 'rgba(255, 255, 255, 0.69)'; // White background for rejected
      case 'cancelled': return 'rgba(255, 255, 255, 0.69)'; // White background for cancelled
      default: return 'rgba(255, 255, 255, 0.69)'; // Default white background
    }
  };

  // Salon status helper functions
  const getSalonStatusInfo = () => {
    if (!salonStatus) return null;
    
    const dayOfWeek = salonStatus.dayOfWeek;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    const isTuesday = dayOfWeek === 2;
    
    if (salonStatus.isClosed || salonStatus.isHoliday) {
      return {
        status: 'closed',
        icon: salonStatus.isHoliday ? '🎉' : (isTuesday ? '🔒' : '❌'),
        title: salonStatus.isHoliday ? 'Holiday Closure' : (isTuesday ? 'Tuesday Closure' : 'Salon Closed'),
        message: salonStatus.isHoliday ? 'Salon is closed for holiday' : 
                (isTuesday ? 'Tuesday is our weekly closure day' : 'Salon is closed today'),
        color: colors?.status?.error || '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      };
    } else if (salonStatus.disableBookings) {
      return {
        status: 'bookings-disabled',
        icon: '⚠️',
        title: 'Bookings Disabled',
        message: 'Salon is open but bookings are disabled',
        color: colors?.status?.warning || '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)'
      };
    } else {
      return {
        status: 'open',
        icon: '✅',
        title: 'Salon Open',
        message: `Open from ${formatTime(salonStatus.openTime)} to ${formatTime(salonStatus.closeTime)}`,
        color: colors?.status?.success || '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)'
      };
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
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
  const salonStatusInfo = getSalonStatusInfo();

  // Salon Status Component
  const SalonStatusCard = () => {
    if (!salonStatusInfo) return null;
    
    return (
      <View style={[styles.salonStatusContainer, { 
        backgroundColor: salonStatusInfo.backgroundColor,
        borderColor: salonStatusInfo.borderColor 
      }]}>
        <View style={styles.salonStatusHeader}>
          <ThemedText style={styles.salonStatusIcon}>{salonStatusInfo.icon}</ThemedText>
          <ThemedText style={[styles.salonStatusTitle, { color: salonStatusInfo.color }]}>
            {salonStatusInfo.title}
          </ThemedText>
        </View>
        <ThemedText style={styles.salonStatusMessage}>
          {salonStatusInfo.message}
        </ThemedText>
        
        {salonStatus && salonStatusInfo && salonStatusInfo.status === 'open' ? (
          <View style={styles.salonStatusDetails}>
            <View style={styles.salonStatusDetailRow}>
              <ThemedText style={styles.salonStatusDetailLabel}>Open Time:</ThemedText>
              <ThemedText style={styles.salonStatusDetailValue}>
                {formatTime(salonStatus.openTime)}
              </ThemedText>
            </View>
            <View style={styles.salonStatusDetailRow}>
              <ThemedText style={styles.salonStatusDetailLabel}>Close Time:</ThemedText>
              <ThemedText style={styles.salonStatusDetailValue}>
                {formatTime(salonStatus.closeTime)}
              </ThemedText>
            </View>
            {salonStatus.isSpecific ? (
              <View style={styles.salonStatusDetailRow}>
                <ThemedText style={styles.salonStatusDetailLabel}>Status:</ThemedText>
                <ThemedText style={styles.salonStatusDetailValue}>Custom Hours</ThemedText>
              </View>
            ) : null}
            {salonStatus.notes ? (
              <View style={styles.salonStatusDetailRow}>
                <ThemedText style={styles.salonStatusDetailLabel}>Notes:</ThemedText>
                <ThemedText style={styles.salonStatusDetailValue}>{salonStatus.notes}</ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

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
      minWidth: 70,
      marginRight: spacing.md,
    },
    statusIcon: {
      marginBottom: spacing.xs,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'capitalize',
      paddingHorizontal: spacing.sm || 8,
      paddingVertical: spacing.xs || 4,
      borderRadius: borderRadius.md || 8,
      overflow: 'hidden',
    },
    bookingActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      borderRadius: borderRadius.md || 8,
      padding: spacing.md,
      marginLeft: spacing.sm,
      borderWidth: 2,
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    },
    acceptButton: {
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: '#10B981',
    },
    rejectButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.5)',
      borderColor: '#EF4444',
    },
    delayButton: {
      backgroundColor: 'rgba(245, 158, 11, 0.5)',
      borderColor: '#F59E0B',
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
    // Salon Status Styles
    salonStatusContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.lg,
      margin: spacing.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    salonStatusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    salonStatusIcon: {
      fontSize: 20,
      marginRight: spacing.sm,
    },
    salonStatusTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      flex: 1,
    },
    salonStatusMessage: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 20,
    },
    salonStatusDetails: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    salonStatusDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    salonStatusDetailLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      fontWeight: '500',
    },
    salonStatusDetailValue: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.bookingsContainer}>
          <View style={styles.bookingsHeader}>
            <ThemedText style={styles.bookingsTitle}>📋 {displayDate}&apos;s Bookings</ThemedText>
            <ThemedText style={styles.bookingsSubtitle}>Loading bookings...</ThemedText>
          </View>
          
          {/* Salon Status Card */}
          <SalonStatusCard />
          
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>Loading...</ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.bookingsContainer}>
          <View style={styles.bookingsHeader}>
            <ThemedText style={styles.bookingsTitle}>📋 {displayDate}&apos;s Bookings</ThemedText>
            <ThemedText style={styles.bookingsSubtitle}>
              No bookings scheduled for {displayDate.toLowerCase()}
            </ThemedText>
          </View>
          
          {/* Salon Status Card */}
          <SalonStatusCard />
          
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
            <ThemedText style={styles.bookingsTitle}>📋 {displayDate}&apos;s Bookings</ThemedText>
            <ThemedText style={styles.bookingsSubtitle}>
              {bookings.length} appointment{bookings.length !== 1 ? 's' : ''} scheduled
            </ThemedText>
          </View>
          
          {/* Salon Status Card */}
          <SalonStatusCard />
        
        <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
          {bookings.map((booking) => {
            const statusIcon = getStatusIcon(booking.status);
            const statusColor = getStatusColor(booking.status);
            
            return (
              <View key={booking.id} style={styles.bookingItem}>
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
                      Rs.{booking.price}
                    </ThemedText>
                    {booking.duration != null && booking.duration > 0 ? (
                      <ThemedText style={styles.bookingDuration}>
                        {' • '}
                        {booking.duration} min
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
                
                {booking.status === 'pending' ? (
                  <View style={styles.bookingActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleBookingAction(booking.id, 'accept')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleBookingAction(booking.id, 'reject')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.delayButton]}
                      onPress={() => handleBookingAction(booking.id, 'delay')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.bookingStatus}>
                    <ThemedText style={[styles.statusText, { 
                      color: getStatusColor(booking.status), 
                      backgroundColor: getStatusBackgroundColor(booking.status) 
                    }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/-/g, ' ')}
                    </ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
