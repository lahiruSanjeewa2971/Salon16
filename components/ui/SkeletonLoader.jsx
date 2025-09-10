import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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

// Main Skeleton Loader Component
const SkeletonLoader = ({ isLoading = true }) => {
  const theme = useTheme();
  
  // Fallback values if theme is not available
  const colors = theme?.colors || {
    primary: "#6B46C1",
    primaryDark: "#553C9A",
    accent: "#EC4899",
  };
  const spacing = theme?.spacing || {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  };
  const borderRadius = theme?.borderRadius || {
    small: 8,
    medium: 12,
    large: 16,
  };
  const shadows = theme?.shadows || {};

  if (!isLoading) return null;

  const createStyles = (colors, spacing, borderRadius, shadows) => ({
    container: {
      flex: 1,
      backgroundColor: colors.primary || "#6B46C1",
    },
    gradient: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg || 20,
      paddingTop: spacing.xl || 40,
    },
    heroSection: {
      alignItems: "center",
      marginBottom: spacing.xl || 40,
    },
    heroLogo: {
      marginBottom: spacing.lg || 20,
    },
    heroText: {
      alignItems: "center",
      marginBottom: spacing.lg || 20,
    },
    heroButton: {
      width: 200,
      height: 50,
      borderRadius: borderRadius.large || 16,
    },
    section: {
      marginBottom: spacing.xl || 40,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg || 20,
    },
    sectionTitle: {
      width: "60%",
      height: 24,
    },
    seeAllButton: {
      width: 80,
      height: 20,
      borderRadius: borderRadius.small || 8,
    },
    availabilityContainer: {
      marginBottom: spacing.lg || 20,
    },
    timeSlotsRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm || 8,
    },
    timeSlot: {
      width: 100,
      height: 60,
      marginRight: spacing.md || 12,
      borderRadius: borderRadius.medium || 12,
    },
    servicesContainer: {
      marginBottom: spacing.lg || 20,
    },
    servicesRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm || 8,
    },
    serviceCard: {
      width: 200,
      height: 280,
      marginRight: spacing.md || 12,
      borderRadius: borderRadius.large || 16,
    },
    servicesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    gridServiceCard: {
      width: (screenWidth - 60) / 2,
      height: 200,
      marginBottom: spacing.md || 12,
      borderRadius: borderRadius.large || 16,
    },
    locationCard: {
      height: 300,
      borderRadius: borderRadius.large || 16,
    },
    locationMap: {
      height: 200,
      borderRadius: borderRadius.large || 16,
      marginBottom: spacing.lg || 20,
    },
    locationInfo: {
      paddingHorizontal: spacing.lg || 20,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md || 12,
    },
    locationIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: spacing.sm || 8,
    },
    locationText: {
      flex: 1,
      height: 16,
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.lg || 20,
    },
    actionButton: {
      flex: 1,
      height: 50,
      marginHorizontal: spacing.xs || 4,
      borderRadius: borderRadius.medium || 12,
    },
  });

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Hero Section Skeleton */}
          <View style={styles.heroSection}>
            <View style={styles.heroLogo}>
              <SkeletonCircle size={80} />
            </View>
            <View style={styles.heroText}>
              <SkeletonText width="70%" height={28} style={{ marginBottom: 8 }} />
              <SkeletonText width="50%" height={20} />
            </View>
            <SkeletonCard
              width={200}
              height={50}
              style={styles.heroButton}
            />
          </View>

          {/* Today's Availability Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonText width="50%" height={24} style={styles.sectionTitle} />
            </View>
            <View style={styles.availabilityContainer}>
              <View style={styles.timeSlotsRow}>
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <SkeletonCard
                    key={index}
                    width={100}
                    height={60}
                    style={styles.timeSlot}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Featured Services Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonText width="60%" height={24} style={styles.sectionTitle} />
              <SkeletonCard
                width={80}
                height={20}
                style={styles.seeAllButton}
              />
            </View>
            <View style={styles.servicesContainer}>
              <View style={styles.servicesRow}>
                {[1, 2, 3].map((_, index) => (
                  <SkeletonCard
                    key={index}
                    width={200}
                    height={280}
                    style={styles.serviceCard}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* All Services Grid Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonText width="40%" height={24} style={styles.sectionTitle} />
            </View>
            <View style={styles.servicesGrid}>
              {[1, 2, 3, 4].map((_, index) => (
                <SkeletonCard
                  key={index}
                  width={(screenWidth - 60) / 2}
                  height={200}
                  style={styles.gridServiceCard}
                />
              ))}
            </View>
          </View>

          {/* Location Section Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonText width="50%" height={24} style={styles.sectionTitle} />
              <SkeletonCircle size={20} />
            </View>
            <SkeletonCard
              width="100%"
              height={300}
              style={styles.locationCard}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default SkeletonLoader;
