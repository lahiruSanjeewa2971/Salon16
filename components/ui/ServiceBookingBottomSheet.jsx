import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../contexts/ThemeContext';
import { ThemedText } from '../ThemedText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ServiceBookingBottomSheet({
  visible,
  service,
  selectedDate,
  mode = 'service', // 'service' or 'day'
  onClose,
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

  // Modern gesture handler for drag to dismiss and resize
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting position
    })
    .onUpdate((event) => {
      const newTranslateY = translateY.value + event.translationY;
      // Allow dragging up and down, but limit to screen bounds
      if (newTranslateY >= 0 && newTranslateY <= SCREEN_HEIGHT * 0.5) {
        translateY.value = newTranslateY;
      }
    })
    .onEnd((event) => {
      const shouldDismiss = event.translationY > 100 || event.velocityY > 500;
      const shouldMinimize = event.translationY < -50 || event.velocityY < -500;
      
      if (shouldDismiss) {
        // Dismiss the bottom sheet
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
        backdropOpacity.value = withTiming(0, { duration: 400 });
        sheetOpacity.value = withTiming(0, { duration: 400 }, () => {
          runOnJS(onClose)();
        });
      } else if (shouldMinimize) {
        // Minimize to 1/4 of screen
        translateY.value = withSpring(SCREEN_HEIGHT * 0.75, {
          damping: 15,
          stiffness: 200,
        });
      } else {
        // Return to 1/2 of screen
        translateY.value = withSpring(SCREEN_HEIGHT * 0.5, {
          damping: 15,
          stiffness: 200,
        });
      }
    });

  useEffect(() => {
    if (visible) {
      // Animate in to 1/2 of screen
      backdropOpacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(SCREEN_HEIGHT * 0.5, {
        damping: 15,
        stiffness: 200,
        mass: 1.0,
      });
      sheetOpacity.value = withTiming(1, { duration: 600 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 400 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
      sheetOpacity.value = withTiming(0, { duration: 400 });
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
    onClose();
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
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
      height: SCREEN_HEIGHT * 1.25,
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
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    serviceHeader: {
      paddingTop: spacing.xl || 24,
      paddingBottom: spacing.lg || 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      marginBottom: spacing.lg || 16,
    },
    serviceName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingBottom: spacing.sm || 8,
    },
    placeholderContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg || 20,
    },
    placeholderText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: 24,
    },
  };

  if (!service && mode === 'service') return null;

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
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Gradient Background */}
              <LinearGradient
                colors={[
                  colors.primary || "#6B46C1",
                  colors.primaryDark || "#553C9A", 
                  colors.accent || "#EC4899"
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Handle Bar */}
                <TouchableOpacity 
                  style={styles.handleContainer}
                  activeOpacity={0.7}
                  onPress={() => {
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
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.content}>
                  {/* Service Header */}
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>
                      {mode === 'service' 
                        ? (service?.name || 'Service')
                        : `${selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'Selected Date'}`
                      }
                    </ThemedText>
                  </View>

                  {/* Placeholder Content */}
                  <View style={styles.placeholderContent}>
                    <ThemedText style={styles.placeholderText}>
                      {mode === 'service' 
                        ? `Service booking functionality will be implemented here.`
                        : `Day booking functionality will be implemented here.`
                      }
                    </ThemedText>
                  </View>
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
