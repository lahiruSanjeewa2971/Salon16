import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
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
import { useResponsive } from '../../hooks/useResponsive';
import BookingsSkeletonLoader from '../../components/ui/BookingsSkeletonLoader';

export default function CustomerReviewsScreen() {
  const { colors, spacing } = useTheme();
  const responsive = useResponsive();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo } = useToastHelpers();

  // State management
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);

  // Reset loading state every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      
      // Start animations
      fadeAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      slideUpAnim.value = withSpring(0, { damping: 15, stiffness: 150 });

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setLoading(false);
      }, 2000);

      // Check if user is logged in and show toast
      if (!user) {
        showInfo('To access this, please login.');
      }

      return () => clearTimeout(hideSkeleton);
    }, [user, showInfo, fadeAnim, slideUpAnim])
  );

  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
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
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    title: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.8) : responsive.responsive.fontSize(3.2),
      fontWeight: 'bold',
      color: 'white',
      marginTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.6) : responsive.responsive.fontSize(1.8),
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: responsive.isSmallScreen ? responsive.responsive.fontSize(2.2) : responsive.responsive.fontSize(2.6),
      fontWeight: '300',
    },
    iconContainer: {
      width: responsive.isSmallScreen ? responsive.responsive.width(30) : responsive.responsive.width(35),
      height: responsive.isSmallScreen ? responsive.responsive.width(30) : responsive.responsive.width(35),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(15) : responsive.responsive.width(17.5),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.isSmallScreen ? 8 : 12 },
      shadowOpacity: 0.4,
      shadowRadius: responsive.isSmallScreen ? 12 : 20,
      elevation: responsive.isSmallScreen ? 8 : 12,
    },
  });

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Show skeleton loader while loading
  if (loading) {
    return <BookingsSkeletonLoader isLoading={loading} screenType="reviews" />;
  }

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
            <Ionicons name="star-outline" size={responsive.isSmallScreen ? responsive.responsive.width(15) : responsive.responsive.width(18)} color="white" />
          </Animated.View>
          
          <Animated.View style={contentAnimatedStyle}>
            <ThemedText style={styles.title}>Access Restricted</ThemedText>
            <ThemedText style={styles.subtitle}>
              Please login to access reviews
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
          Reviews
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Leave reviews for your completed appointments and view reviews from other customers.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
