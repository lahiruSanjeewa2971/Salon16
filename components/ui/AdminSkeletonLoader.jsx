import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
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

// Main Admin Skeleton Loader Component
const AdminSkeletonLoader = ({ isLoading = true, screenType = 'dashboard' }) => {
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

  // Animation values for staggered sliding effect
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);

  useEffect(() => {
    // Start staggered animations sequence
    const startAnimations = () => {
      // Header animation (slides down)
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      
      // Main content fade in
      fadeAnim.value = withDelay(400, withTiming(1, { duration: 600 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
    };

    startAnimations();
  }, [fadeAnim, slideUpAnim, headerAnim]);

  if (!isLoading) return null;

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

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
    // Header Section
    headerSection: {
      alignItems: "center",
      marginBottom: spacing.xl || 40,
    },
    headerTitle: {
      width: "70%",
      height: 36,
      marginBottom: spacing.md || 12,
    },
    headerSubtitle: {
      width: "90%",
      height: 20,
      marginBottom: spacing.lg || 20,
    },
    // Dashboard specific styles
    dashboardStats: {
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
      width: 40,
      height: 28,
      marginBottom: spacing.xs || 4,
    },
    statLabel: {
      width: 60,
      height: 14,
    },
    // Bookings specific styles
    bookingsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg || 20,
    },
    bookingsTitle: {
      width: "50%",
      height: 28,
    },
    bookingsFilter: {
      width: 100,
      height: 32,
      borderRadius: borderRadius.xl || 20,
    },
    bookingsSearch: {
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
    // Services specific styles
    servicesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    serviceCard: {
      width: "48%",
      height: 200,
      marginBottom: spacing.md || 12,
      borderRadius: borderRadius.large || 16,
    },
    serviceCardImage: {
      width: "100%",
      height: 120,
      borderRadius: borderRadius.medium || 12,
      marginBottom: spacing.md || 12,
    },
    serviceCardContent: {
      paddingHorizontal: spacing.sm || 8,
    },
    serviceCardTitle: {
      width: "80%",
      height: 16,
      marginBottom: spacing.xs || 4,
    },
    serviceCardPrice: {
      width: "40%",
      height: 14,
    },
    // Customers specific styles
    customersList: {
      marginBottom: spacing.lg || 20,
    },
    customerCard: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.xl || 20,
      padding: spacing.lg || 16,
      marginBottom: spacing.md || 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    customerHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md || 12,
    },
    customerAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: spacing.md || 12,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      width: "60%",
      height: 18,
      marginBottom: spacing.xs || 4,
    },
    customerEmail: {
      width: "80%",
      height: 14,
    },
    customerStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    customerStat: {
      alignItems: "center",
      flex: 1,
    },
    customerStatNumber: {
      width: 30,
      height: 20,
      marginBottom: spacing.xs || 4,
    },
    customerStatLabel: {
      width: 50,
      height: 12,
    },
  });

  const styles = createStyles(colors, spacing, borderRadius);

  const renderDashboardContent = () => (
    <>
      {/* Stats Container */}
      <View style={styles.dashboardStats}>
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} style={styles.statItem}>
            <SkeletonText 
              width={40} 
              height={28} 
              style={styles.statNumber} 
              delay={200 + index * 100}
            />
            <SkeletonText 
              width={60} 
              height={14} 
              style={styles.statLabel} 
              delay={300 + index * 100}
            />
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.servicesGrid}>
        {[1, 2, 3, 4].map((_, index) => (
          <SkeletonCard
            key={index}
            width="48%"
            height={120}
            style={styles.serviceCard}
            delay={400 + index * 100}
          />
        ))}
      </View>
    </>
  );

  const renderBookingsContent = () => (
    <>
      {/* Bookings Header */}
      <View style={styles.bookingsHeader}>
        <SkeletonText 
          width="50%" 
          height={28} 
          style={styles.bookingsTitle} 
          delay={200}
        />
        <SkeletonCard
          width={100}
          height={32}
          style={styles.bookingsFilter}
          delay={300}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.bookingsSearch}>
        <SkeletonCircle 
          size={20} 
          style={styles.searchIcon} 
          delay={400}
        />
        <SkeletonText 
          width="80%" 
          height={20} 
          style={styles.searchInput} 
          delay={500}
        />
      </View>

      {/* Booking Cards */}
      {[1, 2, 3].map((_, cardIndex) => (
        <SkeletonCard
          key={cardIndex}
          width="100%"
          height={280}
          style={styles.bookingCard}
          delay={600 + cardIndex * 200}
        >
          <View style={styles.cardHeader}>
            <View style={styles.serviceInfo}>
              <SkeletonText 
                width="70%" 
                height={20} 
                style={styles.serviceName} 
                delay={700 + cardIndex * 200}
              />
              <SkeletonText 
                width="50%" 
                height={13} 
                style={styles.bookingId} 
                delay={800 + cardIndex * 200}
              />
            </View>
            <SkeletonCard
              width={80}
              height={28}
              style={styles.statusBadge}
              delay={900 + cardIndex * 200}
            />
          </View>

          <View style={styles.detailsGrid}>
            {[1, 2, 3, 4].map((_, detailIndex) => (
              <View key={detailIndex} style={styles.detailItem}>
                <SkeletonCircle 
                  size={40} 
                  style={styles.detailIcon} 
                  delay={1000 + cardIndex * 200 + detailIndex * 100}
                />
                <View style={styles.detailContent}>
                  <SkeletonText 
                    width="40%" 
                    height={12} 
                    style={styles.detailLabel} 
                    delay={1100 + cardIndex * 200 + detailIndex * 100}
                  />
                  <SkeletonText 
                    width="60%" 
                    height={15} 
                    style={styles.detailText} 
                    delay={1200 + cardIndex * 200 + detailIndex * 100}
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
              delay={1300 + cardIndex * 200}
            />
            <SkeletonCard
              width="30%"
              height={44}
              style={styles.actionButton}
              delay={1400 + cardIndex * 200}
            />
            <SkeletonCard
              width="35%"
              height={44}
              style={styles.actionButton}
              delay={1500 + cardIndex * 200}
            />
          </View>
        </SkeletonCard>
      ))}
    </>
  );

  const renderServicesContent = () => (
    <>
      {/* Services Grid */}
      <View style={styles.servicesGrid}>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <View key={index}>
            <SkeletonCard
              width="100%"
              height={120}
              style={styles.serviceCardImage}
              delay={200 + index * 100}
            />
            <View style={styles.serviceCardContent}>
              <SkeletonText 
                width="80%" 
                height={16} 
                style={styles.serviceCardTitle} 
                delay={300 + index * 100}
              />
              <SkeletonText 
                width="40%" 
                height={14} 
                style={styles.serviceCardPrice} 
                delay={400 + index * 100}
              />
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderCustomersContent = () => (
    <>
      {/* Customers List */}
      <View style={styles.customersList}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <SkeletonCard
            key={index}
            width="100%"
            height={100}
            style={styles.customerCard}
            delay={200 + index * 100}
          >
            <View style={styles.customerHeader}>
              <SkeletonCircle 
                size={50} 
                style={styles.customerAvatar} 
                delay={300 + index * 100}
              />
              <View style={styles.customerInfo}>
                <SkeletonText 
                  width="60%" 
                  height={18} 
                  style={styles.customerName} 
                  delay={400 + index * 100}
                />
                <SkeletonText 
                  width="80%" 
                  height={14} 
                  style={styles.customerEmail} 
                  delay={500 + index * 100}
                />
              </View>
            </View>
            
            <View style={styles.customerStats}>
              {[1, 2, 3].map((_, statIndex) => (
                <View key={statIndex} style={styles.customerStat}>
                  <SkeletonText 
                    width={30} 
                    height={20} 
                    style={styles.customerStatNumber} 
                    delay={600 + index * 100 + statIndex * 50}
                  />
                  <SkeletonText 
                    width={50} 
                    height={12} 
                    style={styles.customerStatLabel} 
                    delay={700 + index * 100 + statIndex * 50}
                  />
                </View>
              ))}
            </View>
          </SkeletonCard>
        ))}
      </View>
    </>
  );

  const renderProfileContent = () => (
    <>
      {/* Profile Sections */}
      <View style={styles.servicesGrid}>
        {[1, 2, 3].map((_, index) => (
          <SkeletonCard
            key={index}
            width="100%"
            height={200}
            style={styles.serviceCard}
            delay={200 + index * 200}
          />
        ))}
      </View>
    </>
  );

  const renderScreenContent = () => {
    switch (screenType) {
      case 'dashboard':
        return renderDashboardContent();
      case 'bookings':
        return renderBookingsContent();
      case 'services':
        return renderServicesContent();
      case 'customers':
        return renderCustomersContent();
      case 'profile':
        return renderProfileContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header Section Skeleton */}
          <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
            <SkeletonText 
              width="70%" 
              height={36} 
              style={styles.headerTitle} 
              delay={0}
            />
            <SkeletonText 
              width="90%" 
              height={20} 
              style={styles.headerSubtitle} 
              delay={100}
            />
          </Animated.View>

          {/* Screen-specific content */}
          <Animated.View style={contentAnimatedStyle}>
            {renderScreenContent()}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AdminSkeletonLoader;

