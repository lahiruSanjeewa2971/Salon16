import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerBookingsScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo } = useToastHelpers();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);

  useEffect(() => {
    // Start animations
    fadeAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    slideUpAnim.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Check if user is logged in and show toast
    if (!user) {
      showInfo('To access this, please login.');
    }
  }, [user, showInfo, fadeAnim, slideUpAnim]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary || '#6C2A52',
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 26,
      fontWeight: '300',
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  });

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Show restricted message for guests
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            colors.primary || '#6B46C1',
            colors.primaryDark || '#553C9A', 
            colors.accent || '#EC4899'
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, contentAnimatedStyle]}>
            <Ionicons name="calendar-outline" size={60} color="white" />
          </Animated.View>
          
          <Animated.View style={contentAnimatedStyle}>
            <ThemedText style={styles.title}>Access Restricted</ThemedText>
            <ThemedText style={styles.subtitle}>
              Please login to access your bookings
            </ThemedText>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          My Bookings
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          View your upcoming appointments, booking history, and manage your reservations.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
