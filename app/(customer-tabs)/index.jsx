import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useToastHelpers } from "../../components/ui/ToastSystem";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { createSecureFirestoreService } from "../../services/createSecureFirestoreService";

// Section Components
import AllServicesGrid from "../../components/sections/AllServicesGrid";
import FeaturedServices from "../../components/sections/FeaturedServices";
import HeroSection from "../../components/sections/HeroSection";
import LocationSection from "../../components/sections/LocationSection";
import TodaysAvailability from "../../components/sections/TodaysAvailability";
import WeekViewSection from "../../components/sections/WeekViewSection";

const { height } = Dimensions.get("window");

// Salon coordinates - Update these with your actual salon location
const SALON_COORDINATES = {
  latitude: 7.44552427675218,
  longitude: 80.34418654232829,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function CustomerHomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo, showWarning, showSuccess, showError } = useToastHelpers();

  // Safe destructuring with fallbacks
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const shadows = theme?.shadows || {};

  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(SALON_COORDINATES);
  const [isToastShowing, setIsToastShowing] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create secure service with user context (memoized to prevent infinite re-renders)
  const secureService = useMemo(() => createSecureFirestoreService(user), [user]);

  // Fetch services from Firestore
  const fetchServices = useCallback(async (isRefresh = false) => {
    try {
      // Check if user is authenticated before fetching services
      if (!user || !user.uid) {
        console.log('🔍 CustomerHome: User not authenticated, skipping service fetch');
        setServices([]);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingServices(true);
      }
      
      console.log('🔍 CustomerHome: Fetching active services...');
      
      const fetchedServices = await secureService.sharedOperations.getActiveServices();
      console.log('📊 CustomerHome: Fetched services:', fetchedServices.length);
      
      // Transform services to match expected format
      const transformedServices = fetchedServices.map(service => ({
        id: service.id,
        name: service.name || 'Service',
        description: service.description || 'Professional service',
        price: service.price || 0,
        duration: service.duration || '30 min',
        category: service.category || { id: 'unknown', name: 'General' },
        color: service.color || colors.primary || '#6C2A52',
        icon: service.icon || 'cut-outline',
        image: service.image || 'https://via.placeholder.com/300x200',
        popular: service.popular || false,
        isActive: service.isActive || true,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        publicId: service.publicId
      }));
      
      setServices(transformedServices);
      console.log('✅ CustomerHome: Services loaded successfully');
      
      // Show success message for refresh
      if (isRefresh) {
        showSuccess('Services Updated', 'Latest services have been loaded successfully.');
      }
    } catch (error) {
      console.error('❌ CustomerHome: Error fetching services:', error);
      showError('Error Loading Services', 'Failed to load services. Please try again.');
      setServices([]);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoadingServices(false);
      }
    }
  }, [secureService, showError, showSuccess, colors.primary, user]);

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle user authentication changes
  useEffect(() => {
    if (!user || !user.uid) {
      console.log('🔍 CustomerHome: User logged out, clearing services');
      setServices([]);
      setIsLoadingServices(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('🔄 CustomerHome: Pull to refresh triggered');
    await fetchServices(true); // Pass true to indicate it's a refresh
  }, [fetchServices]);

  // Create styles with theme values - safe approach
  const styles = React.useMemo(() => {
    const safeColors = colors || {};
    const safeSpacing = spacing || {};
    const safeBorderRadius = borderRadius || {};
    const safeShadows = shadows || {};
    
    return createStyles(safeColors, safeSpacing, safeBorderRadius, safeShadows);
  }, [colors, spacing, borderRadius, shadows]);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const headerAnim = useSharedValue(-100);
  const servicesAnim = useSharedValue(0);
  const promotionsAnim = useSharedValue(0);
  const logoScaleAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(0);
  const buttonSlideAnim = useSharedValue(100);

  // Reset loading state every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      
    // Start animations sequence
    const startAnimations = () => {
      // Logo animation
      logoScaleAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      // Header animation
      headerAnim.value = withSpring(0, { damping: 15, stiffness: 150 });

      // Fade in main content
      fadeAnim.value = withDelay(300, withTiming(1, { duration: 800 }));
      slideUpAnim.value = withDelay(300, withSpring(0, { damping: 15 }));

      // Scale animation for cards
      scaleAnim.value = withDelay(600, withSpring(1, { damping: 12 }));

      // Rotate animation for decorative elements
      rotateAnim.value = withDelay(800, withTiming(360, { duration: 2000 }));

      // Services animation
      servicesAnim.value = withDelay(1000, withTiming(1, { duration: 600 }));

      // Promotions animation
      promotionsAnim.value = withDelay(1200, withTiming(1, { duration: 600 }));

      // Button slide up animation
      buttonSlideAnim.value = withDelay(1400, withSpring(0, { damping: 15 }));
    };

    startAnimations();

    // Hide skeleton loader after animations complete
    const hideSkeleton = setTimeout(() => {
      setIsLoading(false);
      }, 2000);

    return () => clearTimeout(hideSkeleton);
    }, [buttonSlideAnim, fadeAnim, logoScaleAnim, rotateAnim, scaleAnim, slideUpAnim, servicesAnim, promotionsAnim, headerAnim])
  );

  // Animated styles
  const decorativeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  // Featured services for horizontal scroll (filtered from fetched services)
  const featuredServices = useMemo(() => {
    return services.filter(service => service.popular === true);
  }, [services]);

  // Dummy data for today's availability
  const todaySlots = [
    { time: "08:00", available: false },
    { time: "08:30", available: false },
    { time: "09:00", available: true },
    { time: "09:30", available: true },
    { time: "10:00", available: false },
    { time: "10:30", available: false },
    { time: "11:00", available: true },
    { time: "11:30", available: true },
    { time: "12:00", available: true },
    { time: "12:30", available: false },
    { time: "13:00", available: true },
    { time: "13:30", available: true },
    { time: "14:00", available: false },
    { time: "14:30", available: true },
    { time: "15:00", available: false },
    { time: "15:30", available: true },
    { time: "16:00", available: true },
    { time: "16:30", available: true },
    { time: "17:00", available: false },
    { time: "17:30", available: true },
    { time: "18:00", available: true },
    { time: "18:30", available: false },
    { time: "19:00", available: true },
    { time: "19:30", available: false },
  ];


  // Event handlers
  const handleServicePress = (service) => {
    setSelectedService(service);
    // TODO: Navigate to booking screen
  };

  const handleViewAllServices = () => {
    // TODO: Navigate to services screen
  };

  const handleGetDirections = () => {
    try {
      const mapsUrl = "https://maps.app.goo.gl/yewacqHrknxyr7dg6";
      router.push(mapsUrl).catch((err) => {
        console.error("Failed to open maps:", err);
        // Fallback to generic maps search
        const fallbackUrl = "https://maps.google.com/maps?q=salon+near+me";
        router.push(fallbackUrl);
      });
    } catch (error) {
      console.error("Error opening directions:", error);
    }
  };

  const handleCallSalon = () => {
    try {
      const phoneNumber = "tel:0789109693";
      router.push(phoneNumber).catch((err) => {
        console.error("Failed to open phone dialer:", err);
      });
    } catch (error) {
      console.error("Error opening phone dialer:", error);
    }
  };

  const handleResetMapLocation = () => {
    setMapRegion(SALON_COORDINATES);
  };

  const handleTimeSlotPress = (slot) => {
    // Prevent multiple clicks while toast is showing
    if (isToastShowing) {
      return;
    }

    // Set toast showing state
    setIsToastShowing(true);
    
    // Log the time slot selection
    console.log('Time slot selected:', slot);
    
    // Check if user is logged in
    if (!user) {
      showInfo('Login Required', 'Please login first to reserve a time slot');
    } else if (slot.isAvailable) {
      showWarning('Time Slot Reserved', 'This time slot is already reserved, please check for other available times');
    } else {
      showSuccess('Time Slot Available', 'This time slot is available for booking! Click to proceed.');
    }

    // Re-enable clicks after toast duration (3 seconds)
    setTimeout(() => {
      setIsToastShowing(false);
    }, 3000);
  };

  const handleLoginPress = () => {
    router.push('/LoginScreen');
  };

  // Show skeleton loader while loading
  if (isLoading) {
    return <SkeletonLoader isLoading={isLoading} />;
  }

  // Error boundary - if theme is not available, show fallback
  if (!colors || !spacing || !borderRadius) {
    console.warn("Theme not fully loaded, using fallback values");
    return <SkeletonLoader isLoading={true} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Full Screen Background Gradient */}
      <LinearGradient
        colors={[
          colors.primary || "#6B46C1",
          colors.primaryDark || "#553C9A", 
          colors.accent || "#EC4899"
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Fixed Decorative Background Elements */}
      <Animated.View style={[styles.decorativeCircle1, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle3, decorativeAnimatedStyle]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="white"
            colors={["white"]}
            progressBackgroundColor="rgba(255, 255, 255, 0.2)"
            title="Pull to refresh services"
            titleColor="white"
          />
        }
      >
        {/* Hero Section */}
        <HeroSection
          user={user}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onLoginPress={handleLoginPress}
          logoScaleAnim={logoScaleAnim}
          headerAnim={headerAnim}
          fadeAnim={fadeAnim}
          slideUpAnim={slideUpAnim}
          scaleAnim={scaleAnim}
          rotateAnim={rotateAnim}
          buttonSlideAnim={buttonSlideAnim}
        />

        {/* Today's Availability */}
        <TodaysAvailability
          todaySlots={todaySlots}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onTimeSlotPress={handleTimeSlotPress}
          servicesAnim={servicesAnim}
        />

        {/* Featured Services */}
        <FeaturedServices
          featuredServices={featuredServices}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onServicePress={handleServicePress}
          onViewAllServices={handleViewAllServices}
          servicesAnim={servicesAnim}
        />

        {/* All Services Grid */}
        <AllServicesGrid
          services={services}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onServicePress={handleServicePress}
          servicesAnim={servicesAnim}
          isLoading={isLoadingServices}
        />

        {/* Week View Section */}
        <WeekViewSection
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onTimeSlotPress={handleTimeSlotPress}
          onDateSelect={(date) => {
            console.log('Date selected:', date);
            // Update today's availability based on selected date
          }}
          servicesAnim={servicesAnim}
          isToastShowing={isToastShowing}
        />

        {/* Location Section */}
        <LocationSection
          mapRegion={mapRegion}
          salonCoordinates={SALON_COORDINATES}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
          onMapRegionChange={setMapRegion}
          onResetMapLocation={handleResetMapLocation}
          onGetDirections={handleGetDirections}
          onCallSalon={handleCallSalon}
          promotionsAnim={promotionsAnim}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors, spacing, borderRadius, shadows) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary || '#6C2A52',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  // Fixed Decorative Background Elements
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 1,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 300,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2, // Ensure content scrolls above decorative elements
  },
  content: {
    paddingBottom: 100, // Space for bottom tabs
    backgroundColor: 'transparent',
  },
});
