import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

// Base skeleton styles
const baseSkeletonStyles = StyleSheet.create({
  skeletonText: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  skeletonCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  skeletonCircle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  shimmerGradient: {
    flex: 1,
    width: "100%",
  },
});

// Skeleton Text Component
const SkeletonText = ({ width = "80%", height = 16, style = {} }) => {
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnim.value,
      [0, 1],
      [-width, width],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[baseSkeletonStyles.skeletonText, { width, height }, style]}>
      <Animated.View style={[baseSkeletonStyles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.3)",
            "rgba(255, 255, 255, 0.6)",
            "rgba(255, 255, 255, 0.3)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={baseSkeletonStyles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Card Component
const SkeletonCard = ({ width, height, style = {} }) => {
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnim.value,
      [0, 1],
      [-width, width],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[baseSkeletonStyles.skeletonCard, { width, height }, style]}>
      <Animated.View style={[baseSkeletonStyles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.3)",
            "rgba(255, 255, 255, 0.6)",
            "rgba(255, 255, 255, 0.3)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={baseSkeletonStyles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Circle Component
const SkeletonCircle = ({ size = 60, style = {} }) => {
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.9, 1.1],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.6, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        baseSkeletonStyles.skeletonCircle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
        pulseStyle,
      ]}
    />
  );
};

// Profile Skeleton Loader Component
const ProfileSkeletonLoader = ({ isLoading = true }) => {
  const theme = useTheme();
  
  // Fallback values if theme is not available
  const colors = theme?.colors || {
    primary: "#6C2A52",
    primaryDark: "#553C9A",
    accent: "#EC4899",
  };
  const spacing = theme?.spacing || {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  };

  // Animation values for staggered sliding effect
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);
  const card1Anim = useSharedValue(30);
  const card2Anim = useSharedValue(30);
  const logoutAnim = useSharedValue(30);

  useEffect(() => {
    // Start staggered animations sequence
    const startAnimations = () => {
      // Header animation (slides down)
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      
      // Main content fade in
      fadeAnim.value = withDelay(400, withTiming(1, { duration: 600 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
      
      // Card 1 slides up
      card1Anim.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 150 }));
      
      // Card 2 slides up
      card2Anim.value = withDelay(800, withSpring(0, { damping: 15, stiffness: 150 }));
      
      // Logout section slides up
      logoutAnim.value = withDelay(1000, withSpring(0, { damping: 15, stiffness: 150 }));
    };

    startAnimations();
  }, [fadeAnim, slideUpAnim, headerAnim, card1Anim, card2Anim, logoutAnim]);

  if (!isLoading) return null;

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const card1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card1Anim.value }],
  }));

  const card2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card2Anim.value }],
  }));

  const logoutAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoutAnim.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary || "#6C2A52",
    },
    gradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    // Header Section
    headerSection: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      marginBottom: spacing.lg,
    },
    profileImageContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
      borderWidth: 4,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    editImageButton: {
      position: "absolute",
      bottom: 5,
      right: 5,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    userName: {
      width: "60%",
      height: 32,
      marginBottom: spacing.sm,
    },
    userEmail: {
      width: "80%",
      height: 20,
      marginBottom: spacing.lg,
    },
    // Card Container
    cardContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 20,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    sectionTitle: {
      width: "70%",
      height: 22,
      marginBottom: spacing.lg,
      alignSelf: "center",
    },
    // Personal Info Section
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      marginVertical: spacing.xs,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    infoIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginRight: spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      width: "40%",
      height: 12,
      marginBottom: 4,
    },
    infoValue: {
      width: "80%",
      height: 16,
    },
    // Booking History Section
    bookingCard: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 12,
      padding: spacing.md,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    bookingHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    bookingServiceInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    bookingServiceName: {
      width: "70%",
      height: 16,
      marginBottom: 2,
    },
    bookingDate: {
      width: "90%",
      height: 14,
    },
    bookingStatus: {
      width: 80,
      height: 24,
      borderRadius: 8,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    bookingDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bookingDetailRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    bookingDetailIcon: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginRight: spacing.xs,
    },
    bookingDetailText: {
      width: "60%",
      height: 14,
    },
    viewAllButton: {
      width: "100%",
      height: 48,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    // Logout Section
    logoutSection: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.2)",
    },
    logoutButton: {
      width: "100%",
      height: 50,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          colors.primary || "#6C2A52",
          colors.primaryDark || "#553C9A", 
          colors.accent || "#EC4899"
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header Section Skeleton */}
        <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
          <View style={styles.profileImageContainer}>
            <SkeletonCircle size={70} />
            <View style={styles.editImageButton} />
          </View>
          <SkeletonText width="60%" height={32} style={styles.userName} />
          <SkeletonText width="80%" height={20} style={styles.userEmail} />
        </Animated.View>

        {/* Personal Information Card Skeleton */}
        <Animated.View style={[styles.cardContainer, card1AnimatedStyle]}>
          <SkeletonText width="70%" height={22} style={styles.sectionTitle} />
          
          {/* Full Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <SkeletonText width="40%" height={12} style={styles.infoLabel} />
              <SkeletonText width="80%" height={16} style={styles.infoValue} />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <SkeletonText width="40%" height={12} style={styles.infoLabel} />
              <SkeletonText width="80%" height={16} style={styles.infoValue} />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <SkeletonText width="40%" height={12} style={styles.infoLabel} />
              <SkeletonText width="80%" height={16} style={styles.infoValue} />
            </View>
          </View>
        </Animated.View>

        {/* Booking History Card Skeleton */}
        <Animated.View style={[styles.cardContainer, card2AnimatedStyle]}>
          <SkeletonText width="70%" height={22} style={styles.sectionTitle} />
          
          {/* Booking Cards */}
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingServiceInfo}>
                  <SkeletonText width="70%" height={16} style={styles.bookingServiceName} />
                  <SkeletonText width="90%" height={14} style={styles.bookingDate} />
                </View>
                <View style={styles.bookingStatus} />
              </View>
              
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetailRow}>
                  <View style={styles.bookingDetailIcon} />
                  <SkeletonText width="60%" height={14} style={styles.bookingDetailText} />
                </View>
                <View style={styles.bookingDetailRow}>
                  <View style={styles.bookingDetailIcon} />
                  <SkeletonText width="60%" height={14} style={styles.bookingDetailText} />
                </View>
              </View>
            </View>
          ))}
          
          <View style={styles.viewAllButton} />
        </Animated.View>

        {/* Logout Section Skeleton */}
        <Animated.View style={[styles.logoutSection, logoutAnimatedStyle]}>
          <View style={styles.logoutButton} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSkeletonLoader;
