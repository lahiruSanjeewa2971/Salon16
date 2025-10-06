import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../ThemedText';
import { useTheme } from '../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomerDetailBottomSheet({
  visible,
  customer,
  onClose,
  onRemoveCustomer,
}) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);

  // Refs for gesture handling
  const gestureRef = useRef(null);

  // Gesture handler for drag to dismiss
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newTranslateY = context.startY + event.translationY;
      // Only allow dragging down
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
      }
    },
    onEnd: (event) => {
      const shouldDismiss = event.translationY > 100 || event.velocityY > 500;
      
      if (shouldDismiss) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        sheetOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    },
  });

  useEffect(() => {
    if (visible) {
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      sheetOpacity.value = withTiming(1, { duration: 400 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      sheetOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: sheetOpacity.value,
  }));

  const handleBackdropPress = () => {
    onClose();
  };

  const handleRemoveCustomer = () => {
    if (onRemoveCustomer) {
      onRemoveCustomer(customer);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastVisit = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return colors.success || '#10B981';
      case 'inactive':
        return colors.warning || '#F59E0B';
      case 'new':
        return colors.info || '#3B82F6';
      default:
        return colors.primary || '#6C2A52';
    }
  };

  const styles = {
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetContainer: {
      backgroundColor: 'white',
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
      maxHeight: SCREEN_HEIGHT * 0.85,
      minHeight: SCREEN_HEIGHT * 0.5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md || 12,
      paddingHorizontal: spacing.lg || 20,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E5E5E5',
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg || 20,
      paddingTop: spacing.sm || 8, // Very minimal padding
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl || 24,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary || '#6C2A52',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.lg || 20,
      shadowColor: colors.primary || '#6C2A52',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarText: {
      color: 'white',
      fontSize: 32,
      fontWeight: 'bold',
    },
    headerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#171717',
      marginBottom: spacing.xs || 4,
    },
    customerEmail: {
      fontSize: 16,
      color: '#525252',
      marginBottom: spacing.sm || 8,
    },
    statusBadge: {
      paddingHorizontal: spacing.md || 12,
      paddingVertical: spacing.xs || 4,
      borderRadius: borderRadius.md || 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      textTransform: 'uppercase',
    },
    closeButton: {
      position: 'absolute',
      top: spacing.lg || 20,
      right: spacing.lg || 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      elevation: 10, // For Android
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: spacing.xl || 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FAFAFA',
      borderRadius: borderRadius.lg || 16,
      padding: spacing.md || 12,
      marginHorizontal: spacing.xs || 4,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#171717',
      marginBottom: spacing.xs || 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#525252',
      textAlign: 'center',
    },
    section: {
      marginBottom: spacing.xl || 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#171717',
      marginBottom: spacing.md || 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm || 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F7F7F7',
    },
    detailIcon: {
      width: 24,
      height: 24,
      marginRight: spacing.md || 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 14,
      color: '#A3A3A3',
      marginBottom: spacing.xs || 2,
    },
    detailValue: {
      fontSize: 16,
      color: '#171717',
      fontWeight: '500',
    },
    actionsContainer: {
      paddingTop: spacing.lg || 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      marginTop: spacing.lg || 16,
    },
    removeButton: {
      backgroundColor: colors.error || '#EF4444',
      borderRadius: borderRadius.lg || 16,
      paddingVertical: spacing.md || 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.md || 12,
    },
    removeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: spacing.sm || 8,
    },
    notesContainer: {
      backgroundColor: '#FAFAFA',
      borderRadius: borderRadius.lg || 16,
      padding: spacing.md || 12,
      marginTop: spacing.sm || 8,
    },
    notesText: {
      fontSize: 14,
      color: '#525252',
      lineHeight: 20,
    },
    emptyNotes: {
      fontSize: 14,
      color: '#A3A3A3',
      fontStyle: 'italic',
    },
  };

  if (!customer) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={{ flex: 1 }}>
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={20}
                  style={{ flex: 1 }}
                  tint="dark"
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Bottom Sheet */}
        <PanGestureHandler ref={gestureRef} onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Handle Bar */}
              <TouchableOpacity 
                style={styles.handleContainer}
                activeOpacity={0.7}
                onPress={() => {
                  // Optional: Add haptic feedback here
                  console.log('Handle tapped');
                }}
              >
                <View style={styles.handleBar} />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  console.log('Close button pressed');
                  onClose();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#525252" />
              </TouchableOpacity>

              <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={true}
                contentContainerStyle={{ paddingBottom: spacing.xxl || 100 }}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.avatarContainer}>
                    <ThemedText style={styles.avatarText}>
                      {customer.name?.charAt(0)?.toUpperCase() || '?'}
                    </ThemedText>
                  </View>
                  <View style={styles.headerInfo}>
                    <ThemedText style={styles.customerName}>
                      {customer.name || 'Unknown Customer'}
                    </ThemedText>
                    <ThemedText style={styles.customerEmail}>
                      {customer.email || 'No email provided'}
                    </ThemedText>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(customer.status) }
                    ]}>
                      <ThemedText style={styles.statusText}>
                        {customer.status || 'Active'}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statNumber}>
                      {customer.totalBookings || 0}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Total Bookings</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statNumber}>
                      ${customer.totalSpent || 0}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
                  </View>
                  <View style={styles.statCard}>
                    <ThemedText style={styles.statNumber}>
                      {customer.favoriteService || 'N/A'}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Favorite Service</ThemedText>
                  </View>
                </View>

                {/* Customer Details */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="calendar-outline" size={20} color="#A3A3A3" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Member Since</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {formatDate(customer.memberSince)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="time-outline" size={20} color="#A3A3A3" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Last Visit</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {formatLastVisit(customer.lastVisit)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="star-outline" size={20} color="#A3A3A3" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Favorite Service</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {customer.favoriteService || 'Not specified'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="card-outline" size={20} color="#A3A3A3" />
                    </View>
                    <View style={styles.detailContent}>
                      <ThemedText style={styles.detailLabel}>Total Spent</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        ${customer.totalSpent || 0}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Notes Section */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
                  <View style={styles.notesContainer}>
                    <ThemedText style={[
                      styles.notesText,
                      !customer.notes && styles.emptyNotes
                    ]}>
                      {customer.notes || 'No notes available for this customer.'}
                    </ThemedText>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveCustomer}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                    <ThemedText style={styles.removeButtonText}>
                      Remove Customer
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
}
