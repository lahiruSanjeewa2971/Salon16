import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

// Import customer components
import CustomerHeader from '../../components/sections/admin/customers/CustomerHeader';
import CustomerStats from '../../components/sections/admin/customers/CustomerStats';
import CustomerControls from '../../components/sections/admin/customers/CustomerControls';
import CustomerList from '../../components/sections/admin/customers/CustomerList';

export default function AdminCustomersScreen() {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const [isLoading, setIsLoading] = useState(true);

  // Customer management state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock customer data
  const mockCustomers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@email.com',
      status: 'active',
      totalBookings: 8,
      totalSpent: 450,
      favoriteService: 'Hair Cut',
      lastVisit: '2024-10-01',
      memberSince: '2024-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      status: 'active',
      totalBookings: 12,
      totalSpent: 680,
      favoriteService: 'Hair Color',
      lastVisit: '2024-09-28',
      memberSince: '2023-11-20'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob.johnson@email.com',
      status: 'inactive',
      totalBookings: 3,
      totalSpent: 150,
      favoriteService: 'Manicure',
      lastVisit: '2024-08-15',
      memberSince: '2024-06-10'
    },
    {
      id: '4',
      name: 'Alice Brown',
      email: 'alice.brown@email.com',
      status: 'new',
      totalBookings: 1,
      totalSpent: 60,
      favoriteService: 'Facial',
      lastVisit: '2024-10-03',
      memberSince: '2024-10-03'
    },
    {
      id: '5',
      name: 'Charlie Wilson',
      email: 'charlie.wilson@email.com',
      status: 'active',
      totalBookings: 15,
      totalSpent: 920,
      favoriteService: 'Spa Treatment',
      lastVisit: '2024-09-30',
      memberSince: '2023-08-05'
    }
  ];

  // Mock customer stats
  const customerStats = {
    totalCustomers: mockCustomers.length,
    activeCustomers: mockCustomers.filter(c => c.status === 'active').length,
    newThisMonth: mockCustomers.filter(c => {
      const memberDate = new Date(c.memberSince);
      const now = new Date();
      return memberDate.getMonth() === now.getMonth() && memberDate.getFullYear() === now.getFullYear();
    }).length,
    avgBookings: Math.round(mockCustomers.reduce((sum, c) => sum + c.totalBookings, 0) / mockCustomers.length)
  };

  // Filter customers based on search and filter criteria
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'recent':
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        return new Date(customer.lastVisit) >= recentDate;
      case 'a-z':
        return true; // Already sorted by name
      case 'last-visit-7':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(customer.lastVisit) >= weekAgo;
      case 'last-visit-30':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return new Date(customer.lastVisit) >= monthAgo;
      case 'last-visit-90':
        const quarterAgo = new Date();
        quarterAgo.setDate(quarterAgo.getDate() - 90);
        return new Date(customer.lastVisit) >= quarterAgo;
      case 'bookings-1-2':
        return customer.totalBookings >= 1 && customer.totalBookings <= 2;
      case 'bookings-3-5':
        return customer.totalBookings >= 3 && customer.totalBookings <= 5;
      case 'bookings-5+':
        return customer.totalBookings >= 5;
      case 'hair':
        return customer.favoriteService.toLowerCase().includes('hair');
      case 'nail':
        return customer.favoriteService.toLowerCase().includes('nail') || 
               customer.favoriteService.toLowerCase().includes('manicure');
      case 'facial':
        return customer.favoriteService.toLowerCase().includes('facial');
      case 'spa':
        return customer.favoriteService.toLowerCase().includes('spa');
      default:
        return true;
    }
  });

  // Sort customers by name for A-Z filter
  const sortedCustomers = selectedFilter === 'a-z' 
    ? [...filteredCustomers].sort((a, b) => a.name.localeCompare(b.name))
    : filteredCustomers;

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);
  const statsAnim = useSharedValue(30);
  const controlsAnim = useSharedValue(30);
  const listAnim = useSharedValue(30);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Start staggered animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      statsAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
      controlsAnim.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 150 }));
      listAnim.value = withDelay(800, withSpring(0, { damping: 15, stiffness: 150 }));
      
      fadeAnim.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(hideSkeleton);
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

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  // Event handlers
  const handleSearch = () => {
    console.log('Search customers:', searchQuery);
  };

  const handleCustomerPress = (customer) => {
    console.log('Customer pressed:', customer.name);
  };

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
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
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

          {/* Customer List */}
          <CustomerList
            customers={sortedCustomers}
            animatedStyle={listAnimatedStyle}
            onCustomerPress={handleCustomerPress}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
