import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMemo, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import BookingsSkeletonLoader from '../../components/ui/BookingsSkeletonLoader';

// Section Components
import BookingCard from '../../components/sections/BookingCard';
import BookingsHeader from '../../components/sections/BookingsHeader';
import EmptyBookingsState from '../../components/sections/EmptyBookingsState';

// Mock data for bookings
const mockBookings = [
  // {
  //   id: '1',
  //   bookingId: 'BK001234',
  //   serviceName: 'Hair Cut & Style',
  //   date: 'Dec 20, 2024',
  //   time: '2:00 PM',
  //   status: 'accepted',
  //   stylist: 'Sarah Johnson',
  //   price: '85',
  //   duration: '60 min',
  //   isReschedulePending: false,
  //   rescheduleCount: 0,
  // },
  {
    id: '2',
    bookingId: 'BK001235',
    serviceName: 'Facial Treatment',
    date: 'Dec 18, 2024',
    time: '10:30 AM',
    status: 'completed',
    stylist: 'Emma Wilson',
    price: '120',
    duration: '90 min',
    isReschedulePending: false,
    rescheduleCount: 0,
  },
  // {
  //   id: '3',
  //   bookingId: 'BK001236',
  //   serviceName: 'Manicure & Pedicure',
  //   date: 'Dec 22, 2024',
  //   time: '3:30 PM',
  //   status: 'pending',
  //   stylist: 'Lisa Brown',
  //   price: '65',
  //   duration: '75 min',
  //   isReschedulePending: false,
  //   rescheduleCount: 0,
  // },
  {
    id: '4',
    bookingId: 'BK001237',
    serviceName: 'Hair Coloring',
    date: 'Dec 15, 2024',
    time: '1:00 PM',
    status: 'cancelled',
    stylist: 'Sarah Johnson',
    price: '150',
    duration: '120 min',
    isReschedulePending: false,
    rescheduleCount: 1,
  },
  // {
  //   id: '5',
  //   bookingId: 'BK001238',
  //   serviceName: 'Eyebrow Shaping',
  //   date: 'Dec 25, 2024',
  //   time: '11:00 AM',
  //   status: 'accepted',
  //   stylist: 'Maria Garcia',
  //   price: '45',
  //   duration: '30 min',
  //   isReschedulePending: false,
  //   rescheduleCount: 0,
  // },
  {
    id: '6',
    bookingId: 'BK001239',
    serviceName: 'Deep Conditioning Treatment',
    date: 'Dec 12, 2024',
    time: '4:00 PM',
    status: 'completed',
    stylist: 'Emma Wilson',
    price: '95',
    duration: '60 min',
    isReschedulePending: false,
    rescheduleCount: 0,
  },
];

export default function CustomerBookingsScreen() {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo, showSuccess, showWarning } = useToastHelpers();

  // State management
  const [bookings, setBookings] = useState(mockBookings);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);

  // Reset loading state every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      
      // Start animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      fadeAnim.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setLoading(false);
      }, 2000);

      // Check if user is logged in and show toast
      if (!user) {
        showInfo('To access this, please login.');
      }

      return () => clearTimeout(hideSkeleton);
    }, [user, showInfo, fadeAnim, slideUpAnim, headerAnim])
  );

  // Filter bookings based on active filter and search query
  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(booking => {
        if (activeFilter === 'upcoming') {
          return ['pending', 'accepted'].includes(booking.status);
        }
        if (activeFilter === 'past') {
          return ['completed', 'cancelled', 'rejected'].includes(booking.status);
        }
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.date.includes(searchQuery) ||
        booking.stylist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [bookings, activeFilter, searchQuery]);

  // Calculate counts for filter tabs
  const upcomingCount = bookings.filter(booking => 
    ['pending', 'accepted'].includes(booking.status)
  ).length;
  
  const pastCount = bookings.filter(booking => 
    ['completed', 'cancelled', 'rejected'].includes(booking.status)
  ).length;
  
  const totalCount = bookings.length;

  // Event handlers
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleReschedule = (booking) => {
    showWarning('Reschedule functionality coming soon!');
  };

  const handleCancel = (booking) => {
    showWarning('Cancel functionality coming soon!');
  };

  const handleViewDetails = (booking) => {
    showInfo(`Viewing details for booking ${booking.bookingId}`);
  };

  const handleBookNow = () => {
    showInfo('Navigate to booking screen');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Bookings refreshed!');
    }, 1000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      paddingBottom: spacing.xxxl,
      paddingTop: spacing.sm,
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
            filteredBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
                shadows={shadows}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
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
