import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";


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
const SkeletonText = ({ width = "80%", height = 16, style = {}, delay = 0 }) => {
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );
  }, [delay, shimmerAnim]);

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
const SkeletonCard = ({ width, height, style = {}, delay = 0 }) => {
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      )
    );
  }, [delay, shimmerAnim]);

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
const SkeletonCircle = ({ size = 60, style = {}, delay = 0 }) => {
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        false
      )
    );
  }, [delay, pulseAnim]);

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

// Main Bookings Skeleton Loader Component
const BookingsSkeletonLoader = ({ isLoading = true, screenType = 'bookings' }) => {
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
    xxl: 24,
    xxxl: 32,
  };
  const borderRadius = theme?.borderRadius || {
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
  };

  if (!isLoading) return null;

  const createStyles = (colors, spacing, borderRadius) => ({
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
      paddingBottom: spacing.xxxl || 32,
    },
    header: {
      alignItems: "center",
      marginBottom: spacing.xl || 40,
    },
    title: {
      width: "60%",
      height: 32,
      marginBottom: spacing.sm || 8,
    },
    subtitle: {
      width: "80%",
      height: 20,
      marginBottom: spacing.lg || 20,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: spacing.xl || 40,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: borderRadius.large || 16,
      paddingVertical: spacing.lg || 20,
      paddingHorizontal: spacing.md || 12,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statNumber: {
      width: 30,
      height: 24,
      marginBottom: spacing.xs || 4,
    },
    statLabel: {
      width: 50,
      height: 12,
    },
    filterTabs: {
      flexDirection: "row",
      marginBottom: spacing.lg || 20,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: borderRadius.xl || 20,
      padding: spacing.xs || 4,
    },
    filterTab: {
      flex: 1,
      paddingVertical: spacing.md || 12,
      paddingHorizontal: spacing.lg || 16,
      borderRadius: borderRadius.large || 16,
      alignItems: "center",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: borderRadius.xl || 20,
      paddingHorizontal: spacing.lg || 16,
      paddingVertical: spacing.md || 12,
      marginBottom: spacing.lg || 20,
    },
    searchIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: spacing.sm || 8,
    },
    searchInput: {
      flex: 1,
      height: 20,
    },
    bookingCard: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.xl || 20,
      padding: spacing.xl || 20,
      marginBottom: spacing.lg || 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.lg || 20,
    },
    serviceInfo: {
      flex: 1,
      marginRight: spacing.md || 12,
    },
    serviceName: {
      width: "70%",
      height: 20,
      marginBottom: spacing.xs || 4,
    },
    bookingId: {
      width: "50%",
      height: 13,
    },
    statusBadge: {
      width: 80,
      height: 28,
      borderRadius: 14,
    },
    detailsGrid: {
      marginBottom: spacing.lg || 20,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md || 12,
      paddingVertical: spacing.sm || 8,
      paddingHorizontal: spacing.md || 12,
      backgroundColor: "rgba(0, 0, 0, 0.02)",
      borderRadius: borderRadius.large || 16,
    },
    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: spacing.md || 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      width: "40%",
      height: 12,
      marginBottom: 2,
    },
    detailText: {
      width: "60%",
      height: 15,
    },
    actionButtons: {
      flexDirection: "row",
      paddingTop: spacing.md || 12,
      borderTopWidth: 1,
      borderTopColor: "rgba(0, 0, 0, 0.05)",
      gap: spacing.sm || 8,
    },
    actionButton: {
      flex: 1,
      height: 44,
      borderRadius: borderRadius.large || 16,
    },
    viewDetailsButton: {
      flex: 1,
      height: 44,
      borderRadius: borderRadius.large || 16,
    },
  });

  const styles = createStyles(colors, spacing, borderRadius);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <SkeletonText 
              width="60%" 
              height={32} 
              style={styles.title} 
              delay={0}
            />
            <SkeletonText 
              width="80%" 
              height={20} 
              style={styles.subtitle} 
              delay={100}
            />
          </View>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.statItem}>
                <SkeletonText 
                  width={30} 
                  height={24} 
                  style={styles.statNumber} 
                  delay={200 + index * 100}
                />
                <SkeletonText 
                  width={50} 
                  height={12} 
                  style={styles.statLabel} 
                  delay={300 + index * 100}
                />
              </View>
            ))}
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.filterTab}>
                <SkeletonText 
                  width="60%" 
                  height={15} 
                  delay={400 + index * 100}
                />
                <SkeletonText 
                  width={20} 
                  height={12} 
                  style={{ marginTop: 2 }} 
                  delay={500 + index * 100}
                />
              </View>
            ))}
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <SkeletonCircle 
              size={20} 
              style={styles.searchIcon} 
              delay={600}
            />
            <SkeletonText 
              width="80%" 
              height={20} 
              style={styles.searchInput} 
              delay={700}
            />
          </View>

          {/* Booking Cards */}
          {screenType === 'bookings' && (
            <>
              {[1, 2, 3].map((_, cardIndex) => (
                <SkeletonCard
                  key={cardIndex}
                  width="100%"
                  height={280}
                  style={styles.bookingCard}
                  delay={800 + cardIndex * 200}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                      <SkeletonText 
                        width="70%" 
                        height={20} 
                        style={styles.serviceName} 
                        delay={900 + cardIndex * 200}
                      />
                      <SkeletonText 
                        width="50%" 
                        height={13} 
                        style={styles.bookingId} 
                        delay={1000 + cardIndex * 200}
                      />
                    </View>
                    <SkeletonCard
                      width={80}
                      height={28}
                      style={styles.statusBadge}
                      delay={1100 + cardIndex * 200}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    {[1, 2, 3, 4].map((_, detailIndex) => (
                      <View key={detailIndex} style={styles.detailItem}>
                        <SkeletonCircle 
                          size={40} 
                          style={styles.detailIcon} 
                          delay={1200 + cardIndex * 200 + detailIndex * 100}
                        />
                        <View style={styles.detailContent}>
                          <SkeletonText 
                            width="40%" 
                            height={12} 
                            style={styles.detailLabel} 
                            delay={1300 + cardIndex * 200 + detailIndex * 100}
                          />
                          <SkeletonText 
                            width="60%" 
                            height={15} 
                            style={styles.detailText} 
                            delay={1400 + cardIndex * 200 + detailIndex * 100}
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.actionButtons}>
                    <SkeletonCard
                      width="30%"
                      height={44}
                      style={styles.actionButton}
                      delay={1500 + cardIndex * 200}
                    />
                    <SkeletonCard
                      width="30%"
                      height={44}
                      style={styles.actionButton}
                      delay={1600 + cardIndex * 200}
                    />
                    <SkeletonCard
                      width="35%"
                      height={44}
                      style={styles.viewDetailsButton}
                      delay={1700 + cardIndex * 200}
                    />
                  </View>
                </SkeletonCard>
              ))}
            </>
          )}

          {/* Reviews Cards (if screenType is reviews) */}
          {screenType === 'reviews' && (
            <>
              {[1, 2, 3, 4].map((_, cardIndex) => (
                <SkeletonCard
                  key={cardIndex}
                  width="100%"
                  height={200}
                  style={styles.bookingCard}
                  delay={800 + cardIndex * 150}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                      <SkeletonText 
                        width="60%" 
                        height={18} 
                        style={styles.serviceName} 
                        delay={900 + cardIndex * 150}
                      />
                      <SkeletonText 
                        width="40%" 
                        height={12} 
                        style={styles.bookingId} 
                        delay={1000 + cardIndex * 150}
                      />
                    </View>
                    <SkeletonCard
                      width={60}
                      height={24}
                      style={styles.statusBadge}
                      delay={1100 + cardIndex * 150}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <SkeletonCircle 
                        size={30} 
                        style={styles.detailIcon} 
                        delay={1200 + cardIndex * 150}
                      />
                      <View style={styles.detailContent}>
                        <SkeletonText 
                          width="50%" 
                          height={14} 
                          style={styles.detailLabel} 
                          delay={1300 + cardIndex * 150}
                        />
                        <SkeletonText 
                          width="70%" 
                          height={16} 
                          style={styles.detailText} 
                          delay={1400 + cardIndex * 150}
                        />
                      </View>
                    </View>
                  </View>
                </SkeletonCard>
              ))}
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

export default BookingsSkeletonLoader;
