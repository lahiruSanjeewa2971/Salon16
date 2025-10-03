import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withDelay,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInUp,
  SlideInDown
} from 'react-native-reanimated';

import { ThemedText } from '../../components/ThemedText';
import { ThemedButton } from '../../components/themed/ThemedButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useAuthActions } from '../../hooks/useAuth';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';

// Section Components
import SalonInformation from '../../components/sections/admin/SalonInformation';
import NotificationSettings from '../../components/sections/admin/NotificationSettings';
import AITrendsSection from '../../components/sections/admin/AITrendsSection';

const { width, height } = Dimensions.get('window');

export default function AdminProfileScreen() {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const shadows = theme?.shadows || {};
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToastHelpers();
  const { signOut } = useAuthActions();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);
  const scrollY = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Start animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      fadeAnim.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(hideSkeleton);
    }, [fadeAnim, slideUpAnim, headerAnim])
  );

  // Event handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Profile refreshed!');
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      console.log("Admin logout attempt...");
      
      const success = await signOut();
      
      if (success) {
        console.log("Admin logout successful");
        
        showSuccess(
          "Logout Successful!",
          "You have been logged out successfully.",
          { duration: 3000 }
        );
        
        // Redirect to welcome screen
        router.replace("/WelcomeScreen");
      } else {
        console.error("Admin logout failed");

        showError("Logout Failed", "Failed to logout. Please try again.", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Admin logout error:", error);
      
      showError(
        "Logout Error",
        "Something went wrong. Please try again.",
        { duration: 5000 }
      );
    }
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const parallaxHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -100],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
    };
  });

  if (isLoading) {
    return <AdminSkeletonLoader isLoading={isLoading} screenType="profile" />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    gradient: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xxxl,
    },
    // Clean Header
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
      marginBottom: spacing.xs,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    // Stats Cards
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      ...shadows.medium,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: 'white',
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Action Buttons
    actionsContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    actionsTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      marginBottom: spacing.md,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionButton: {
      width: '48%',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      ...shadows.medium,
    },
    actionIcon: {
      marginBottom: spacing.sm,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
    },
    // Sections
    sectionsContainer: {
      paddingHorizontal: spacing.lg,
    },
    sectionSpacing: {
      marginBottom: spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Content */}
        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Clean Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
              <ThemedText style={styles.headerTitle}>
                Admin Profile
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Manage your salon settings and preferences
              </ThemedText>
            </Animated.View>

            {/* Stats Cards */}
            <Animated.View 
              entering={SlideInUp.delay(200)}
              style={styles.statsContainer}
            >
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>24</ThemedText>
                <ThemedText style={styles.statLabel}>Services</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>156</ThemedText>
                <ThemedText style={styles.statLabel}>Bookings</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>4.9</ThemedText>
                <ThemedText style={styles.statLabel}>Rating</ThemedText>
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View 
              entering={SlideInUp.delay(400)}
              style={styles.actionsContainer}
            >
              <ThemedText style={styles.actionsTitle}>
                Quick Actions
              </ThemedText>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons 
                    name="settings-outline" 
                    size={28} 
                    color="white" 
                    style={styles.actionIcon}
                  />
                  <ThemedText style={styles.actionText}>
                    Settings
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons 
                    name="notifications-outline" 
                    size={28} 
                    color="white" 
                    style={styles.actionIcon}
                  />
                  <ThemedText style={styles.actionText}>
                    Notifications
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons 
                    name="analytics-outline" 
                    size={28} 
                    color="white" 
                    style={styles.actionIcon}
                  />
                  <ThemedText style={styles.actionText}>
                    Analytics
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLogout}
                >
                  <Ionicons 
                    name="log-out-outline" 
                    size={28} 
                    color="white" 
                    style={styles.actionIcon}
                  />
                  <ThemedText style={styles.actionText}>
                    Logout
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Sections */}
            <View style={styles.sectionsContainer}>
              {/* Salon Information Section */}
              <Animated.View 
                entering={FadeIn.delay(600)}
                style={styles.sectionSpacing}
              >
                <SalonInformation
                  colors={colors}
                  spacing={spacing}
                  borderRadius={borderRadius}
                  shadows={shadows}
                  fadeAnim={fadeAnim}
                />
              </Animated.View>

              {/* Notification Settings Section */}
              <Animated.View 
                entering={FadeIn.delay(800)}
                style={styles.sectionSpacing}
              >
                <NotificationSettings
                  colors={colors}
                  spacing={spacing}
                  borderRadius={borderRadius}
                  shadows={shadows}
                  fadeAnim={fadeAnim}
                />
              </Animated.View>

              {/* AI Trends Section */}
              <Animated.View 
                entering={FadeIn.delay(1000)}
                style={styles.sectionSpacing}
              >
                <AITrendsSection
                  colors={colors}
                  spacing={spacing}
                  borderRadius={borderRadius}
                  shadows={shadows}
                  fadeAnim={fadeAnim}
                />
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
