import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { ThemedButton } from '../../components/themed/ThemedButton';
import { ThemedInput } from '../../components/themed/ThemedInput';
import AdminSkeletonLoader from '../../components/ui/AdminSkeletonLoader';
import { useToastHelpers } from '../../components/ui/ToastSystem';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

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

const serviceCategories = ['Hair', 'Nails', 'Skincare', 'Beauty', 'Spa'];

export default function AdminServicesScreen() {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useToastHelpers();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // name, price, duration, category

  // Form state for add/edit service
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    image: '',
  });
  const [errors, setErrors] = useState({});

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const headerAnim = useSharedValue(-30);
  const modalAnim = useSharedValue(0);

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
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      image: '',
    });
    setErrors({});
    setShowAddModal(true);
    modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '',
      image: service.image || '',
    });
    setErrors({});
    setShowEditModal(true);
    modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(s => s.id !== service.id));
            showSuccess('Service deleted successfully!');
          },
        },
      ]
    );
  };

  const handleToggleServiceStatus = (service) => {
    setServices(prev =>
      prev.map(s =>
        s.id === service.id ? { ...s, isActive: !s.isActive } : s
      )
    );
    showSuccess(`Service ${service.isActive ? 'deactivated' : 'activated'}!`);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Service Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Service name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Service name must be at least 2 characters';
    }
    
    // Description validation
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Service description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    // Price validation
    if (!formData.price || !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0';
    }
    
    // Duration validation
    if (!formData.duration || !formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration greater than 0';
    }
    
    // Image validation
    if (!formData.image || !formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else {
      // Basic URL validation
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.image.trim())) {
        newErrors.image = 'Please enter a valid image URL';
      }
    }
    
    setErrors(newErrors);
    
    // Show toast for validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      const errorFields = Object.keys(newErrors).join(', ');
      
      showError(
        'Please Check Your Input',
        `${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention: ${errorFields}`,
        { duration: 5000 }
      );
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveService = () => {
    if (!validateForm()) {
      return;
    }

    const newService = {
      id: editingService ? editingService.id : Date.now().toString(),
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      price: parseFloat(formData.price) || 0,
      duration: parseInt(formData.duration) || 0,
      image: formData.image?.trim() || '',
      category: 'Hair', // Default category
      isActive: true, // Default to active
      createdAt: editingService ? editingService.createdAt : new Date(),
      updatedAt: new Date(),
      icon: editingService ? editingService.icon : 'star-outline',
      color: editingService ? editingService.color : colors.primary,
      popular: editingService ? editingService.popular : false,
    };

    console.log('Creating new service:', newService);

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
    modalAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    setTimeout(() => {
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        image: '',
      });
      setErrors({});
    }, 300);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [{ scale: interpolate(modalAnim.value, [0, 1], [0.8, 1]) }],
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
    // Header styles
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingVertical: spacing.sm
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: spacing.lg,
    },
    // Stats section
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.large,
      padding: spacing.md,
      marginHorizontal: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      borderRadius: borderRadius.xl,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    // Controls section
    controlsContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    searchInput: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      marginLeft: spacing.sm,
    },
    filtersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    filterButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.large,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    filterButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.large,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    sortButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginRight: spacing.xs,
    },
    // Add button
    addButtonContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    // Services grid
    servicesGrid: {
      paddingHorizontal: spacing.lg,
    },
    serviceCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
      ...shadows.medium,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    serviceInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    serviceName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    serviceCategory: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    serviceDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    serviceDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: borderRadius.medium,
    },
    servicePrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    serviceDuration: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    serviceStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.small,
      marginRight: spacing.sm,
    },
    statusBadgeActive: {
      backgroundColor: colors.success + '20',
    },
    statusBadgeInactive: {
      backgroundColor: colors.error + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusTextActive: {
      color: colors.success,
    },
    statusTextInactive: {
      color: colors.error,
    },
    serviceActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      alignItems: 'center',
    },
    actionButtonEdit: {
      backgroundColor: colors.primary + '20',
    },
    actionButtonDelete: {
      backgroundColor: colors.error + '20',
    },
    actionButtonToggle: {
      backgroundColor: colors.warning + '20',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    actionButtonTextEdit: {
      color: colors.primary,
    },
    actionButtonTextDelete: {
      color: colors.error,
    },
    actionButtonTextToggle: {
      color: colors.warning,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      width: width * 0.9,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalCloseButton: {
      padding: spacing.sm,
    },
    formGroup: {
      marginBottom: spacing.lg,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    formRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    formRowItem: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      marginHorizontal: spacing.sm,
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
      <Animated.View style={headerAnimatedStyle}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            Services Management
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Manage salon services, pricing, and availability
          </ThemedText>
        </View>
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
          {/* Stats Section */}
          <Animated.View style={contentAnimatedStyle}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{stats.totalServices}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Services</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{stats.activeServices}</ThemedText>
                <ThemedText style={styles.statLabel}>Active</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>${stats.avgPrice}</ThemedText>
                <ThemedText style={styles.statLabel}>Avg Price</ThemedText>
              </View>
            </View>

            {/* Controls Section */}
            <View style={styles.controlsContainer}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search services..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Filters */}
              {/*<View style={styles.filtersRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedCategory === 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedCategory('all')}
                  >
                    <ThemedText style={styles.filterButtonText}>All</ThemedText>
                  </TouchableOpacity>
                  {serviceCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterButton,
                        selectedCategory === category && styles.filterButtonActive
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <ThemedText style={styles.filterButtonText}>{category}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => {
                    const sortOptions = ['name', 'price', 'duration', 'category'];
                    const currentIndex = sortOptions.indexOf(sortBy);
                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                    setSortBy(sortOptions[nextIndex]);
                  }}
                >
                  <ThemedText style={styles.sortButtonText}>
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color="white" />
                </TouchableOpacity>
              </View>*/}
            </View>

            {/* Add Service Button */}
            <View style={styles.addButtonContainer}>
              <ThemedButton
                title="Add New Service"
                onPress={handleAddService}
                variant="primary"
                icon={<Ionicons name="add" size={20} color="white" />}
              />
            </View>

            {/* Services Grid */}
            <View style={styles.servicesGrid}>
              {filteredServices.map((service, index) => (
                <Animated.View
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    {
                      opacity: fadeAnim.value,
                      transform: [
                        {
                          translateY: interpolate(
                            fadeAnim.value,
                            [0, 1],
                            [50 + index * 10, 0],
                            Extrapolate.CLAMP
                          ),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceInfo}>
                      <ThemedText style={styles.serviceName}>
                        {service.name}
                      </ThemedText>
                      <ThemedText style={styles.serviceCategory}>
                        {service.category}
                      </ThemedText>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      service.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
                    ]}>
                      <ThemedText style={[
                        styles.statusText,
                        service.isActive ? styles.statusTextActive : styles.statusTextInactive
                      ]}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.serviceDescription}>
                    {service.description}
                  </ThemedText>

                  <View style={styles.serviceDetails}>
                    <ThemedText style={styles.servicePrice}>
                      ${service.price}
                    </ThemedText>
                    <ThemedText style={styles.serviceDuration}>
                      {service.duration} min
                    </ThemedText>
                  </View>

                  <View style={styles.serviceActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonEdit]}
                      onPress={() => handleEditService(service)}
                    >
                      <ThemedText style={[styles.actionButtonText, styles.actionButtonTextEdit]}>
                        Edit
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonToggle]}
                      onPress={() => handleToggleServiceStatus(service)}
                    >
                      <ThemedText style={[styles.actionButtonText, styles.actionButtonTextToggle]}>
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDelete]}
                      onPress={() => handleDeleteService(service)}
                    >
                      <ThemedText style={[styles.actionButtonText, styles.actionButtonTextDelete]}>
                        Delete
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Add Service Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add New Service</ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Service Name *"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter service name"
                error={errors.name}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Description *"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
                error={errors.description}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Image URL *"
                value={formData.image}
                onChangeText={(text) => handleInputChange('image', text)}
                placeholder="https://example.com/image.jpg"
                keyboardType="url"
                error={errors.image}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Price ($) *"
                  value={formData.price}
                  onChangeText={(text) => handleInputChange('price', text)}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.price}
                />
              </View>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Duration (min) *"
                  value={formData.duration}
                  onChangeText={(text) => handleInputChange('duration', text)}
                  placeholder="30"
                  keyboardType="numeric"
                  error={errors.duration}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <ThemedButton
                title="Cancel"
                onPress={handleCloseModal}
                style={styles.modalButton}
              />
              <ThemedButton
                title="Add Service"
                onPress={handleSaveService}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Service</ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Service Name</ThemedText>
              <ThemedInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter service name"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Description</ThemedText>
              <ThemedInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <ThemedText style={styles.formLabel}>Price ($)</ThemedText>
                <ThemedInput
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formRowItem}>
                <ThemedText style={styles.formLabel}>Duration (min)</ThemedText>
                <ThemedInput
                  value={formData.duration}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                  placeholder="30"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Category</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {serviceCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterButton,
                      formData.category === category && styles.filterButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <ThemedText style={styles.filterButtonText}>{category}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.switchContainer}>
              <ThemedText style={styles.switchLabel}>Active Service</ThemedText>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  formData.isActive && styles.filterButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                <ThemedText style={styles.filterButtonText}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <ThemedButton
                title="Cancel"
                onPress={handleCloseModal}
                style={styles.modalButton}
              />
              <ThemedButton
                title="Update Service"
                onPress={handleSaveService}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
