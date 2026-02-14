import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Extrapolate,
  FadeIn,
  interpolate,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { arrayRemove, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { ThemedText } from '../../components/ThemedText';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { messaging } from '../../firebase.config';
import { useAuth, useAuthActions } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';

// Section Components
import SalonInformation from '../../components/sections/admin/profile/SalonInformation';

const { width, height } = Dimensions.get('window');

export default function AdminProfileScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const { user } = useAuth();

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

      // Check notification state on screen load
      const checkNotificationState = async () => {
        try {
          if (Platform.OS === 'web' && user?.uid) {
            // Check if user has FCM tokens in Firestore
            const userDoc = await authService.getUserDocument(user.uid);
            if (userDoc && Array.isArray(userDoc.fcmTokens) && userDoc.fcmTokens.length > 0) {
              setNotificationsEnabled(true);
              console.log('ProfileScreen: Notifications enabled (found tokens in Firestore)');
            } else {
              setNotificationsEnabled(false);
              console.log('ProfileScreen: Notifications disabled (no tokens in Firestore)');
            }
          }
        } catch (error) {
          console.warn('ProfileScreen: Failed to check notification state:', error);
          setNotificationsEnabled(false);
        }
      };

      checkNotificationState();

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(hideSkeleton);
    }, [fadeAnim, slideUpAnim, headerAnim, user?.uid])
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

  const handleNotificationToggle = async (value) => {
    if (Platform.OS !== 'web') {
      showWarning(
        'Not Supported',
        'Notifications are only available on web (PWA) for now.',
        { duration: 3000 }
      );
      return;
    }

    setIsTogglingNotifications(true);

    try {
      if (value) {
        // Enable notifications
        console.log('ProfileScreen: Enabling push notifications...');
        
        if (!messaging) {
          throw new Error('Firebase Messaging not initialized');
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        console.log('ProfileScreen: Notification permission:', permission);

        if (permission !== 'granted') {
          showWarning(
            'Permission Required',
            'Please allow notifications in your browser settings to receive booking alerts.',
            { duration: 4000 }
          );
          setIsTogglingNotifications(false);
          return;
        }

        // Get FCM token
        try {
          const token = await getToken(messaging, {
            vapidKey: process.env.EXPO_PUBLIC_FCM_VAPID_KEY
          });

          if (token) {
            // Save token locally
            await storageService.saveData('salon16_fcm_token', token);

            // Save token to Firestore user doc
            if (user?.uid) {
              await authService.updateUserDocument(user.uid, {
                fcmTokens: arrayUnion(token)
              });
            }

            setNotificationsEnabled(true);
            showSuccess(
              'Notifications Enabled',
              'You will now receive push notifications for new bookings.',
              { duration: 3000 }
            );
            console.log('ProfileScreen: Push notifications enabled successfully');
          } else {
            throw new Error('Failed to generate FCM token');
          }
        } catch (tokenError) {
          console.error('ProfileScreen: Failed to get FCM token:', tokenError);
          showError(
            'Token Error',
            'Failed to enable notifications. Please try again.',
            { duration: 3000 }
          );
        }
      } else {
        // Disable notifications
        console.log('ProfileScreen: Disabling push notifications...');

        try {
          const token = await storageService.loadData('salon16_fcm_token');
          if (token && user?.uid) {
            // Remove token from Firestore
            await authService.updateUserDocument(user.uid, {
              fcmTokens: arrayRemove(token)
            });
          }

          // Clear local token
          await storageService.removeData('salon16_fcm_token');

          setNotificationsEnabled(false);
          showSuccess(
            'Notifications Disabled',
            'You will no longer receive push notifications.',
            { duration: 3000 }
          );
          console.log('ProfileScreen: Push notifications disabled successfully');
        } catch (disableError) {
          console.error('ProfileScreen: Failed to disable notifications:', disableError);
          showError(
            'Error',
            'Failed to disable notifications. Please try again.',
            { duration: 3000 }
          );
        }
      }
    } catch (error) {
      console.error('ProfileScreen: Notification toggle error:', error);
      showError(
        'Error',
        error.message || 'An error occurred. Please try again.',
        { duration: 3000 }
      );
    } finally {
      setIsTogglingNotifications(false);
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
      ...responsive.containerStyles.fullScreen,
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
      paddingBottom: Platform.OS === 'ios' ? responsive.responsive.height(12) : responsive.responsive.height(10),
    },
    // Clean Header
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
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
    // Action Buttons / Settings Cards
    actionsContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    actionsTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      marginBottom: spacing.lg,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    actionsGrid: {
      flexDirection: 'column',
      gap: spacing.md,
    },
    // Modern Card Style for Settings
    settingsCard: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backdropFilter: 'blur(15px)',
      ...shadows.medium,
    },
    settingsCardContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    settingsIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    settingsTextWrapper: {
      flex: 1,
      justifyContent: 'center',
    },
    settingsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
    },
    settingsSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.65)',
      fontWeight: '500',
    },
    // Logout Button Style
    logoutButton: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      backdropFilter: 'blur(15px)',
      ...shadows.medium,
    },
    logoutCardContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    logoutIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    logoutTextWrapper: {
      flex: 1,
      justifyContent: 'center',
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
    },
    logoutSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.65)',
      fontWeight: '500',
    },
    actionButton: {
      width: '100%',
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
              {/* <View style={styles.statCard}>
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
              </View> */}
            </Animated.View>

            {/* Settings Section */}
            <Animated.View 
              entering={SlideInUp.delay(400)}
              style={styles.actionsContainer}
            >
              <ThemedText style={styles.actionsTitle}>
                Settings
              </ThemedText>
              <View style={styles.actionsGrid}>
                {/* Push Notifications Card */}
                <View style={styles.settingsCard}>
                  <View style={styles.settingsCardContent}>
                    <View style={styles.settingsIconWrapper}>
                      <Ionicons 
                        name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'} 
                        size={24} 
                        color="white"
                      />
                    </View>
                    <View style={styles.settingsTextWrapper}>
                      <ThemedText style={styles.settingsTitle}>
                        Push Notifications
                      </ThemedText>
                      <ThemedText style={styles.settingsSubtitle}>
                        {notificationsEnabled ? 'Receiving alerts' : 'Disabled — enable for updates'}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    disabled={isTogglingNotifications}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(76, 217, 100, 0.5)' }}
                    thumbColor={notificationsEnabled ? '#4cd964' : 'rgba(255,255,255,0.7)'}
                  />
                </View>
                
                {/* Logout Button */}
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View style={styles.logoutCardContent}>
                    <View style={styles.logoutIconWrapper}>
                      <Ionicons 
                        name="log-out-outline" 
                        size={24} 
                        color="#ffffff"
                      />
                    </View>
                    <View style={styles.logoutTextWrapper}>
                      <ThemedText style={styles.logoutText}>
                        Logout
                      </ThemedText>
                      <ThemedText style={styles.logoutSubtitle}>
                        Sign out from your account
                      </ThemedText>
                    </View>
                  </View>
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
              {/* <Animated.View 
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
              </Animated.View> */}

              {/* AI Trends Section */}
              {/* <Animated.View 
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
              </Animated.View> */}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
