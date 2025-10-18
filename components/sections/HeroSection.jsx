import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle
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
  const handleLoginPress = () => {
    console.log("🔐 FAB Login button pressed - HeroSection");
    console.log("✅ Floating Action Button is working correctly!");
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

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
    <>
      {/* Hero Header */}
      <Animated.View style={[styles.heroHeader, headerAnimatedStyle]}>

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
