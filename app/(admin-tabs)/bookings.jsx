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
import { bookingService, salonHoursService } from '../../services/firebaseService';

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
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

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

  // Load bookings for selected date
  const loadBookingsForDate = useCallback(async (date) => {
    setLoadingBookings(true);
    try {
      const bookingsData = await bookingService.getBookingsByDate(date);
      
      // Transform Firestore booking data to match component format
      const transformedBookings = bookingsData.map(booking => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        customer: booking.customerName || 'Unknown Customer',
        service: booking.serviceName || 'Unknown Service',
        price: booking.servicePrice || 0,
        duration: booking.serviceDuration || 0,
        status: booking.status || 'pending',
        customerId: booking.customerId,
        serviceId: booking.serviceId,
      }));
      
      // Sort bookings by time
      transformedBookings.sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      showError('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [showError]);

  // Load initial salon status and bookings for today
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load salon status
        const salonStatus = await salonHoursService.getSalonHours(selectedDate);
        setSelectedDateSalonStatus(salonStatus);
        
        // Load bookings for today
        await loadBookingsForDate(selectedDate);
      } catch (error) {
        console.error('Error loading initial data:', error);
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
        setBookings([]);
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Trigger calendar refresh
    setCalendarRefreshTrigger(prev => prev + 1);
    
    try {
      // Reload salon status and bookings for selected date
      const salonStatus = await salonHoursService.getSalonHours(selectedDate);
      setSelectedDateSalonStatus(salonStatus);
      await loadBookingsForDate(selectedDate);
      showSuccess('Bookings and salon hours refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate, loadBookingsForDate, showSuccess, showError]);

  const handleSearch = () => {
    showSuccess('Search functionality coming soon');
  };

  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
    
    // Load salon status and bookings for the selected date
    try {
      // Load salon status
      const salonStatus = await salonHoursService.getSalonHours(date);
      setSelectedDateSalonStatus(salonStatus);
      
      // Load bookings for selected date
      await loadBookingsForDate(date);
    } catch (error) {
      console.error('Error loading data for selected date:', error);
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
      setBookings([]);
    }
  }, [loadBookingsForDate]);

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
    console.log(`Booking action: ${action} for booking ${bookingId}`);
    
    // Find the booking
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      console.log('Booking details:', {
        id: booking.id,
        customer: booking.customer,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        action: action
      });
    }
    
    // TODO: Implement actual booking actions (accept, reject, delay)
    switch (action) {
      case 'accept':
        console.log('Accept booking:', bookingId);
        // showSuccess(`Booking ${bookingId} accepted`);
        break;
      case 'reject':
        console.log('Reject booking:', bookingId);
        // showError(`Booking ${bookingId} rejected`);
        break;
      case 'delay':
        console.log('Delay booking:', bookingId);
        // showWarning(`Booking ${bookingId} delayed`);
        break;
      default:
        console.log('Unknown action:', action);
    }
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
              bookings={bookings}
              selectedDate={selectedDate}
              refreshTrigger={calendarRefreshTrigger}
            />

            {/* Today's Bookings */}
            <TodaysBookings 
              animatedStyle={contentAnimatedStyle}
              bookings={bookings}
              onBookingAction={handleBookingAction}
              selectedDate={selectedDate}
              salonStatus={selectedDateSalonStatus}
              loading={loadingBookings}
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
