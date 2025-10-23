import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useResponsive } from '../../hooks/useResponsive';

const BookingCard = ({
  booking,
  colors,
  spacing,
  borderRadius,
  shadows,
  onReschedule,
  onCancel,
  onViewDetails,
  // Animation values
  fadeAnim,
  slideUpAnim,
}) => {
  const responsive = useResponsive();
  
  // Press animation
  const pressAnim = useSharedValue(1);

  const handlePress = () => {
    pressAnim.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    setTimeout(() => {
      pressAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 100);
    onViewDetails(booking);
  };

  const handleReschedulePress = () => {
    onReschedule(booking);
  };

  const handleCancelPress = () => {
    onCancel(booking);
  };

  // Status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          icon: 'time-outline',
          label: 'Pending'
        };
      case 'confirmed':
        return {
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.15)',
          icon: 'checkmark-circle',
          label: 'Confirmed'
        };
      case 'completed':
        return {
          color: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.15)',
          icon: 'checkmark-done',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          icon: 'close-circle',
          label: 'Cancelled'
        };
      default:
        return {
          color: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.15)',
          icon: 'help-circle',
          label: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const canReschedule = ['pending', 'confirmed'].includes(booking.status);
  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideUpAnim.value },
      { scale: pressAnim.value },
    ],
  }));

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    cardContent: {
      padding: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    serviceInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    serviceName: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: spacing.xs,
      lineHeight: responsive.isSmallScreen ? responsive.responsive.fontSize(2.2) : responsive.responsive.fontSize(2.4),
    },
    bookingId: {
      fontSize: 13,
      color: '#6B7280',
      fontFamily: 'monospace',
      fontWeight: '500',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: statusConfig.color + '30',
      marginTop: spacing.sm,
    },
    statusIcon: {
      marginRight: spacing.xs,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: statusConfig.color,
    },
    detailsGrid: {
      marginBottom: spacing.lg,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: borderRadius.large,
    },
    detailIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: statusConfig.color + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    detailText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1F2937',
    },
    actions: {
      flexDirection: 'row',
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.05)',
      gap: spacing.sm,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.large,
      height: 44,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    rescheduleButton: {
      backgroundColor: '#F59E0B',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    cancelButton: {
      backgroundColor: '#EF4444',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.large,
      backgroundColor: colors.primary || '#6B46C1',
      height: 44,
      flex: 1,
      shadowColor: colors.primary || '#6B46C1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    viewDetailsButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
  });

  return (
    <Animated.View style={[styles.container, cardAnimatedStyle]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Header with Status */}
        <View style={styles.header}>
          <View style={styles.serviceInfo}>
            <ThemedText style={styles.serviceName}>
              {booking.serviceName}
            </ThemedText>
            <ThemedText style={styles.bookingId}>
              #{booking.bookingId}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons
              name={statusConfig.icon}
              size={12}
              color={statusConfig.color}
              style={styles.statusIcon}
            />
            <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </ThemedText>
          </View>
        </View>

        {/* Service Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#3B82F6' + '10' }]}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#3B82F6"
              />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Date</ThemedText>
              <ThemedText style={styles.detailText}>{booking.date}</ThemedText>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#EC4899' + '10' }]}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#EC4899"
              />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Time</ThemedText>
              <ThemedText style={styles.detailText}>{booking.time}</ThemedText>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#10B981' + '10' }]}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#10B981"
              />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Stylist</ThemedText>
              <ThemedText style={styles.detailText}>{booking.stylist}</ThemedText>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: '#F59E0B' + '10' }]}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color="#F59E0B"
              />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Price</ThemedText>
              <ThemedText style={styles.detailText}>${booking.price}</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canReschedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={handleReschedulePress}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.actionButtonText}>
                Reschedule
              </ThemedText>
            </TouchableOpacity>
          )}
          
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelPress}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.actionButtonText}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.viewDetailsButtonText}>
              View Details
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default BookingCard;