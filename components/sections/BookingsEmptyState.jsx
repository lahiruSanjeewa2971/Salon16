import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { ThemedButton } from '../themed/ThemedButton';

const BookingsEmptyState = ({
  colors,
  spacing,
  borderRadius,
  shadows,
  onBookNow,
  activeFilter = 'all',
  searchQuery = '',
  // Animation values
  fadeAnim,
  slideUpAnim,
}) => {
  // Press animation
  const pressAnim = useSharedValue(1);

  const handleBookNowPress = () => {
    pressAnim.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    setTimeout(() => {
      pressAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 150);
    onBookNow();
  };

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideUpAnim.value },
      { scale: pressAnim.value },
    ],
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
      ...shadows.card,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.md,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.xl,
      fontWeight: '300',
    },
    featuresContainer: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    featureIcon: {
      width: 24,
      alignItems: 'center',
      marginRight: spacing.md,
    },
    featureText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      flex: 1,
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    bookNowButton: {
      backgroundColor: 'white',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.medium,
      ...shadows.button,
    },
    bookNowButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    secondaryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="calendar-outline" size={60} color="rgba(255, 255, 255, 0.8)" />
      </View>

      {/* Title and Subtitle */}
      <ThemedText style={styles.title}>
        {searchQuery ? 'No Results Found' : 
         activeFilter === 'upcoming' ? 'No Upcoming Bookings' :
         activeFilter === 'past' ? 'No Past Bookings' :
         'No Bookings Yet'}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {searchQuery ? `No bookings found for "${searchQuery}". Try a different search term.` :
         activeFilter === 'upcoming' ? 'You have no upcoming appointments. Book one now!' :
         activeFilter === 'past' ? 'You have no past bookings yet.' :
         'Book your first appointment to get started with our premium beauty services'}
      </ThemedText>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="star" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <ThemedText style={styles.featureText}>
            Professional stylists and beauty experts
          </ThemedText>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="time" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <ThemedText style={styles.featureText}>
            Flexible scheduling and easy rescheduling
          </ThemedText>
        </View>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="notifications" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <ThemedText style={styles.featureText}>
            Real-time updates and reminders
          </ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={handleBookNowPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.bookNowButtonText}>
            Book Your First Appointment
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {/* Navigate to services */}}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.secondaryButtonText}>
            Browse Services
          </ThemedText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default BookingsEmptyState;
