import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
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
import { ThemedButton } from '../components/themed/ThemedButton';
import { ThemedText } from '../components/ThemedText';
import { useToastHelpers } from '../components/ui/ToastSystem';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, debugAuthState } = useAuth();
  const { showSuccessToast } = useToastHelpers();

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const logoScaleAnim = useSharedValue(0);

  useEffect(() => {
    // Debug: Check current auth state
    debugAuthState();
    
    // Show welcome toast for verified users
    if (user && user.isEmailVerified) {
      showSuccessToast(
        'Welcome to Salon 16!',
        `Hello ${user.firstName}, your email is verified and you're ready to book!`,
        { duration: 4000 }
      );
    }
    
    // Start animations sequence
    const startAnimations = () => {
      // Logo animation
      logoScaleAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      // Fade in main content
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideUpAnim.value = withDelay(200, withSpring(0, { damping: 15 }));

      // Scale animation for content
      scaleAnim.value = withDelay(400, withSpring(1, { damping: 12 }));
    };

    startAnimations();
  }, [fadeAnim, logoScaleAnim, scaleAnim, slideUpAnim, debugAuthState, user, showSuccessToast]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const contentScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout pressed');
  };

  const handleBookAppointment = () => {
    // TODO: Navigate to booking screen
    console.log('Book appointment pressed');
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
      top: isSmallScreen ? -40 : -60,
      right: isSmallScreen ? -40 : -60,
      width: isSmallScreen ? 120 : 160,
      height: isSmallScreen ? 120 : 160,
      borderRadius: isSmallScreen ? 60 : 80,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: isSmallScreen ? -80 : -120,
      left: isSmallScreen ? -80 : -120,
      width: isSmallScreen ? 160 : 240,
      height: isSmallScreen ? 160 : 240,
      borderRadius: isSmallScreen ? 80 : 120,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scrollContainer: {
      flex: 1,
    },
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? spacing.lg : spacing.xl,
      paddingTop: isSmallScreen ? spacing.lg : 0,
      paddingBottom: isSmallScreen ? spacing.lg : 0,
    },
    header: {
      alignItems: 'center',
      marginBottom: isSmallScreen ? spacing.xl : spacing.xxl,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoCircle: {
      width: isSmallScreen ? 80 : 100,
      height: isSmallScreen ? 80 : 100,
      borderRadius: isSmallScreen ? 40 : 50,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
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
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: isSmallScreen ? 16 : 18,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      fontWeight: '300',
    },
    welcomeMessage: {
      fontSize: isSmallScreen ? 18 : 20,
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.lg,
      fontWeight: '500',
    },
    contentContainer: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: isSmallScreen ? spacing.lg : spacing.xl,
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
    buttonContainer: {
      width: '100%',
      marginTop: spacing.lg,
    },
    bookButton: {
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
    bookButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: isSmallScreen ? 16 : 18,
    },
    logoutButton: {
      position: 'absolute',
      top: isSmallScreen ? 40 : 50,
      right: spacing.lg,
      zIndex: 1,
      padding: spacing.sm,
    },
    logoutButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      marginLeft: spacing.xs,
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
      <Animated.View style={[styles.decorativeCircle1, logoAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, logoAnimatedStyle]} />

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.logoutButtonContent}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </View>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Header */}
          <Animated.View style={[styles.header, contentAnimatedStyle]}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Ionicons name="home" size={isSmallScreen ? 40 : 50} color="white" />
              </View>
              
              <ThemedText style={styles.title}>
                Welcome to Salon 16
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                Your beauty destination
              </ThemedText>
            </Animated.View>
          </Animated.View>

          {/* Welcome Message */}
          <Animated.View style={[styles.contentContainer, contentScaleStyle]}>
            <ThemedText style={styles.welcomeMessage}>
              Hello, {user?.firstName || 'Guest'}! 👋
            </ThemedText>
            
            <ThemedText style={styles.subtitle}>
              Ready to book your next appointment? We&apos;re here to make you look and feel amazing!
            </ThemedText>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Book Appointment"
                onPress={handleBookAppointment}
                variant="secondary"
                size="large"
                style={styles.bookButton}
                textStyle={styles.bookButtonText}
              />
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
