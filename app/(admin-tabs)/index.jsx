import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { bookingService, serviceService, firestoreService } from '../../services/firebaseService';

// Import dashboard components
import CategoryForm from '../../components/sections/admin/categories/CategoryForm';
import CategoryManager from '../../components/sections/admin/categories/CategoryManager';
import DashboardHeader from '../../components/sections/admin/dashboard/DashboardHeader';
import DashboardStats from '../../components/sections/admin/dashboard/DashboardStats';
import QuickActions from '../../components/sections/admin/dashboard/QuickActions';
import TodaysSchedule from '../../components/sections/admin/dashboard/TodaysSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { createSecureFirestoreService } from '../../services/createSecureFirestoreService';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const { user } = useAuth();
  
  // Create secure service with user context (memoized to prevent recreation on every render)
  const secureService = useMemo(() => createSecureFirestoreService(user), [user]);
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  
  const { showSuccess, showError } = useToastHelpers();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const categorySectionRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Load today's bookings
  const loadTodayBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookingsData = await bookingService.getBookingsByDate(today);
      
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
      
      console.log("transformedBookings :", transformedBookings)
      setTodayBookings(transformedBookings);
    } catch (error) {
      console.error('Error loading today\'s bookings:', error);
      showError('Failed to load today\'s bookings');
      setTodayBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [showError]);

  // Load all bookings (for total bookings count)
  const loadAllBookings = useCallback(async () => {
    try {
      // Query all bookings without date filter
      const bookingsData = await firestoreService.query('bookings', []);
      setAllBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading all bookings:', error);
      setAllBookings([]);
    }
  }, []);

  // Load active services (for active services count)
  const loadActiveServices = useCallback(async () => {
    try {
      const services = await secureService.sharedOperations.getActiveServices();
      setActiveServices(services || []);
    } catch (error) {
      console.error('Error loading active services:', error);
      setActiveServices([]);
    }
  }, [secureService]);

  // Calculate dashboard stats from real data
  const calculateStats = useCallback(() => {
    // Use todayBookings state if available (more accurate), otherwise filter from allBookings
    const today = new Date().toISOString().split('T')[0];
    const todayBookingsForStats = todayBookings.length > 0 
      ? todayBookings 
      : allBookings.filter(booking => booking.date === today);
    
    // Calculate stats
    const stats = {
      totalBookings: allBookings.length,
      pendingBookings: todayBookingsForStats.filter(b => b.status === 'pending').length,
      todayRevenue: todayBookingsForStats.reduce((sum, booking) => {
        return sum + (parseFloat(booking.price || booking.servicePrice) || 0);
      }, 0),
      activeServices: activeServices.length,
    };
    
    return stats;
  }, [allBookings, activeServices, todayBookings]);

  // Memoized stats
  const dashboardStats = useMemo(() => calculateStats(), [calculateStats]);

  // Load today's bookings on component mount
  useEffect(() => {
    loadTodayBookings();
  }, [loadTodayBookings]);

  // Load initial stats data
  useEffect(() => {
    const loadInitialStats = async () => {
      setLoadingStats(true);
      try {
        await Promise.all([
          loadAllBookings(),
          loadActiveServices()
        ]);
      } catch (error) {
        console.error('Error loading initial stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadInitialStats();
  }, [loadAllBookings, loadActiveServices]);

  // Fetch all categories from Firebase (for admin panel)
  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching all categories from Firebase (admin)...');
      const fetchedCategories = await secureService.adminOperations.getAllCategories();
      
      // Fetch services to count per category
      const services = await secureService.sharedOperations.getActiveServices();
      
      // Convert Firestore timestamps to Date objects and calculate serviceCount
      const validatedCategories = fetchedCategories.map(category => {
        const serviceCount = services.filter(service => {
          // Handle both old (string) and new (object) category formats
          if (typeof service.category === 'object' && service.category?.id) {
            return service.category.id === category.id;
          } else if (typeof service.category === 'string') {
            return service.category === category.name;
          }
          return false;
        }).length;
        
        return {
          ...category,
          createdAt: category.createdAt?.toDate ? category.createdAt.toDate() : new Date(category.createdAt || new Date()),
          updatedAt: category.updatedAt?.toDate ? category.updatedAt.toDate() : new Date(category.updatedAt || new Date()),
          serviceCount,
          isActive: category.isActive !== undefined ? category.isActive : true, // Ensure isActive field exists
        };
      });
      
      console.log('All categories fetched successfully:', validatedCategories.length);
      setCategories(validatedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Fetch Failed', 'Failed to load categories. Please try again.');
    }
  }, [showError]);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Set up real-time subscription for all categories
  useEffect(() => {
    console.log('Setting up real-time subscription for all categories (admin)...');
    const unsubscribe = secureService.adminOperations.subscribeToCategories(async (updatedCategories) => {
      try {
        console.log('Real-time categories update received:', updatedCategories.length);
        
        // Fetch services to count per category
        const services = await secureService.sharedOperations.getActiveServices();
        
        // Convert Firestore timestamps to Date objects and calculate serviceCount
        const validatedCategories = updatedCategories.map(category => {
          const serviceCount = services.filter(service => {
            // Handle both old (string) and new (object) category formats
            if (typeof service.category === 'object' && service.category?.id) {
              return service.category.id === category.id;
            } else if (typeof service.category === 'string') {
              return service.category === category.name;
            }
            return false;
          }).length;
          
          return {
            ...category,
            createdAt: category.createdAt?.toDate ? category.createdAt.toDate() : new Date(category.createdAt || new Date()),
            updatedAt: category.updatedAt?.toDate ? category.updatedAt.toDate() : new Date(category.updatedAt || new Date()),
            serviceCount,
            isActive: category.isActive !== undefined ? category.isActive : true, // Ensure isActive field exists
          };
        });
        
        setCategories(validatedCategories);
      } catch (error) {
        console.error('Error calculating service counts in real-time update:', error);
        // Fallback to categories without service counts
        try {
          const validatedCategories = updatedCategories.map(category => ({
            ...category,
            createdAt: category.createdAt?.toDate ? category.createdAt.toDate() : new Date(category.createdAt || new Date()),
            updatedAt: category.updatedAt?.toDate ? category.updatedAt.toDate() : new Date(category.updatedAt || new Date()),
            serviceCount: 0,
            isActive: category.isActive !== undefined ? category.isActive : true,
          }));
          setCategories(validatedCategories);
        } catch (fallbackError) {
          console.error('Error in fallback category processing:', fallbackError);
          // Set empty array as last resort
          setCategories([]);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up categories subscription...');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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

  // Set up real-time listener for all bookings (for stats)
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time listener for all bookings (stats)...');
    
    const unsubscribe = firestoreService.listen('bookings', [], (updatedBookings) => {
      console.log('Real-time update received for all bookings:', updatedBookings.length);
      setAllBookings(updatedBookings || []);
    });

    return () => {
      console.log('Cleaning up all bookings subscription...');
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Set up real-time listener for today's bookings
  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    console.log('Setting up real-time listener for today\'s bookings:', today);
    
    const unsubscribe = secureService.adminOperations.subscribeToBookingsByDate(
      today,
      (updatedBookings) => {
        console.log('Real-time update received for today\'s bookings:', updatedBookings.length);
        
        // Transform Firestore booking data to match component format
        const transformedBookings = updatedBookings.map(booking => ({
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
        
        setTodayBookings(transformedBookings);
      }
    );

    return () => {
      console.log('Cleaning up today\'s bookings subscription...');
      if (unsubscribe) unsubscribe();
    };
  }, [user, secureService]);

  // Set up real-time listener for active services
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time listener for active services...');
    
    const unsubscribe = firestoreService.listen('services', 
      [{ field: 'isActive', operator: '==', value: true }],
      (updatedServices) => {
        console.log('Real-time update received for active services:', updatedServices.length);
        setActiveServices(updatedServices || []);
      }
    );

    return () => {
      console.log('Cleaning up active services subscription...');
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing dashboard data...');
      await Promise.all([
        fetchCategories(),
        loadTodayBookings(),
        loadAllBookings(),
        loadActiveServices()
      ]);
      console.log('Dashboard refreshed successfully');
      showSuccess('Dashboard refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      showError('Refresh Failed', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories, loadTodayBookings, loadAllBookings, loadActiveServices, showError, showSuccess]);

  const handleViewBooking = (booking) => {
    showSuccess(`Viewing booking: ${booking.service} for ${booking.customer}`);
  };

  const handleAddService = () => {
    router.push('/(admin-tabs)/services');
  };

  const handleNewBooking = () => {
    router.push('/(admin-tabs)/bookings');
  };

  const handleViewCustomers = () => {
    router.push('/(admin-tabs)/customers');
  };

  const handleManageCategories = () => {
    if (scrollViewRef.current) {
      // Calculate approximate scroll position for Category Management section
      // Based on typical section heights: Stats (~200px) + Schedule (~300px) + Quick Actions (~200px) = ~700px
      scrollViewRef.current.scrollTo({
        y: 700, // Approximate position of Category Management section
        animated: true,
      });
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    console.log('Edit category clicked:', category);
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleToggleCategoryStatus = async (category) => {
    try {
      const newStatus = !category.isActive;
      
      // Update Firebase - real-time subscription will handle UI update
      const result = await secureService.adminOperations.toggleCategoryStatus(category.id, newStatus);
      
      // Show appropriate success message based on result
      if (result && result.message) {
        showSuccess(result.message);
      } else {
        showSuccess(`Category ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      showError('Update Failed', 'Failed to update category status. Please try again.');
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      // Delete from Firebase - real-time subscription will handle UI update
      await secureService.adminOperations.deleteCategory(category.id);
      
      showSuccess('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Delete Failed', 'Failed to delete category. Please try again.');
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (savedCategory) => {
    // CategoryForm already handles the Firebase creation/update and success toast
    // The real-time subscription will automatically update the list
    console.log('Category saved:', savedCategory);
    handleCloseCategoryModal();
  };

  // Add null safety for all props passed to components
  const safeStats = dashboardStats || {
    totalBookings: 0,
    pendingBookings: 0,
    todayRevenue: 0,
    activeServices: 0,
  };

  const safeCategories = categories || [];

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
      ...responsive.containerStyles.fullScreen,
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
      paddingBottom: Platform.OS === 'ios' ? responsive.responsive.height(12) : responsive.responsive.height(10),
      paddingTop: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
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
          ref={scrollViewRef}
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
          <DashboardStats stats={safeStats} animatedStyle={contentAnimatedStyle} />

          {/* Today's Schedule */}
          <TodaysSchedule 
            bookings={todayBookings}
            loading={loadingBookings}
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
          <View ref={categorySectionRef}>
            <CategoryManager 
              categories={safeCategories}
              animatedStyle={contentAnimatedStyle}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onToggleCategoryStatus={handleToggleCategoryStatus}
              onDeleteCategory={handleDeleteCategory}
            />
          </View>
        </ScrollView>
      </View>

      {/* Category Form Modal */}
      <CategoryForm
        showModal={showCategoryModal}
        editingCategory={editingCategory}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
      />
    </SafeAreaView>
  );
}
