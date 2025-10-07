import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useTheme } from '../../contexts/ThemeContext';
import { customerService } from '../../services/firebaseService';
// import { useToastHelpers } from '../../hooks/useToastHelpers';
import { useToastHelpers } from '../../components/ui/ToastSystem';

// Import customer components
import CustomerControls from '../../components/sections/admin/customers/CustomerControls';
import CustomerHeader from '../../components/sections/admin/customers/CustomerHeader';
import CustomerList from '../../components/sections/admin/customers/CustomerList';
import CustomerStats from '../../components/sections/admin/customers/CustomerStats';

export default function AdminCustomersScreen() {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const { showSuccess, showError } = useToastHelpers();

  // Customer management state
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const flatListRef = useRef(null);
  const scrollToTopVisible = useSharedValue(0);

  // Data fetching functions
  const fetchCustomers = useCallback(async (isRefresh = false, isLoadMore = false) => {
    try {
      if (!isRefresh && !isLoadMore) {
        setIsLoading(true);
      }
      if (isLoadMore) {
        setLoadingMore(true);
      }
      setError(null);
      
      let result;
      if (searchQuery.trim()) {
        result = await customerService.searchCustomers(searchQuery, isLoadMore ? lastDoc : null);
      } else {
        result = await customerService.getCustomers(isLoadMore ? lastDoc : null);
      }
      
      const { customers: fetchedCustomers, lastDoc: newLastDoc, hasMore: moreAvailable } = result;
      
      // Transform customer data to match UI expectations
      const transformedCustomers = fetchedCustomers.map(customer => ({
        id: customer.id,
        name: customer.name || 'Unknown Customer',
        email: customer.email || '',
        phone: customer.phone || '',
        profileImage: customer.profileImage || '',
        status: customer.status || 'new',
        totalBookings: customer.totalBookings || 0,
        totalSpent: customer.totalSpent || 0,
        favoriteService: customer.favoriteService || 'N/A',
        lastVisit: customer.lastVisit ? 
          (customer.lastVisit.toDate ? customer.lastVisit.toDate() : new Date(customer.lastVisit)) : 
          null,
        memberSince: customer.createdAt ? 
          (customer.createdAt.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt)) : 
          new Date()
      }));
      
      if (isLoadMore) {
        setCustomers(prev => [...prev, ...transformedCustomers]);
      } else {
        setCustomers(transformedCustomers);
      }
      
      setLastDoc(newLastDoc);
      setHasMore(moreAvailable);
      
      if (isRefresh) {
        showSuccess('Customers refreshed!');
      }
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message || 'Failed to load customers');
      
      if (!isRefresh && !isLoadMore) {
        showError('Failed to Load Customers', error.message || 'Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
      if (isLoadMore) {
        setLoadingMore(false);
      }
    }
  }, [searchQuery, lastDoc, showSuccess, showError]);

  // Load more customers (infinite scroll)
  const loadMoreCustomers = useCallback(() => {
    if (!loadingMore && hasMore && !isSearching) {
      fetchCustomers(false, true);
    }
  }, [loadingMore, hasMore, isSearching, fetchCustomers]);

  // Refresh customers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    await fetchCustomers(true);
  }, [fetchCustomers]);

  // Search customers with debounce
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
    setLastDoc(null);
    setHasMore(true);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [fetchCustomers]);

  // Calculate customer stats
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const newThisMonth = customers.filter(c => {
      const memberDate = new Date(c.memberSince);
      const now = new Date();
      return memberDate.getMonth() === now.getMonth() && memberDate.getFullYear() === now.getFullYear();
    }).length;
    const avgBookings = totalCustomers > 0 ? 
      Math.round(customers.reduce((sum, c) => sum + c.totalBookings, 0) / totalCustomers) : 0;

    return {
      totalCustomers,
      activeCustomers,
      newThisMonth,
      avgBookings
    };
  }, [customers]);

  // Filter and sort customers (client-side filtering for complex filters)
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply additional filters if needed (basic filtering is done server-side)
    switch (selectedFilter) {
      case 'recent':
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        filtered = filtered.filter(customer => 
          customer.lastVisit && new Date(customer.lastVisit) >= recentDate
        );
        break;
      case 'last-visit-7':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(customer => 
          customer.lastVisit && new Date(customer.lastVisit) >= weekAgo
        );
        break;
      case 'last-visit-30':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        filtered = filtered.filter(customer => 
          customer.lastVisit && new Date(customer.lastVisit) >= monthAgo
        );
        break;
      case 'last-visit-90':
        const quarterAgo = new Date();
        quarterAgo.setDate(quarterAgo.getDate() - 90);
        filtered = filtered.filter(customer => 
          customer.lastVisit && new Date(customer.lastVisit) >= quarterAgo
        );
        break;
      case 'bookings-1-2':
        filtered = filtered.filter(customer => 
          customer.totalBookings >= 1 && customer.totalBookings <= 2
        );
        break;
      case 'bookings-3-5':
        filtered = filtered.filter(customer => 
          customer.totalBookings >= 3 && customer.totalBookings <= 5
        );
        break;
      case 'bookings-5+':
        filtered = filtered.filter(customer => customer.totalBookings >= 5);
        break;
      case 'hair':
        filtered = filtered.filter(customer => 
          customer.favoriteService.toLowerCase().includes('hair')
        );
        break;
      case 'nail':
        filtered = filtered.filter(customer => 
          customer.favoriteService.toLowerCase().includes('nail') || 
          customer.favoriteService.toLowerCase().includes('manicure')
        );
        break;
      case 'facial':
        filtered = filtered.filter(customer => 
          customer.favoriteService.toLowerCase().includes('facial')
        );
        break;
      case 'spa':
        filtered = filtered.filter(customer => 
          customer.favoriteService.toLowerCase().includes('spa')
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Sort customers
    return filtered.sort((a, b) => {
      switch (selectedFilter) {
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
        default:
          return new Date(b.memberSince) - new Date(a.memberSince);
      }
    });
  }, [customers, selectedFilter]);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);
  const statsAnim = useSharedValue(30);
  const controlsAnim = useSharedValue(30);
  const listAnim = useSharedValue(30);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useFocusEffect(
    useCallback(() => {
      // Start staggered animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      statsAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
      controlsAnim.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 150 }));
      listAnim.value = withDelay(800, withSpring(0, { damping: 15, stiffness: 150 }));
      
      fadeAnim.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
    }, [fadeAnim, slideUpAnim, headerAnim, statsAnim, controlsAnim, listAnim])
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsAnim.value }],
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlsAnim.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: listAnim.value }],
  }));


  // Event handlers
  const handleCustomerPress = (customer) => {
    console.log('Customer pressed:', customer.name);
  };


  // Scroll to top functionality
  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Show/hide scroll to top button based on scroll position
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 300) {
      scrollToTopVisible.value = withSpring(1);
    } else {
      scrollToTopVisible.value = withSpring(0);
    }
  };

  // Scroll to top button animated style
  const scrollToTopButtonStyle = useAnimatedStyle(() => ({
    opacity: scrollToTopVisible.value,
    transform: [{ scale: scrollToTopVisible.value }],
  }));

  if (isLoading) {
    return <AdminSkeletonLoader isLoading={isLoading} screenType="customers" />;
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
    scrollToTopButton: {
      position: 'absolute',
      bottom: spacing.xl || 20,
      right: spacing.lg || 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    errorContainer: {
      padding: spacing.lg || 20,
      alignItems: 'center',
    },
    errorText: {
      color: colors.error || '#FF6B6B',
      textAlign: 'center',
      marginBottom: spacing.md || 12,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg || 20,
      paddingVertical: spacing.md || 12,
      borderRadius: borderRadius.md || 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    emptyContainer: {
      padding: spacing.xl || 24,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary || '#666',
      textAlign: 'center',
      marginBottom: spacing.lg || 16,
    },
    loadingMoreContainer: {
      padding: spacing.lg || 20,
      alignItems: 'center',
    },
    loadingMoreText: {
      color: colors.textSecondary || '#666',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FlatList
          ref={flatListRef}
          style={styles.content}
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={loadMoreCustomers}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={() => (
            <>
              {/* Header Section */}
              <CustomerHeader 
                animatedStyle={headerAnimatedStyle}
                onSearch={handleSearch}
              />

              {/* Customer Stats */}
              <CustomerStats 
                stats={customerStats}
                animatedStyle={statsAnimatedStyle}
              />

              {/* Search and Filter Controls */}
              <CustomerControls
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                animatedStyle={controlsAnimatedStyle}
              />
            </>
          )}
          ListFooterComponent={() => (
            <>
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ThemedText style={styles.loadingMoreText}>Loading more customers...</ThemedText>
                </View>
              )}
              {!hasMore && filteredCustomers.length > 0 && (
                <View style={styles.loadingMoreContainer}>
                  <ThemedText style={styles.loadingMoreText}>No more customers to load</ThemedText>
                </View>
              )}
            </>
          )}
          renderItem={({ item: customer }) => (
            <CustomerList 
              customers={[customer]}
              animatedStyle={listAnimatedStyle}
              onCustomerPress={handleCustomerPress}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {error ? error : 'No customers found'}
              </ThemedText>
              {error && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchCustomers()}
                >
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing.xl || 20 }}
        />

        {/* Scroll to Top Button */}
        <Animated.View style={[styles.scrollToTopButton, scrollToTopButtonStyle]}>
          <TouchableOpacity onPress={scrollToTop} activeOpacity={0.7}>
            <Ionicons name="chevron-up" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}
