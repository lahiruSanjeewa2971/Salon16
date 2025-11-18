import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { FloatingElements } from '../components/animations/FloatingElements';
import { ThemedButton } from '../components/themed/ThemedButton';
import { ThemedText } from '../components/ThemedText';
import { useToastHelpers } from '../components/ui/ToastSystem';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthLoading } from '../hooks/useAuth';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 800;

export default function WelcomeScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const { continueAsGuest } = useAuth();
  const { isLoggingIn } = useAuthLoading();
  const router = useRouter();
  const { showSuccess: showSuccessToast, showError: showErrorToast } = useToastHelpers();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const logoScaleAnim = useSharedValue(0);
  const buttonSlideAnim = useSharedValue(100);

  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Logo animation
      logoScaleAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      // Fade in main content
      fadeAnim.value = withDelay(300, withTiming(1, { duration: 800 }));
      slideUpAnim.value = withDelay(300, withSpring(0, { damping: 15 }));

      // Scale animation for cards
      scaleAnim.value = withDelay(600, withSpring(1, { damping: 12 }));

      // Rotate animation for decorative elements
      rotateAnim.value = withDelay(800, withTiming(360, { duration: 2000 }));

      // Button slide up animation
      buttonSlideAnim.value = withDelay(1000, withSpring(0, { damping: 15 }));
    };

    startAnimations();
  }, [buttonSlideAnim, fadeAnim, logoScaleAnim, rotateAnim, scaleAnim, slideUpAnim]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const decorativeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonSlideAnim.value }],
  }));

  const handleLogin = () => {
    // Navigate to login screen
    router.push('/LoginScreen');
  };

  const handleGuestMode = async () => {
    try {
      // Clear all stored sessions and continue as guest
      await continueAsGuest();
      // Navigate to customer home screen as guest
      router.push('/(customer-tabs)');
    } catch (error) {
      console.error('WelcomeScreen: Failed to continue as guest', error);
      // Still navigate even if clearing fails
      router.push('/(customer-tabs)');
    }
  };

  const handleGoogleSignIn = () => {
    console.log('WelcomeScreen: Google Sign-In button clicked');
  };

  // Create responsive styles using theme values
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: height,
    },
    decorativeCircle1: {
      position: 'absolute',
      top: isSmallScreen ? -30 : -50,
      right: isSmallScreen ? -30 : -50,
      width: isSmallScreen ? 150 : 200,
      height: isSmallScreen ? 150 : 200,
      borderRadius: isSmallScreen ? 75 : 100,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: isSmallScreen ? -60 : -100,
      left: isSmallScreen ? -60 : -100,
      width: isSmallScreen ? 200 : 300,
      height: isSmallScreen ? 200 : 300,
      borderRadius: isSmallScreen ? 100 : 150,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? spacing.lg : spacing.xl,
      paddingTop: isSmallScreen ? spacing.lg : 0,
      paddingBottom: isSmallScreen ? spacing.lg : 0,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: isSmallScreen ? spacing.lg : spacing.xxl,
    },
    logoCircle: {
      width: isSmallScreen ? 80 : isMediumScreen ? 100 : 120,
      height: isSmallScreen ? 80 : isMediumScreen ? 100 : 120,
      borderRadius: isSmallScreen ? 40 : isMediumScreen ? 50 : 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isSmallScreen ? spacing.md : spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    title: {
      fontSize: isSmallScreen ? 28 : isMediumScreen ? 30 : 32,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      lineHeight: isSmallScreen ? 32 : isMediumScreen ? 35 : 38,
      paddingVertical: 4,
    },
    subtitle: {
      fontSize: isSmallScreen ? 16 : 18,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontWeight: '300',
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
    },
    cardsContainer: {
      width: '100%',
      marginBottom: isSmallScreen ? spacing.lg : spacing.xxl,
    },
    featureCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.card.large,
      padding: isSmallScreen ? spacing.md : spacing.lg,
      marginBottom: isSmallScreen ? spacing.sm : spacing.md,
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: 'white',
      marginLeft: spacing.sm,
    },
    cardDescription: {
      fontSize: isSmallScreen ? 13 : 14,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: isSmallScreen ? 18 : 20,
    },
    buttonsContainer: {
      width: '100%',
    },
    primaryButton: {
      backgroundColor: 'white',
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    primaryButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: isSmallScreen ? 16 : 18,
    },
    secondaryButton: {
      borderColor: 'white',
      borderWidth: 2,
    },
    secondaryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: isSmallScreen ? 14 : 16,
    },
    googleSignInButton: {
      backgroundColor: 'white',
      marginBottom: spacing.md,
      width: '100%',
      minHeight: 52, // Match ThemedButton large size
      // paddingVertical: spacing.button.large.vertical, // Match theme spacing
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.button.large, // Match theme border radius
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    googleSignInButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleButtonText: {
      color: '#3c4043',
      fontWeight: '600',
      fontSize: isSmallScreen ? 16 : 18,
      marginLeft: spacing.sm,
    },
    bottomIndicator: {
      position: 'absolute',
      bottom: isSmallScreen ? 10 : 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    indicatorDot: {
      width: isSmallScreen ? 6 : 8,
      height: isSmallScreen ? 6 : 8,
      borderRadius: isSmallScreen ? 3 : 4,
      marginHorizontal: 4,
    },
    indicatorDotActive: {
      backgroundColor: 'white',
    },
    indicatorDotInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorativeCircle1, decorativeAnimatedStyle]} />
      {/* <Animated.View style={[styles.decorativeCircle2, decorativeAnimatedStyle]} /> */}

      {/* Floating Elements */}
      <FloatingElements />

      <View style={styles.mainContent}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Ionicons name="cut" size={60} color="white" />
          </View>
          
          <ThemedText style={styles.title}>
            Salon 16
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Your Beauty, Our Passion
          </ThemedText>
        </Animated.View>

        {/* Main Content */}
        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          {/* Feature Cards */}
          <Animated.View style={[styles.cardsContainer, cardAnimatedStyle]}>
            <View style={styles.featureCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={24} color="white" />
                <ThemedText style={styles.cardTitle}>
                  Easy Booking
                </ThemedText>
              </View>
              <ThemedText style={styles.cardDescription}>
                Book your appointments with just a few taps
              </ThemedText>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="star" size={24} color="white" />
                <ThemedText style={styles.cardTitle}>
                  Premium Services
                </ThemedText>
              </View>
              <ThemedText style={styles.cardDescription}>
                Professional beauty treatments and styling
              </ThemedText>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={24} color="white" />
                <ThemedText style={styles.cardTitle}>
                  Real-time Updates
                </ThemedText>
              </View>
              <ThemedText style={styles.cardDescription}>
                Get instant notifications about your bookings
              </ThemedText>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[styles.buttonsContainer, buttonAnimatedStyle]}>
            <ThemedButton
              title="Get Started"
              onPress={handleLogin}
              variant="secondary"
              size="large"
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />

            {/* Google Sign-In Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.googleSignInButton}
              activeOpacity={0.8}
              disabled={false}
            >
              <View style={styles.googleSignInButtonContent}>
                <Ionicons name="logo-google" size={isSmallScreen ? 22 : 24} color="#4285F4" />
                <ThemedText style={styles.googleButtonText}>
                  Continue with Google
                </ThemedText>
              </View>
            </TouchableOpacity>

            <ThemedButton
              title="Continue as Guest"
              onPress={handleGuestMode}
              variant="outline"
              size="large"
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </Animated.View>
        </Animated.View>

        {/* Bottom Decorative Element */}
        <Animated.View style={[styles.bottomIndicator, contentAnimatedStyle]}>
          <View style={[styles.indicatorDot, styles.indicatorDotInactive]} />
          <View style={[styles.indicatorDot, styles.indicatorDotActive]} />
          <View style={[styles.indicatorDot, styles.indicatorDotInactive]} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
