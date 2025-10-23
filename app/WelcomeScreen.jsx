import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;

export default function WelcomeScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const responsive = useResponsive();
  const { continueAsGuest } = useAuth();
  const router = useRouter();

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

  // Create responsive styles using theme values
  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
      backgroundColor: colors.primary, // Fallback to gradient start color
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%', // Covers viewport exactly
    },
    decorativeCircle1: {
      position: 'absolute',
      top: responsive.isSmallScreen ? responsive.responsive.height(-8) : responsive.responsive.height(-10),
      right: responsive.isSmallScreen ? responsive.responsive.height(-8) : responsive.responsive.height(-10),
      width: responsive.isSmallScreen ? responsive.responsive.width(45) : responsive.responsive.width(55),
      height: responsive.isSmallScreen ? responsive.responsive.width(45) : responsive.responsive.width(55),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(22.5) : responsive.responsive.width(27.5),
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: responsive.isSmallScreen ? responsive.responsive.height(-15) : responsive.responsive.height(-20),
      left: responsive.isSmallScreen ? responsive.responsive.height(-15) : responsive.responsive.height(-20),
      width: responsive.isSmallScreen ? responsive.responsive.width(65) : responsive.responsive.width(80),
      height: responsive.isSmallScreen ? responsive.responsive.width(65) : responsive.responsive.width(80),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(32.5) : responsive.responsive.width(40),
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle3: {
      position: 'absolute',
      top: responsive.isSmallScreen ? responsive.responsive.height(15) : responsive.responsive.height(20),
      left: responsive.isSmallScreen ? responsive.responsive.height(-12) : responsive.responsive.height(-15),
      width: responsive.isSmallScreen ? responsive.responsive.width(35) : responsive.responsive.width(45),
      height: responsive.isSmallScreen ? responsive.responsive.width(35) : responsive.responsive.width(45),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(17.5) : responsive.responsive.width(22.5),
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    decorativeCircle4: {
      position: 'absolute',
      bottom: responsive.isSmallScreen ? responsive.responsive.height(20) : responsive.responsive.height(25),
      right: responsive.isSmallScreen ? responsive.responsive.height(-8) : responsive.responsive.height(-10),
      width: responsive.isSmallScreen ? responsive.responsive.width(25) : responsive.responsive.width(35),
      height: responsive.isSmallScreen ? responsive.responsive.width(25) : responsive.responsive.width(35),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(12.5) : responsive.responsive.width(17.5),
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    mainContent: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingTop: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      minHeight: '100%',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    logoCircle: {
      width: responsive.isSmallScreen ? responsive.responsive.width(22) : responsive.responsive.width(26),
      height: responsive.isSmallScreen ? responsive.responsive.width(22) : responsive.responsive.width(26),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(11) : responsive.responsive.width(13),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    title: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 3.2 : 3.6),
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: responsive.spacing.md,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.8 : 2.0),
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontWeight: '400',
      lineHeight: responsive.responsive.fontSize(responsive.isSmallScreen ? 2.4 : 2.6),
    },
    cardsContainer: {
      width: '100%',
      flex: 1,
      justifyContent: 'center',
    },
    bottomSection: {
      width: '100%',
      alignItems: 'center',
    },
    featureCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: responsive.responsive.width(4),
      padding: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          backdropFilter: 'blur(10px)',
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.spacing.md,
    },
    cardTitle: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.8 : 2.0),
      fontWeight: '600',
      color: 'white',
      marginLeft: responsive.spacing.md,
    },
    cardDescription: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.5 : 1.6),
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: responsive.responsive.fontSize(responsive.isSmallScreen ? 2.0 : 2.2),
    },
    buttonsContainer: {
      width: '100%',
    },
    primaryButton: {
      backgroundColor: 'white',
      marginBottom: responsive.spacing.lg,
      minHeight: responsive.responsive.height(6.5),
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
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 2.0 : 2.2),
    },
    secondaryButton: {
      borderColor: 'white',
      borderWidth: 2,
    },
    secondaryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.8 : 2.0),
    },
    bottomIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: responsive.spacing.lg,
    },
    indicatorDot: {
      width: responsive.isSmallScreen ? responsive.responsive.width(1.5) : responsive.responsive.width(2),
      height: responsive.isSmallScreen ? responsive.responsive.width(1.5) : responsive.responsive.width(2),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(0.75) : responsive.responsive.width(1),
      marginHorizontal: responsive.spacing.xs,
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
      <Animated.View style={[styles.decorativeCircle2, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle3, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle4, decorativeAnimatedStyle]} />

      {/* Floating Elements */}
      <FloatingElements />

      <View style={styles.mainContent}>
        {/* Top Section - Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Ionicons name="cut" size={responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(12)} color="white" />
          </View>
          
          <ThemedText style={styles.title}>
            Salon 16
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Your Beauty, Our Passion
          </ThemedText>
        </Animated.View>

        {/* Middle Section - Feature Cards */}
        <Animated.View style={[styles.cardsContainer, cardAnimatedStyle]}>
          <View style={styles.featureCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={responsive.responsive.width(6)} color="white" />
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
              <Ionicons name="star" size={responsive.responsive.width(6)} color="white" />
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
              <Ionicons name="time" size={responsive.responsive.width(6)} color="white" />
              <ThemedText style={styles.cardTitle}>
                Real-time Updates
              </ThemedText>
            </View>
            <ThemedText style={styles.cardDescription}>
              Get instant notifications about your bookings
            </ThemedText>
          </View>
        </Animated.View>

        {/* Bottom Section - Buttons and Indicators */}
        <View style={styles.bottomSection}>
          <Animated.View style={[styles.buttonsContainer, buttonAnimatedStyle]}>
            <ThemedButton
              title="Get Started"
              onPress={handleLogin}
              variant="secondary"
              size="large"
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />

            <ThemedButton
              title="Continue as Guest"
              onPress={handleGuestMode}
              variant="outline"
              size="large"
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </Animated.View>

          <Animated.View style={[styles.bottomIndicator, contentAnimatedStyle]}>
            <View style={[styles.indicatorDot, styles.indicatorDotInactive]} />
            <View style={[styles.indicatorDot, styles.indicatorDotActive]} />
            <View style={[styles.indicatorDot, styles.indicatorDotInactive]} />
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}
