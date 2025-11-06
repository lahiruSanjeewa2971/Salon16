import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminCalendarBottomSheet from '../../components/ui/bottomSheets/AdminCalendarBottomSheet';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { salonHoursService } from '../../services/firebaseService';

// Import new booking components
import BookingsCalendar from '../../components/sections/admin/bookings/BookingsCalendar';
import BookingsHeader from '../../components/sections/admin/bookings/BookingsHeader';
import TodaysBookings from '../../components/sections/admin/bookings/TodaysBookings';

export default function AdminBookingsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const { showSuccess, showError } = useToastHelpers();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [bottomSheetDate, setBottomSheetDate] = useState(null);
  const [salonHoursData, setSalonHoursData] = useState(null);
  const [selectedDateSalonStatus, setSelectedDateSalonStatus] = useState(null);

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

  // Calendar refresh callback
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Load initial salon status for today
  useEffect(() => {
    const loadInitialSalonStatus = async () => {
      try {
        const salonStatus = await salonHoursService.getSalonHours(selectedDate);
        setSelectedDateSalonStatus(salonStatus);
      } catch (error) {
        console.error('Error loading initial salon status:', error);
        // Set default status on error
        const dayOfWeek = new Date(selectedDate).getDay();
        const isTuesday = dayOfWeek === 2;
        setSelectedDateSalonStatus({
          date: selectedDate,
          dayOfWeek: dayOfWeek,
          openTime: '08:30',
          closeTime: '21:00',
          isClosed: isTuesday,
          disableBookings: false,
          isHoliday: false,
          isTuesdayOverride: false,
          notes: '',
          isSpecific: false
        });
      }
    };
    
    loadInitialSalonStatus();
  }, []); // Only run on mount

  // Handlers
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Trigger calendar refresh
    setCalendarRefreshTrigger(prev => prev + 1);
    
    // Shorter delay for better responsiveness
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Bookings and salon hours refreshed');
    }, 500);
  }, [showSuccess]);

  const handleSearch = () => {
    showSuccess('Search functionality coming soon');
  };

  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
    
    // Load salon status for the selected date
    try {
      const salonStatus = await salonHoursService.getSalonHours(date);
      setSelectedDateSalonStatus(salonStatus);
    } catch (error) {
      console.error('Error loading salon status for selected date:', error);
      // Set default status on error
      const dayOfWeek = new Date(date).getDay();
      const isTuesday = dayOfWeek === 2;
      setSelectedDateSalonStatus({
        date: date,
        dayOfWeek: dayOfWeek,
        openTime: '08:30',
        closeTime: '21:00',
        isClosed: isTuesday,
        disableBookings: false,
        isHoliday: false,
        isTuesdayOverride: false,
        notes: '',
        isSpecific: false
      });
    }
  }, []);

  const handleDayLongPress = useCallback((date) => {
    setBottomSheetDate(date);
    // Load existing salon hours for this date
    loadSalonHours(date);
    setIsBottomSheetVisible(true);
    // showSuccess(`Opening booking sheet for ${date}`);
  }, [showSuccess]);

  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(false);
    setBottomSheetDate(null);
    setSalonHoursData(null);
  }, []);

  // Load salon hours for a specific date
  const loadSalonHours = useCallback(async (date) => {
    try {
      const hoursData = await salonHoursService.getSalonHours(date);
      setSalonHoursData(hoursData);
    } catch (error) {
      console.error('Error loading salon hours:', error);
      showError('Failed to load salon hours');
      // Set default hours as fallback
      setSalonHoursData({
        openTime: '08:30',
        closeTime: '21:00',
        isClosed: false,
        disableBookings: false,
        isHoliday: false,
        notes: ''
      });
    }
  }, [showError]);

  // Save salon hours
  const handleSaveSalonHours = useCallback(async (hoursData) => {
    try {
      await salonHoursService.saveSalonHours(hoursData);
      showSuccess('Salon hours saved successfully!');
      setSalonHoursData(hoursData);
      
      // Trigger calendar refresh to show updated salon status
      setCalendarRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving salon hours:', error);
      showError('Failed to save salon hours');
    }
  }, [showSuccess, showError]);

  const handleBookingAction = (bookingId, action) => {
    showSuccess(`${action} booking ${bookingId}`);
  };

  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
      backgroundColor: colors.primary,
    },
    background: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? responsive.responsive.height(12) : responsive.responsive.height(10),
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
              onDayLongPress={handleDayLongPress}
              bookings={mockBookings}
              selectedDate={selectedDate}
              refreshTrigger={calendarRefreshTrigger}
            />

            {/* Today's Bookings */}
            <TodaysBookings 
              animatedStyle={contentAnimatedStyle}
              bookings={todaysBookings}
              onBookingAction={handleBookingAction}
              selectedDate={selectedDate}
              salonStatus={selectedDateSalonStatus}
            />
          </ScrollView>
        </View>

        {/* Service Booking Bottom Sheet */}
        <AdminCalendarBottomSheet
          visible={isBottomSheetVisible}
          selectedDate={bottomSheetDate}
          mode="salon-hours"
          salonHours={salonHoursData}
          onClose={handleCloseBottomSheet}
          onSave={handleSaveSalonHours}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
