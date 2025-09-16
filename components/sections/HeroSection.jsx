import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const HeroSection = ({ 
  user, 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onLoginPress,
  // Animation values
  logoScaleAnim,
  headerAnim,
  fadeAnim,
  slideUpAnim,
  scaleAnim,
  rotateAnim,
  buttonSlideAnim,
}) => {
  // Login button press animation
  const loginPressAnim = useSharedValue(1);
  const loginGlowAnim = useSharedValue(0);

  const handleLoginPress = () => {
    // Press animation
    loginPressAnim.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    loginGlowAnim.value = withTiming(1, { duration: 150 });
    
    // Reset after animation
    setTimeout(() => {
      loginPressAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
      loginGlowAnim.value = withTiming(0, { duration: 300 });
    }, 150);
    
    onLoginPress();
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleAnim.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
    opacity: fadeAnim.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }, { scale: scaleAnim.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonSlideAnim.value }],
  }));

  const loginButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginPressAnim.value }],
  }));

  const loginGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loginGlowAnim.value,
  }));

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
    <>
      {/* Hero Header */}
      <Animated.View style={[styles.heroHeader, headerAnimatedStyle]}>
        {/* Floating Login Button - Only show for guests */}
        {!user && (
          <Animated.View style={[styles.floatingLoginContainer, buttonAnimatedStyle]}>
            <Animated.View style={[styles.floatingLoginButton, loginButtonAnimatedStyle]}>
              <TouchableOpacity
                style={styles.loginButtonTouchable}
                onPress={handleLoginPress}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.2)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.15)'
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonContent}
                >
                  <View style={styles.loginIconContainer}>
                    <Ionicons name="log-in-outline" size={18} color="white" />
                  </View>
                  <ThemedText style={styles.floatingLoginText}>Login</ThemedText>
                </LinearGradient>
                <Animated.View style={[styles.loginButtonGlow, loginGlowAnimatedStyle]} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        <View style={styles.heroContent}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoCircle}>
              <Ionicons name="cut" size={60} color="white" />
            </View>
          </Animated.View>

          <Animated.View style={[styles.welcomeSection, contentAnimatedStyle]}>
            <ThemedText style={styles.welcomeText}>
              {user ? `Welcome back, ${user?.firstName || "Guest"}! 👋` : "Welcome to Salon 16! 👋"}
            </ThemedText>
            <ThemedText style={styles.welcomeSubtext}>
              {user 
                ? "Ready to look and feel amazing? Book your next appointment today."
                : "Explore our services and discover the perfect treatment for you."
              }
            </ThemedText>
          </Animated.View>

          <Animated.View style={[styles.quickActions, buttonAnimatedStyle]}>
            {/* Quick actions can be added here if needed */}
          </Animated.View>
        </View>
      </Animated.View>
    </>
  );
};

const createStyles = (colors, spacing, borderRadius, shadows) => StyleSheet.create({
  heroHeader: {
    height: 400,
    position: "relative",
    marginBottom: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingLoginContainer: {
    position: "absolute",
    top: spacing.xl || 20,
    right: spacing.lg || 20,
    zIndex: 10,
  },
  floatingLoginButton: {
    position: "relative",
    overflow: "hidden",
    borderRadius: borderRadius.large || 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonTouchable: {
    flex: 1,
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg || 20,
    paddingVertical: spacing.md || 12,
    borderRadius: borderRadius.large || 25,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(20px)",
    minWidth: 100,
    justifyContent: "center",
  },
  loginIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm || 8,
  },
  floatingLoginText: {
    fontSize: 16,
    color: "white",
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loginButtonGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.large || 27,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: spacing.md,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 38,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 26,
    textAlign: "center",
    fontWeight: "300",
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
  },
});

export default HeroSection;
