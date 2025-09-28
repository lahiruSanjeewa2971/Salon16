import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';

// Import new components
import ServicesHeader from '../../components/sections/admin/ServicesHeader';
import ServicesStats from '../../components/sections/admin/ServicesStats';
import ServicesControls from '../../components/sections/admin/ServicesControls';
import AddServiceButton from '../../components/sections/admin/AddServiceButton';
import ServiceForm from '../../components/sections/admin/ServiceForm';
import ServiceList from '../../components/sections/admin/ServiceList';

// Mock data for services
const mockServices = [
  {
    id: '1',
    name: 'Hair Cut & Style',
    description: 'Professional haircut with modern styling techniques',
    price: 45,
    duration: 60,
    category: 'Hair',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'cut-outline',
    color: '#6C2A52',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '2',
    name: 'Hair Coloring',
    description: 'Full hair coloring service with premium products',
    price: 85,
    duration: 120,
    category: 'Hair',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'color-palette-outline',
    color: '#D4AF37',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
    popular: false,
  },
  {
    id: '3',
    name: 'Hair Styling',
    description: 'Special occasion styling and blowouts',
    price: 35,
    duration: 45,
    category: 'Hair',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'sparkles-outline',
    color: '#F5E0DC',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '4',
    name: 'Manicure',
    description: 'Professional nail care and polish application',
    price: 25,
    duration: 30,
    category: 'Nails',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'hand-left-outline',
    color: '#FFA500',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop',
    popular: false,
  },
  {
    id: '5',
    name: 'Facial Treatment',
    description: 'Rejuvenating facial treatment with premium skincare',
    price: 65,
    duration: 90,
    category: 'Skincare',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'flower-outline',
    color: '#28A745',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
    popular: true,
  },
  {
    id: '6',
    name: 'Eyebrow Shaping',
    description: 'Professional eyebrow shaping and styling',
    price: 20,
    duration: 30,
    category: 'Beauty',
    isActive: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    icon: 'eye-outline',
    color: '#17A2B8',
    image: 'https://images.unsplash.com/photo-1594736797933-d0d0b0b0b0b0?w=400&h=300&fit=crop',
    popular: false,
  },
];

export default function AdminServicesScreen() {
  const { colors, spacing } = useTheme();
  const { showSuccess } = useToastHelpers();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Start animations
      headerAnim.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
      fadeAnim.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));
      slideUpAnim.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));

      // Hide skeleton loader after animations complete
      const hideSkeleton = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(hideSkeleton);
    }, [fadeAnim, slideUpAnim, headerAnim])
  );

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration - b.duration;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [services, searchQuery, selectedCategory, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalServices = services.length;
    const activeServices = services.filter(s => s.isActive).length;
    const totalRevenue = services.reduce((sum, s) => sum + s.price, 0);
    const avgPrice = totalServices > 0 ? totalRevenue / totalServices : 0;

    return {
      totalServices,
      activeServices,
      totalRevenue,
      avgPrice: Math.round(avgPrice),
    };
  }, [services]);

  // Event handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Services refreshed!');
    }, 1000);
  };

  const handleAddService = () => {
    setShowAddModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = (service) => {
    setServices(prev => prev.filter(s => s.id !== service.id));
  };

  const handleToggleServiceStatus = (service) => {
    setServices(prev =>
      prev.map(s =>
        s.id === service.id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const handleSaveService = (newService) => {
    if (editingService) {
      setServices(prev =>
        prev.map(s => (s.id === editingService.id ? newService : s))
      );
      showSuccess('Service updated successfully!');
    } else {
      setServices(prev => [...prev, newService]);
      showSuccess('Service added successfully!');
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingService(null);
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
    return <AdminSkeletonLoader isLoading={isLoading} screenType="services" />;
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
          colors.primary || '#6B46C1',
          colors.primaryDark || '#553C9A', 
          colors.accent || '#EC4899'
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <ServicesHeader animatedStyle={headerAnimatedStyle} />

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
          <ServicesStats stats={stats} animatedStyle={contentAnimatedStyle} />

          {/* Controls Section */}
          <ServicesControls 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            animatedStyle={contentAnimatedStyle}
          />

          {/* Add Service Button */}
          <AddServiceButton onPress={handleAddService} />

          {/* Services List */}
          <ServiceList
            services={filteredServices}
            fadeAnim={fadeAnim}
            onEditService={handleEditService}
            onDeleteService={handleDeleteService}
            onToggleServiceStatus={handleToggleServiceStatus}
          />
        </ScrollView>
      </View>

      {/* Service Form Modal */}
      <ServiceForm
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        editingService={editingService}
        onClose={handleCloseModal}
        onSave={handleSaveService}
      />
    </SafeAreaView>
  );
}