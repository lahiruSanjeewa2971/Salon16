import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
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

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors, spacing, typography, borderRadius } = useTheme();
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
  }, []);

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

  const handleGuestMode = () => {
    // Navigate to home screen as guest
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: height,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Background Elements */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          decorativeAnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          decorativeAnimatedStyle,
        ]}
      />

      {/* Floating Elements */}
      <FloatingElements />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
        {/* Logo Section */}
        <Animated.View style={[{ alignItems: 'center', marginBottom: spacing.xxl }, logoAnimatedStyle]}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.lg,
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
            }}
          >
            <Ionicons name="cut" size={60} color="white" />
          </View>
          
          <ThemedText
            style={{
              fontSize: 36,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: spacing.sm,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            Salon 16
          </ThemedText>
          
          <ThemedText
            style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              fontWeight: '300',
            }}
          >
            Your Beauty, Our Passion
          </ThemedText>
        </Animated.View>

        {/* Main Content */}
        <Animated.View style={[{ width: '100%', alignItems: 'center' }, contentAnimatedStyle]}>
          {/* Feature Cards */}
          <Animated.View style={[{ width: '100%', marginBottom: spacing.xxl }, cardAnimatedStyle]}>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: borderRadius.card.large,
                padding: spacing.lg,
                marginBottom: spacing.md,
                backdropFilter: 'blur(10px)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="calendar" size={24} color="white" />
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: 'white',
                    marginLeft: spacing.sm,
                  }}
                >
                  Easy Booking
                </ThemedText>
              </View>
              <ThemedText
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 20,
                }}
              >
                Book your appointments with just a few taps
              </ThemedText>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: borderRadius.card.large,
                padding: spacing.lg,
                marginBottom: spacing.md,
                backdropFilter: 'blur(10px)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="star" size={24} color="white" />
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: 'white',
                    marginLeft: spacing.sm,
                  }}
                >
                  Premium Services
                </ThemedText>
              </View>
              <ThemedText
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 20,
                }}
              >
                Professional beauty treatments and styling
              </ThemedText>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: borderRadius.card.large,
                padding: spacing.lg,
                backdropFilter: 'blur(10px)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="time" size={24} color="white" />
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: 'white',
                    marginLeft: spacing.sm,
                  }}
                >
                  Real-time Updates
                </ThemedText>
              </View>
              <ThemedText
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 20,
                }}
              >
                Get instant notifications about your bookings
              </ThemedText>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[{ width: '100%' }, buttonAnimatedStyle]}>
            <ThemedButton
              title="Get Started"
              onPress={handleLogin}
              variant="secondary"
              size="large"
              style={{
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
              }}
              textStyle={{
                color: colors.primary,
                fontWeight: 'bold',
                fontSize: 18,
              }}
            />

            <ThemedButton
              title="Continue as Guest"
              onPress={handleGuestMode}
              variant="outline"
              size="large"
              style={{
                borderColor: 'white',
                borderWidth: 2,
              }}
              textStyle={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
              }}
            />
          </Animated.View>
        </Animated.View>

        {/* Bottom Decorative Element */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
            },
            contentAnimatedStyle,
          ]}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'white',
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              marginHorizontal: 4,
            }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
