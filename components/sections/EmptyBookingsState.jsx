import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const EmptyBookingsState = ({
  filter,
  colors,
  spacing,
  borderRadius,
  // Animation values
  fadeAnim,
  slideUpAnim,
}) => {
  // Animation for empty state
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  React.useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    textOpacity.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 200 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const getEmptyStateContent = (filter) => {
    switch (filter) {
      case 'upcoming':
        return {
          icon: 'calendar-outline',
          title: 'No Upcoming Bookings',
          subtitle: 'You don\'t have any upcoming appointments',
          description: 'Book your next appointment to see it here',
          actionText: 'Book Now'
        };
      case 'past':
        return {
          icon: 'time-outline',
          title: 'No Past Bookings',
          subtitle: 'You haven\'t completed any appointments yet',
          description: 'Your completed appointments will appear here',
          actionText: 'View All'
        };
      default:
        return {
          icon: 'calendar-clear-outline',
          title: 'No Bookings Found',
          subtitle: 'You don\'t have any appointments yet',
          description: 'Start by booking your first appointment',
          actionText: 'Get Started'
        };
    }
  };

  const content = getEmptyStateContent(filter);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxxl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xxl,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 30,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    description: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.xxl,
    },
    actionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim.value, transform: [{ translateY: slideUpAnim.value }] }]}>
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Ionicons
          name={content.icon}
          size={48}
          color="rgba(255, 255, 255, 0.8)"
        />
      </Animated.View>
      
      <Animated.View style={textAnimatedStyle}>
        <ThemedText style={styles.title}>{content.title}</ThemedText>
        <ThemedText style={styles.subtitle}>{content.subtitle}</ThemedText>
        <ThemedText style={styles.description}>{content.description}</ThemedText>
      </Animated.View>
    </Animated.View>
  );
};

export default EmptyBookingsState;
