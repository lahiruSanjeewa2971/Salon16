import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_CHARACTERS = 200;

export default function BookingRejectionBottomSheet({
  visible,
  booking,
  onClose,
  onSend,
}) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // State for rejection note
  const [rejectionNote, setRejectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);

  // Clear note when booking changes or sheet closes
  useEffect(() => {
    if (!visible) {
      setRejectionNote('');
      setIsSubmitting(false);
    }
  }, [visible, booking?.id]);

  // Define handleClose before it's used in panGesture
  const handleClose = () => {
    setRejectionNote('');
    setIsSubmitting(false);
    onClose();
  };

  // Modern gesture handler for drag to dismiss
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting position
    })
    .onUpdate((event) => {
      const newTranslateY = translateY.value + event.translationY;
      // Only allow dragging down
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
      }
    })
    .onEnd((event) => {
      const shouldDismiss = event.translationY > 100 || event.velocityY > 500;
      
      if (shouldDismiss) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        sheetOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
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
  }, [visible, backdropOpacity, sheetOpacity, translateY]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: sheetOpacity.value,
  }));

  const handleBackdropPress = () => {
    handleClose();
  };

  const handleNoteChange = (text) => {
    if (text.length <= MAX_CHARACTERS) {
      setRejectionNote(text);
    }
  };

  const handleSend = async () => {
    if (isSubmitting) return;

    // Validation
    if (rejectionNote.trim().length === 0) {
      // Note is optional, but we can still send rejection
      // If you want to make it required, uncomment below:
      // return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSend) {
        await onSend(booking.id, rejectionNote.trim());
      }
      handleClose();
    } catch (error) {
      console.error('Error sending rejection:', error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const characterCount = rejectionNote.length;
  const isAtLimit = characterCount >= MAX_CHARACTERS;
  const canSend = !isSubmitting;

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
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
      maxHeight: SCREEN_HEIGHT * 0.6,
      minHeight: SCREEN_HEIGHT * 0.4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      overflow: 'hidden',
    },
    gradientBackground: {
      flex: 1,
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md || 12,
      paddingHorizontal: spacing.lg || 20,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg || 20,
      paddingTop: spacing.sm || 8,
      paddingBottom: spacing.lg || 20,
    },
    header: {
      marginBottom: spacing.lg || 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs || 4,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: spacing.md || 12,
    },
    bookingInfo: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.lg || 16,
      padding: spacing.md || 12,
      marginBottom: spacing.lg || 20,
    },
    bookingInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs || 4,
    },
    bookingInfoLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginRight: spacing.sm || 8,
      minWidth: 60,
    },
    bookingInfoValue: {
      fontSize: 14,
      color: 'white',
      fontWeight: '500',
      flex: 1,
    },
    closeButton: {
      position: 'absolute',
      top: spacing.lg || 20,
      right: spacing.lg || 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      elevation: 10,
    },
    noteSection: {
      marginBottom: spacing.lg || 20,
    },
    noteLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginBottom: spacing.sm || 8,
    },
    noteInputContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.lg || 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      minHeight: 120,
      padding: spacing.md || 12,
    },
    noteInput: {
      flex: 1,
      fontSize: 16,
      color: 'white',
      textAlignVertical: 'top',
      minHeight: 100,
    },
    characterCounter: {
      fontSize: 12,
      color: isAtLimit ? '#FEE2E2' : 'rgba(255, 255, 255, 0.7)',
      textAlign: 'right',
      marginTop: spacing.xs || 4,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacing.md || 12,
      paddingTop: spacing.md || 12,
      paddingBottom: spacing.lg || 20,
      marginBottom: spacing.xl || 24,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.3)',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.lg || 16,
      paddingVertical: spacing.md || 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    sendButton: {
      flex: 1,
      backgroundColor: canSend ? (colors.error || '#EF4444') : '#D1D5DB',
      borderRadius: borderRadius.lg || 16,
      paddingVertical: spacing.md || 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: canSend ? (colors.error || '#EF4444') : '#D1D5DB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginLeft: spacing.xs || 4,
    },
  };

  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Gradient Background */}
              <LinearGradient
                colors={[
                  colors.primary || '#6B46C1',
                  colors.primaryDark || '#553C9A',
                  colors.accent || '#EC4899',
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Handle Bar */}
                <TouchableOpacity 
                  style={styles.handleContainer}
                  activeOpacity={0.7}
                >
                  <View style={styles.handleBar} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <ThemedText style={styles.title}>
                    Reject Booking
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    Please provide a reason for rejecting this booking
                  </ThemedText>
                </View>

                {/* Booking Info */}
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingInfoRow}>
                    <ThemedText style={styles.bookingInfoLabel}>Customer:</ThemedText>
                    <ThemedText style={styles.bookingInfoValue}>
                      {booking.customer || 'Unknown Customer'}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <ThemedText style={styles.bookingInfoLabel}>Service:</ThemedText>
                    <ThemedText style={styles.bookingInfoValue}>
                      {booking.service || 'Unknown Service'}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <ThemedText style={styles.bookingInfoLabel}>Date:</ThemedText>
                    <ThemedText style={styles.bookingInfoValue}>
                      {formatDate(booking.date)}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <ThemedText style={styles.bookingInfoLabel}>Time:</ThemedText>
                    <ThemedText style={styles.bookingInfoValue}>
                      {formatTime(booking.time)}
                    </ThemedText>
                  </View>
                </View>

                {/* Rejection Note Input */}
                <View style={styles.noteSection}>
                  <ThemedText style={styles.noteLabel}>
                    Rejection Reason (Optional)
                  </ThemedText>
                  <View style={styles.noteInputContainer}>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="Enter reason for rejection..."
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={rejectionNote}
                      onChangeText={handleNoteChange}
                      multiline
                      maxLength={MAX_CHARACTERS}
                      editable={!isSubmitting}
                      autoFocus={Platform.OS === 'ios'}
                    />
                  </View>
                  <ThemedText style={styles.characterCounter}>
                    {characterCount}/{MAX_CHARACTERS}
                  </ThemedText>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isSubmitting}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    activeOpacity={0.8}
                    disabled={!canSend || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ThemedText style={styles.sendButtonText}>
                        Sending...
                      </ThemedText>
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="white" />
                        <ThemedText style={styles.sendButtonText}>
                          Send Rejection
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

