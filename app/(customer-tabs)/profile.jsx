import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "../../components/ThemedText";
import { ThemedButton } from "../../components/themed/ThemedButton";
import ProfileSkeletonLoader from "../../components/ui/ProfileSkeletonLoader";
import { useToastHelpers } from "../../components/ui/ToastSystem";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth, useAuthActions } from "../../hooks/useAuth";
import { useResponsive } from "../../hooks/useResponsive";

const { width: screenWidth } = Dimensions.get("window");

export default function CustomerProfileScreen() {
  const { colors, spacing } = useTheme();
  const responsive = useResponsive();
  const router = useRouter();
  const { user } = useAuth();
  const { signOut } = useAuthActions();
  const {
    showSuccess: showSuccessToast,
    showError: showErrorToast,
    showInfo,
  } = useToastHelpers();

  // Helper functions to format user data
  const formatDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.firstName && user?.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user?.name) return user.name;
    return "User Name";
  };

  const formatPhoneNumber = () => {
    if (user?.phone) {
      // Format phone number if it's just digits
      const phone = user.phone.replace(/\D/g, "");
      if (phone.length === 10) {
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
      }
      return user.phone;
    }
    return "+1 (555) 123-4567";
  };

  // Mock booking data
  const mockBookings = [
    {
      id: "1",
      serviceName: "Hair Cut & Style",
      date: "2025-09-15",
      timeSlot: "10:00 AM",
      status: "completed",
      price: "$45",
      stylistName: "Sarah Johnson",
    },
    {
      id: "2",
      serviceName: "Hair Coloring",
      date: "2025-09-20",
      timeSlot: "2:30 PM",
      status: "upcoming",
      price: "$120",
      stylistName: "Mike Chen",
    },
    {
      id: "3",
      serviceName: "Facial Treatment",
      date: "2025-09-10",
      timeSlot: "11:00 AM",
      status: "completed",
      price: "$80",
      stylistName: "Emma Davis",
    },
    {
      id: "4",
      serviceName: "Manicure & Pedicure",
      date: "2025-09-25",
      timeSlot: "3:00 PM",
      status: "upcoming",
      price: "$65",
      stylistName: "Lisa Wilson",
    },
    {
      id: "5",
      serviceName: "Hair Treatment",
      date: "2025-09-05",
      timeSlot: "1:00 PM",
      status: "cancelled",
      price: "$90",
      stylistName: "Alex Brown",
    },
  ];

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "rgba(34, 197, 94, 0.8)"; // Green
      case "upcoming":
        return "rgba(59, 130, 246, 0.8)"; // Blue
      case "cancelled":
        return "rgba(239, 68, 68, 0.8)"; // Red
      default:
        return "rgba(255, 255, 255, 0.6)";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "upcoming":
        return "time";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);

  // Reset loading state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Profile: Screen focused, starting loading...");
      setIsLoading(true);

      // Simulate loading time
      const loadingTimer = setTimeout(() => {
        console.log("Profile: Loading completed, showing content...");
        setIsLoading(false);
      }, 2000); // 2 seconds loading time

      // Start animations
      fadeAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      slideUpAnim.value = withSpring(0, { damping: 15, stiffness: 150 });

      // Check if user is logged in and show toast
      if (!user) {
        showInfo("To access this, please login.");
      }

      return () => {
        console.log("Profile: Cleaning up loading timer...");
        clearTimeout(loadingTimer);
      };
    }, [user, showInfo, fadeAnim, slideUpAnim])
  );

  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
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
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? responsive.responsive.height(12) : responsive.responsive.height(10),
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
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 4,
      borderColor: "rgba(255, 255, 255, 0.4)",
    },
    profileImage: {
      width: 114,
      height: 114,
      borderRadius: 57,
    },
    editImageButton: {
      position: "absolute",
      bottom: 5,
      right: 5,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent || "#EC4899",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "white",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    userName: {
      fontSize: 32,
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      marginBottom: spacing.sm,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    userEmail: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      marginBottom: spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    // Card Container
    cardContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 20,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
      backdropFilter: "blur(10px)",
    },
    // Personal Info Section
    personalInfoCard: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "white",
      marginBottom: spacing.lg,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      textAlign: "center",
    },
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
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 16,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.6)",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 16,
      color: "white",
      fontWeight: "600",
    },
    // Mock Data Section
    mockDataCard: {
      marginBottom: spacing.lg,
    },
    mockDataRow: {
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
    mockDataLabel: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.6)",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    mockDataValue: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: "600",
    },
    // Booking History Section
    bookingHistoryCard: {
      marginBottom: spacing.lg,
    },
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
      fontSize: 16,
      fontWeight: "600",
      color: "white",
      marginBottom: 2,
    },
    bookingDate: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.7)",
    },
    bookingStatus: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
    },
    bookingStatusText: {
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    bookingDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bookingDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    bookingDetailText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      marginLeft: spacing.xs,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    viewAllButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
      marginRight: spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xl,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.6)",
      textAlign: "center",
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
    },
    // Missing styles for restricted access
    iconContainer: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      marginBottom: spacing.sm,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      marginTop: spacing.xl,
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Show skeleton loader while loading
  if (isLoading && user) {
    return <ProfileSkeletonLoader isLoading={isLoading} />;
  }

  // Show restricted message for guests
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            colors.primary || "#6B46C1",
            colors.primaryDark || "#553C9A",
            colors.accent || "#EC4899",
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, contentAnimatedStyle]}>
            <Ionicons name="person-outline" size={60} color="white" />
          </Animated.View>

          <Animated.View style={contentAnimatedStyle}>
            <ThemedText style={styles.title}>Access Restricted</ThemedText>
            <ThemedText style={styles.subtitle}>
              Please login to access your profile
            </ThemedText>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      console.log("Logout attempt...");
      
      const success = await signOut();
      
      if (success) {
        console.log("Logout successful");
        
        showSuccessToast(
          "Logout Successful!",
          "You have been logged out successfully.",
          { duration: 3000 }
        );
        
        // Redirect to welcome screen
        router.replace("/WelcomeScreen");
      } else {
        console.error("Logout failed");

        showErrorToast("Logout Failed", "Failed to logout. Please try again.", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      
      showErrorToast(
        "Logout Error",
        "Something went wrong. Please try again.",
        { duration: 5000 }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          colors.primary || "#6C2A52",
          colors.primaryDark || "#553C9A",
          colors.accent || "#EC4899",
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
        <Animated.View style={contentAnimatedStyle}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Profile Picture */}
            <View style={styles.profileImageContainer}>
              <Ionicons name="person" size={70} color="white" />
              <TouchableOpacity style={styles.editImageButton}>
                <Ionicons name="camera" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* User Name and Email */}
            <ThemedText style={styles.userName}>
              {formatDisplayName()}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {user?.email || "user@example.com"}
            </ThemedText>
          </View>

          {/* Personal Information Card */}
          <View style={[styles.cardContainer, styles.personalInfoCard]}>
            <ThemedText style={styles.sectionTitle}>
              👤 Personal Information
            </ThemedText>

            {/* Full Name */}
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.8)"
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Full Name</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatDisplayName()}
                </ThemedText>
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.8)"
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Email Address</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {user?.email || "user@example.com"}
                </ThemedText>
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.8)"
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoLabel}>Phone Number</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatPhoneNumber()}
        </ThemedText>
              </View>
            </View>
          </View>

          {/* Booking History Section */}
          <View style={[styles.cardContainer, styles.bookingHistoryCard]}>
            <ThemedText style={styles.sectionTitle}>
              📅 Recent Bookings
        </ThemedText>
        
            {mockBookings.length > 0 ? (
              <>
                {mockBookings.slice(0, 5).map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <View style={styles.bookingServiceInfo}>
                        <ThemedText style={styles.bookingServiceName}>
                          {booking.serviceName}
                        </ThemedText>
                        <ThemedText style={styles.bookingDate}>
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at {booking.timeSlot}
                        </ThemedText>
                      </View>
                      <View style={styles.bookingStatus}>
                        <Ionicons
                          name={getStatusIcon(booking.status)}
                          size={16}
                          color={getStatusColor(booking.status)}
                        />
                        <ThemedText
                          style={[
                            styles.bookingStatusText,
                            { color: getStatusColor(booking.status) },
                          ]}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDetailRow}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                        <ThemedText style={styles.bookingDetailText}>
                          {booking.stylistName}
                        </ThemedText>
                      </View>
                      <View style={styles.bookingDetailRow}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                        <ThemedText style={styles.bookingDetailText}>
                          {booking.price}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.viewAllButton}>
                  <ThemedText style={styles.viewAllButtonText}>
                    View All Bookings
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color="rgba(255, 255, 255, 0.4)"
                />
                <ThemedText style={styles.emptyStateText}>
                  No bookings yet
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Book your first appointment to see it here
                </ThemedText>
              </View>
            )}
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
          <ThemedButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            size="large"
              style={styles.logoutButton}
          />
        </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
