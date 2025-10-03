import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withDelay,
  useAnimatedStyle 
} from 'react-native-reanimated';

import { ThemedText } from '../../components/ThemedText';
import { useTheme } from '../../contexts/ThemeContext';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';

// Import dashboard components
import DashboardHeader from '../../components/sections/admin/DashboardHeader';
import DashboardStats from '../../components/sections/admin/DashboardStats';
import TodaysSchedule from '../../components/sections/admin/TodaysSchedule';
import QuickActions from '../../components/sections/admin/QuickActions';
import CategoryManager from '../../components/sections/admin/CategoryManager';

export default function AdminDashboardScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const { showSuccess, showError } = useToastHelpers();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for dashboard
  const mockStats = {
    totalBookings: 24,
    pendingBookings: 5,
    todayRevenue: 450,
    activeServices: 8,
  };

  const mockSchedule = [
    {
      id: '1',
      time: '09:00',
      service: 'Hair Cut',
      customer: 'John Doe',
      status: 'completed',
    },
    {
      id: '2',
      time: '10:30',
      service: 'Hair Color',
      customer: 'Jane Smith',
      status: 'in-progress',
    },
    {
      id: '3',
      time: '12:00',
      service: 'Manicure',
      customer: 'Bob Johnson',
      status: 'upcoming',
    },
    {
      id: '4',
      time: '14:30',
      service: 'Facial',
      customer: 'Alice Brown',
      status: 'upcoming',
    },
    {
      id: '5',
      time: '16:00',
      service: 'Massage',
      customer: 'Charlie Wilson',
      status: 'upcoming',
    },
  ];

  const mockCategories = [
    {
      id: '1',
      name: 'Hair',
      serviceCount: 5,
    },
    {
      id: '2',
      name: 'Nail',
      serviceCount: 3,
    },
    {
      id: '3',
      name: 'Facial',
      serviceCount: 2,
    },
    {
      id: '4',
      name: 'Spa',
      serviceCount: 1,
    },
  ];

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Start animations
      fadeAnim.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
      headerAnim.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 150 }));

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
      showSuccess('Dashboard refreshed!');
    }, 1500);
  };

  const handleViewBooking = (booking) => {
    showSuccess(`Viewing booking: ${booking.service} for ${booking.customer}`);
  };

  const handleAddService = () => {
    showSuccess('Navigate to Add Service');
  };

  const handleNewBooking = () => {
    showSuccess('Navigate to New Booking');
  };

  const handleViewCustomers = () => {
    showSuccess('Navigate to Customers');
  };

  const handleManageCategories = () => {
    showSuccess('Navigate to Category Management');
  };

  const handleAddCategory = () => {
    showSuccess('Add Category modal');
  };

  const handleEditCategory = (category) => {
    showSuccess(`Edit category: ${category.name}`);
  };

  const handleViewCategoryStats = () => {
    showSuccess('View Category Statistics');
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  if (isLoading) {
    return <AdminSkeletonLoader isLoading={isLoading} screenType="dashboard" />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xxxl,
      paddingTop: spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          colors.primary || '#6C2A52',
          colors.primaryDark || '#8E3B60', 
          colors.accent || '#EC4899'
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <DashboardHeader animatedStyle={headerAnimatedStyle} />

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
          {/* Stats Section */}
          <DashboardStats stats={mockStats} animatedStyle={contentAnimatedStyle} />

          {/* Today's Schedule */}
          <TodaysSchedule 
            schedule={mockSchedule} 
            animatedStyle={contentAnimatedStyle}
            onViewBooking={handleViewBooking}
          />

          {/* Quick Actions */}
          <QuickActions 
            animatedStyle={contentAnimatedStyle}
            onAddService={handleAddService}
            onNewBooking={handleNewBooking}
            onViewCustomers={handleViewCustomers}
            onManageCategories={handleManageCategories}
          />

          {/* Category Management */}
          <CategoryManager 
            categories={mockCategories}
            animatedStyle={contentAnimatedStyle}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onViewCategoryStats={handleViewCategoryStats}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
