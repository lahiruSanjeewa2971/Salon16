import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, StatusBar } from 'react-native';
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

// Import new booking components
import BookingsHeader from '../../components/sections/admin/BookingsHeader';
import BookingsCalendar from '../../components/sections/admin/BookingsCalendar';
import TodaysBookings from '../../components/sections/admin/TodaysBookings';

export default function AdminBookingsScreen() {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const { showSuccess, showError } = useToastHelpers();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data for bookings
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const mockBookings = [
    {
      id: '1',
      date: today,
      time: '09:00',
      customer: 'John Doe',
      service: 'Hair Cut',
      price: 50,
      status: 'completed',
    },
    {
      id: '2',
      date: today,
      time: '10:30',
      customer: 'Jane Smith',
      service: 'Hair Color',
      price: 80,
      status: 'in-progress',
    },
    {
      id: '3',
      date: today,
      time: '12:00',
      customer: 'Bob Johnson',
      service: 'Manicure',
      price: 35,
      status: 'upcoming',
    },
    {
      id: '4',
      date: today,
      time: '14:30',
      customer: 'Alice Brown',
      service: 'Facial',
      price: 60,
      status: 'pending',
    },
    {
      id: '5',
      date: tomorrow,
      time: '11:00',
      customer: 'Charlie Wilson',
      service: 'Massage',
      price: 90,
      status: 'pending',
    },
    {
      id: '6',
      date: tomorrow,
      time: '15:00',
      customer: 'Diana Prince',
      service: 'Hair Styling',
      price: 75,
      status: 'pending',
    },
    {
      id: '7',
      date: dayAfterTomorrow,
      time: '10:00',
      customer: 'Bruce Wayne',
      service: 'Beard Trim',
      price: 25,
      status: 'pending',
    },
  ];

  // Filter bookings for selected date
  const todaysBookings = mockBookings.filter(booking => 
    booking.date === selectedDate
  );

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-50);

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

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Handlers
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Bookings refreshed');
    }, 1000);
  }, [showSuccess]);

  const handleSearch = () => {
    showSuccess('Search functionality coming soon');
  };

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    // Remove toast to prevent UI disruption
    // showSuccess(`Selected date: ${date}`);
  }, []);

  const handleBookingAction = (bookingId, action) => {
    showSuccess(`${action} booking ${bookingId}`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    background: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: spacing.xl,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xl * 2, // Double padding for bottom spacing
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <LinearGradient
          colors={[colors.primary, colors.primaryDark, colors.accent]}
          style={styles.background}
        >
          <AdminSkeletonLoader />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.background}
      >
        {/* Header */}
        <BookingsHeader 
          animatedStyle={headerAnimatedStyle}
          onSearch={handleSearch}
        />

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
            {/* Calendar */}
            <BookingsCalendar 
              animatedStyle={contentAnimatedStyle}
              onDateSelect={handleDateSelect}
              bookings={mockBookings}
              selectedDate={selectedDate}
            />

            {/* Today's Bookings */}
            <TodaysBookings 
              animatedStyle={contentAnimatedStyle}
              bookings={todaysBookings}
              onBookingAction={handleBookingAction}
              selectedDate={selectedDate}
            />
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
