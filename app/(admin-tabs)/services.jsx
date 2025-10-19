import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue, 
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { createSecureFirestoreService } from '../../services/createSecureFirestoreService';
import { useAuth } from '../../contexts/AuthContext';

// Import new components
import AddServiceButton from '../../components/sections/admin/services/AddServiceButton';
import ServiceForm from '../../components/sections/admin/services/ServiceForm';
import ServiceList from '../../components/sections/admin/services/ServiceList';
import ServicesControls from '../../components/sections/admin/services/ServicesControls';
import ServicesHeader from '../../components/sections/admin/services/ServicesHeader';
import ServicesStats from '../../components/sections/admin/services/ServicesStats';

export default function AdminServicesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  
  // Create secure service with user context
  const secureService = createSecureFirestoreService(user);
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const { showSuccess, showError } = useToastHelpers();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');

  // Firebase data fetching
  const fetchServices = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      const fetchedServices = await secureService.adminOperations.getAllServices();
      
      // Validate and normalize service data
      const validatedServices = fetchedServices.map(service => ({
        id: service.id || `service-${Date.now()}-${Math.random()}`,
        name: service.name || 'Unnamed Service',
        description: service.description || '',
        price: typeof service.price === 'number' ? service.price : 0,
        duration: typeof service.duration === 'number' ? service.duration : 0,
        category: typeof service.category === 'object' && service.category?.name 
          ? service.category.name 
          : service.category || 'Hair', // Handle both object and string formats
        isActive: service.isActive !== false,
        createdAt: service.createdAt?.toDate ? service.createdAt.toDate() : new Date(service.createdAt || new Date()),
        updatedAt: service.updatedAt?.toDate ? service.updatedAt.toDate() : new Date(service.updatedAt || new Date()),
        icon: service.icon || 'star-outline',
        color: service.color || colors.primary,
        image: service.image || '',
        publicId: service.publicId || null,
        popular: service.popular || false,
      }));
      
      setServices(validatedServices);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message || 'Failed to load services');
      
      if (!isRefresh) {
        showError('Failed to Load Services', error.message || 'Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [colors.primary, showError]);

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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
        (service.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => (service.category || '') === selectedCategory);
    }

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          try {
            const dateA = new Date(a.createdAt || new Date());
            const dateB = new Date(b.createdAt || new Date());
            return dateB - dateA; // Latest first
          } catch (error) {
            return 0;
          }
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [services, searchQuery, selectedCategory, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalServices = services.length;
    const activeServices = services.filter(s => s.isActive === true).length;
    const totalRevenue = services.reduce((sum, s) => sum + (s.price || 0), 0);
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
    await fetchServices(true);
    showSuccess('Services refreshed!');
  };

  const handleAddService = () => {
    setShowAddModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = async (service) => {
    try {
      // Optimistic update - remove from local state immediately
      setServices(prev => prev.filter(s => s.id !== service.id));
      
      // Delete from Firebase
      await secureService.adminOperations.deleteService(service.id);
      
      // Delete image from Cloudinary if it exists
      if (service.publicId) {
        try {
          // Note: Cloudinary deletion should ideally be done server-side
          // For now, we'll just log it as the client-side deletion has limitations
          console.log('Service image should be deleted from Cloudinary:', service.publicId);
        } catch (imageError) {
          console.warn('Could not delete image from Cloudinary:', imageError);
          // Don't fail the entire operation if image deletion fails
        }
      }
      
      showSuccess('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      
      // Revert optimistic update on error
      setServices(prev => [...prev, service]);
      
      showError('Delete Failed', 'Failed to delete service. Please try again.');
    }
  };

  const handleToggleServiceStatus = async (service) => {
    try {
      const newStatus = !service.isActive;
      
      // Optimistic update - update local state immediately
      setServices(prev =>
        prev.map(s =>
          s.id === service.id ? { ...s, isActive: newStatus } : s
        )
      );
      
      // Update Firebase
      await secureService.adminOperations.toggleServiceStatus(service.id, newStatus);
      
      showSuccess(`Service ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      
      // Revert optimistic update on error
      setServices(prev =>
        prev.map(s =>
          s.id === service.id ? { ...s, isActive: service.isActive } : s
        )
      );
      
      showError('Update Failed', 'Failed to update service status. Please try again.');
    }
  };

  const handleSaveService = async (savedService) => {
    if (editingService) {
      // Update existing service - preserve original properties and merge with updates
      const updatedService = {
        ...editingService, // Preserve original service properties
        ...savedService,  // Apply updates
        id: editingService.id, // Ensure ID is preserved
        createdAt: editingService.createdAt, // Preserve original creation date
        updatedAt: savedService.updatedAt?.toDate ? savedService.updatedAt.toDate() : new Date(savedService.updatedAt || new Date()),
      };
      
      // Refresh the services list to get the latest data
      await fetchServices();
      showSuccess('Service updated successfully!');
    } else {
      // Ensure the new service has all required properties
      const formattedService = {
        id: savedService.id || `service-${Date.now()}-${Math.random()}`,
        name: savedService.name || 'Unnamed Service',
        description: savedService.description || '',
        price: typeof savedService.price === 'number' ? savedService.price : 0,
        duration: typeof savedService.duration === 'number' ? savedService.duration : 0,
        category: savedService.category || 'Hair',
        isActive: savedService.isActive !== false,
        createdAt: savedService.createdAt?.toDate ? savedService.createdAt.toDate() : new Date(savedService.createdAt || new Date()),
        updatedAt: savedService.updatedAt?.toDate ? savedService.updatedAt.toDate() : new Date(savedService.updatedAt || new Date()),
        icon: savedService.icon || 'star-outline',
        color: savedService.color || colors.primary,
        image: savedService.image || '',
        publicId: savedService.publicId || null,
        popular: savedService.popular || false,
      };
      
      // Refresh the services list to get the latest data
      await fetchServices();
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
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      margin: spacing.lg,
      backgroundColor: colors.error + '10',
      borderRadius: borderRadius.large,
      borderWidth: 1,
      borderColor: colors.error + '30',
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    retryButton: {
      backgroundColor: colors.error,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.medium,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxxl,
      margin: spacing.lg,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    addFirstButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.medium,
    },
    addFirstButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
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
          {error && !isLoading ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                {error}
          </ThemedText>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchServices()}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : filteredServices.length === 0 && !isLoading ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No services match your search criteria' 
                  : 'No services found. Add your first service!'}
          </ThemedText>
              {!searchQuery && selectedCategory === 'all' && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={handleAddService}
                >
                  <ThemedText style={styles.addFirstButtonText}>Add Service</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ServiceList
              services={filteredServices}
              fadeAnim={fadeAnim}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              onToggleServiceStatus={handleToggleServiceStatus}
            />
          )}
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