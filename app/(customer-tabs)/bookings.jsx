import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import BookingsSkeletonLoader from '../../components/ui/BookingsSkeletonLoader';
import { createSecureFirestoreService } from '../../services/createSecureFirestoreService';

// Section Components
import BookingCard from '../../components/sections/BookingCard';
import BookingsHeader from '../../components/sections/BookingsHeader';
import EmptyBookingsState from '../../components/sections/EmptyBookingsState';

export default function CustomerBookingsScreen() {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const responsive = useResponsive();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo, showSuccess, showWarning, showError } = useToastHelpers();

  // Create secure service with user context
  const secureService = createSecureFirestoreService(user);

  // State management
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);

  // Transform booking data from Firestore format to component format
  const transformBooking = useCallback((booking) => {
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    // Format time
    const formatTime = (timeString) => {
      if (!timeString) return '';
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return {
      id: booking.id,
      bookingId: booking.id.substring(0, 8).toUpperCase() || 'N/A',
      serviceName: booking.serviceName || 'Unknown Service',
      date: formatDate(booking.date) || 'N/A',
      time: formatTime(booking.time) || 'N/A',
      status: booking.status || 'pending',
      price: booking.servicePrice || 0,
      duration: booking.serviceDuration || 0,
      dateRaw: booking.date, // Keep raw date for calculations
      timeRaw: booking.time, // Keep raw time for calculations
    };
  }, []);

  // Categorize bookings
  const categorizeBookings = useCallback((bookings) => {
    const now = new Date();
    
    const upcoming = bookings.filter(booking => {
      if (!booking.dateRaw || !booking.timeRaw) return false;
      const bookingDateTime = new Date(`${booking.dateRaw}T${booking.timeRaw}`);
      const isFuture = bookingDateTime >= now;
      const isUpcomingStatus = ['pending', 'accepted'].includes(booking.status);
      return isFuture && isUpcomingStatus;
    });

    const past = bookings.filter(booking => {
      if (!booking.dateRaw || !booking.timeRaw) return false;
      const bookingDateTime = new Date(`${booking.dateRaw}T${booking.timeRaw}`);
      const isPast = bookingDateTime < now;
      const isPastStatus = ['completed', 'cancelled', 'rejected'].includes(booking.status);
      return isPast || isPastStatus;
    });

    return {
      upcoming,
      past,
      all: bookings
    };
  }, []);

  // Memoized categorized bookings
  const categorizedBookings = useMemo(() => {
    return categorizeBookings(allBookings);
  }, [allBookings, categorizeBookings]);

  // Fetch all user bookings
  const fetchAllUserBookings = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const bookingsData = await secureService.customerOperations.getUserBookings(user.uid);
      
      // Transform Firestore booking data
      const transformedBookings = bookingsData.map(transformBooking);
      
      // Sort by date and time (most recent first)
      transformedBookings.sort((a, b) => {
        const dateA = new Date(`${a.dateRaw}T${a.timeRaw}`);
        const dateB = new Date(`${b.dateRaw}T${b.timeRaw}`);
        return dateB - dateA;
      });
      
      setAllBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      showError('Failed to load bookings', 'Please try again later.');
      setAllBookings([]);
    }
  }, [user?.uid, transformBooking, showError]);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Start animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      fadeAnim.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));

      // Fetch bookings
      fetchAllUserBookings().finally(() => {
        setLoading(false);
      });

      // Check if user is logged in and show toast
      if (!user) {
        showInfo('To access this, please login.');
      }
    }, [user, fetchAllUserBookings, showInfo, fadeAnim, slideUpAnim, headerAnim])
  );

  // Set up real-time listener
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Setting up real-time listener for user bookings...');
    const unsubscribe = secureService.customerOperations.subscribeToUserBookings(
      user.uid,
      (updatedBookings) => {
        try {
          console.log('Real-time bookings update received:', updatedBookings.length);
          
          // Transform Firestore booking data
          const transformedBookings = updatedBookings.map(transformBooking);
          
          // Sort by date and time
          transformedBookings.sort((a, b) => {
            const dateA = new Date(`${a.dateRaw}T${a.timeRaw}`);
            const dateB = new Date(`${b.dateRaw}T${b.timeRaw}`);
            return dateB - dateA;
          });
          
          setAllBookings(transformedBookings);
        } catch (error) {
          console.error('Error processing real-time booking update:', error);
        }
      }
    );

    return () => {
      console.log('Cleaning up bookings subscription...');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, transformBooking]);

  // Filter bookings based on active filter and search query
  const filteredBookings = useMemo(() => {
    let filtered = categorizedBookings[activeFilter] || [];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.date.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [categorizedBookings, activeFilter, searchQuery]);

  // Calculate counts for filter tabs
  const upcomingCount = categorizedBookings.upcoming.length;
  const pastCount = categorizedBookings.past.length;
  const totalCount = categorizedBookings.all.length;

  // Event handlers
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleCheckForAnotherTime = (booking) => {
    console.log('Check for another time clicked for booking:', booking.id);
    
    // Check if booking time is more than 1 hour away
    if (!booking.dateRaw || !booking.timeRaw) {
      showWarning('Invalid booking time');
      return;
    }

    const bookingDateTime = new Date(`${booking.dateRaw}T${booking.timeRaw}`);
    const now = new Date();
    const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      showWarning('You can only change booked time if there are more than 1 hour gap');
      return;
    }

    // TODO: Implement reschedule functionality
    showInfo('Reschedule functionality will be implemented soon');
  };

  const handleRemoveBooking = async (booking) => {
    try {
      await secureService.customerOperations.deleteBooking(booking.id);
      showSuccess('Booking removed successfully');
      // Real-time listener will automatically update the list
    } catch (error) {
      console.error('Error removing booking:', error);
      showError('Failed to remove booking', 'Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllUserBookings();
      showSuccess('Bookings refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      showError('Refresh Failed', 'Failed to refresh bookings. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
      backgroundColor: colors.primary || '#6C2A52',
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
      paddingBottom: Platform.OS === 'ios' ? responsive.responsive.height(12) : responsive.responsive.height(10),
      paddingTop: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      minHeight: '100%',
    },
  });

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Show skeleton loader while loading
  if (loading) {
    return <BookingsSkeletonLoader isLoading={loading} screenType="bookings" />;
  }

  // Show restricted message for guests
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            colors.primary || '#6B46C1',
            colors.primaryDark || '#553C9A', 
            colors.accent || '#EC4899'
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg }]}>
          <Animated.View style={[styles.iconContainer, contentAnimatedStyle]}>
            <Ionicons name="calendar-outline" size={60} color="white" />
          </Animated.View>
          
          <Animated.View style={contentAnimatedStyle}>
            <ThemedText style={[styles.title, { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: spacing.md }]}>
              Access Restricted
            </ThemedText>
            <ThemedText style={[styles.subtitle, { fontSize: 18, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }]}>
              Please login to access your bookings
            </ThemedText>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          colors.primary || '#6B46C1',
          colors.primaryDark || '#553C9A', 
          colors.accent || '#EC4899'
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <Animated.View style={headerAnimatedStyle}>
        <BookingsHeader
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          upcomingCount={upcomingCount}
          pastCount={pastCount}
          totalCount={totalCount}
          fadeAnim={fadeAnim}
          slideUpAnim={slideUpAnim}
        />
      </Animated.View>

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
          {filteredBookings.length === 0 ? (
            <EmptyBookingsState
              filter={activeFilter}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
              fadeAnim={fadeAnim}
              slideUpAnim={slideUpAnim}
            />
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
                shadows={shadows}
                onCheckForAnotherTime={handleCheckForAnotherTime}
                onRemoveBooking={handleRemoveBooking}
                fadeAnim={fadeAnim}
                slideUpAnim={slideUpAnim}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
