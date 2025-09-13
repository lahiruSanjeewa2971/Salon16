import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "../../components/ThemedText";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

// Section Components
import HeroSection from "../../components/sections/HeroSection";
import TodaysAvailability from "../../components/sections/TodaysAvailability";
import FeaturedServices from "../../components/sections/FeaturedServices";
import AllServicesGrid from "../../components/sections/AllServicesGrid";
import WeekViewSection from "../../components/sections/WeekViewSection";
import LocationSection from "../../components/sections/LocationSection";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const SERVICE_CARD_WIDTH = (width - 48) / 2;

// Salon coordinates - Update these with your actual salon location
const SALON_COORDINATES = { //7.44552427675218, 80.34418654232829
  latitude: 7.44552427675218, // Replace with your salon's latitude
  longitude: 80.34418654232829, // Replace with your salon's longitude
  latitudeDelta: 0.01, // Zoom level
  longitudeDelta: 0.01, // Zoom level
};

export default function CustomerHomeScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const router = useRouter();

  // Safe destructuring with fallbacks
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const shadows = theme?.shadows || {};
  const user = auth?.user || null;

  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(SALON_COORDINATES);

  // Create styles with theme values - safe approach
  const styles = React.useMemo(() => {
    // Ensure all required theme values exist with fallbacks
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

  useEffect(() => {
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
    }, 2000); // Hide after 2 seconds

    return () => clearTimeout(hideSkeleton);
  }, [buttonSlideAnim, fadeAnim, logoScaleAnim, rotateAnim, scaleAnim, slideUpAnim, servicesAnim, promotionsAnim, headerAnim]);

  // Dummy data for services
  const services = [
    {
      id: 1,
      name: "Haircut & Style",
      price: 45,
      duration: "60 min",
      category: "Hair",
      icon: "cut-outline",
      color: colors.primary || "#6C2A52",
      description: "Professional haircut with styling",
      image:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      rating: 4.9,
      popular: true,
    },
    {
      id: 2,
      name: "Hair Coloring",
      price: 85,
      duration: "120 min",
      category: "Hair",
      icon: "color-palette-outline",
      color: colors.accent || "#D4AF37",
      description: "Full hair coloring service",
      image:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
      rating: 4.8,
      popular: false,
    },
    {
      id: 3,
      name: "Hair Styling",
      price: 35,
      duration: "45 min",
      category: "Hair",
      icon: "sparkles-outline",
      color: colors.secondary || "#F5E0DC",
      description: "Special occasion styling",
      image:
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
      rating: 4.7,
      popular: true,
    },
    {
      id: 4,
      name: "Manicure",
      price: 25,
      duration: "30 min",
      category: "Nails",
      icon: "hand-left-outline",
      color: colors.warning || "#FFA500",
      description: "Professional nail care",
      image:
        "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
      rating: 4.6,
      popular: false,
    },
    {
      id: 5,
      name: "Facial Treatment",
      price: 65,
      duration: "90 min",
      category: "Skincare",
      icon: "flower-outline",
      color: colors.success || "#28A745",
      description: "Rejuvenating facial treatment",
      image:
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
      rating: 4.9,
      popular: true,
    },
    {
      id: 6,
      name: "Eyebrow Shaping",
      price: 20,
      duration: "30 min",
      category: "Beauty",
      icon: "eye-outline",
      color: colors.info || "#17A2B8",
      description: "Professional eyebrow shaping",
      image:
        "https://images.unsplash.com/photo-1594736797933-d0d0b0b0b0b0?w=400&h=300&fit=crop",
      rating: 4.5,
      popular: false,
    },
  ];

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

  // Dummy promotions
  const promotions = [
    {
      id: 1,
      title: "New Client Special",
      description: "20% off your first visit",
      discount: "20%",
      color: colors.success || "#28A745",
      image:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop",
    },
    {
      id: 2,
      title: "Hair + Nails Combo",
      description: "Save $15 on combined services",
      discount: "$15",
      color: colors.accent || "#D4AF37",
      image:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
    },
    {
      id: 3,
      title: "Weekend Special",
      description: "Free consultation on weekends",
      discount: "FREE",
      color: colors.primary || "#6C2A52",
      image:
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=200&fit=crop",
    },
  ];

  // Featured services for horizontal scroll - with safety check
  const featuredServices = Array.isArray(services)
    ? services.filter((service) => service?.popular === true)
    : [];

  // Animated styles - using .value in useAnimatedStyle hooks (correct pattern)
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleAnim.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerAnim.value }],
    opacity: fadeAnim.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }, { scale: scaleAnim.value }],
  }));

  const decorativeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonSlideAnim.value }],
  }));

  const servicesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: servicesAnim.value,
    transform: [
      { translateY: interpolate(servicesAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const promotionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: promotionsAnim.value,
    transform: [
      { translateY: interpolate(promotionsAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const handleServicePress = (service) => {
    setSelectedService(service);
    // TODO: Navigate to booking screen
  };

  const handleQuickBook = () => {
    // TODO: Navigate to quick booking
  };

  const handleViewAllServices = () => {
    // TODO: Navigate to services screen
  };

  const handleGetDirections = () => {
    try {
      const mapsUrl = "https://maps.app.goo.gl/yewacqHrknxyr7dg6";
      Linking.openURL(mapsUrl).catch((err) => {
        console.error("Failed to open maps:", err);
        // Fallback to generic maps search
        const fallbackUrl = "https://maps.google.com/maps?q=salon+near+me";
        Linking.openURL(fallbackUrl);
      });
    } catch (error) {
      console.error("Error opening directions:", error);
    }
  };

  const handleCallSalon = () => {
    try {
      const phoneNumber = "tel:0789109693";
      Linking.openURL(phoneNumber).catch((err) => {
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
    // Check if user is logged in
    if (!user) {
      // Redirect to login screen
      router.push('/LoginScreen');
      return;
    }
    
    // If user is logged in, proceed with booking
    // TODO: Implement booking logic for logged-in users
    console.log('Time slot selected:', slot);
  };

  const handleLoginPress = () => {
    router.push('/LoginScreen');
  };

  // Render functions for FlatList - no hooks inside render functions
  const renderServiceCard = ({ item, index }) => {
    const serviceName = item?.name || "Service";
    const serviceDescription = item?.description || "Professional service";
    const servicePrice = item?.price || 0;
    const serviceDuration = item?.duration || "30 min";
    const serviceRating = item?.rating || "0.0";
    const serviceImage = item?.image || "https://via.placeholder.com/300x200";

    return (
      <Animated.View
        style={[
          styles.serviceCardHorizontal,
          {
            opacity: servicesAnim.value,
            transform: [
              {
                translateY: interpolate(
                  servicesAnim.value,
                  [0, 1],
                  [50 + index * 20, 0],
                  Extrapolate.CLAMP
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.serviceCardTouchable}
          onPress={() => handleServicePress(item)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: serviceImage }} style={styles.serviceImage} />
          {item?.popular && (
            <View style={styles.popularBadge}>
              <ThemedText style={styles.popularBadgeText}>Popular</ThemedText>
            </View>
          )}
          <View style={styles.serviceContent}>
            <View style={styles.serviceHeader}>
              <ThemedText style={styles.serviceName} numberOfLines={1}>
                {serviceName}
              </ThemedText>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <ThemedText style={styles.ratingText}>
                  {serviceRating}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.serviceDescription} numberOfLines={2}>
              {serviceDescription}
            </ThemedText>
            <View style={styles.serviceFooter}>
              <ThemedText
                style={styles.servicePrice}
              >{`$${servicePrice}`}</ThemedText>
              <ThemedText style={styles.serviceDuration}>
                {serviceDuration}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPromotionCard = ({ item, index }) => {
    const promotionTitle = item?.title || "Special Offer";
    const promotionDescription = item?.description || "Limited time offer";
    const promotionDiscount = item?.discount || "OFF";
    const promotionColor = item?.color || colors.primary;
    const promotionImage = item?.image || "https://via.placeholder.com/400x200";

    return (
      <Animated.View
        style={[
          styles.promotionCard,
          {
            opacity: promotionsAnim.value,
            transform: [
              {
                translateY: interpolate(
                  promotionsAnim.value,
                  [0, 1],
                  [50 + index * 20, 0],
                  Extrapolate.CLAMP
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.promotionCardTouchable}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: promotionImage }}
            style={styles.promotionImage}
          />
          <LinearGradient
            colors={[`${promotionColor}20`, `${promotionColor}40`]}
            style={styles.promotionGradient}
          />
          <View style={styles.promotionContent}>
            <ThemedText style={styles.promotionTitle}>
              {promotionTitle}
            </ThemedText>
            <ThemedText style={styles.promotionDescription}>
              {promotionDescription}
            </ThemedText>
            <View
              style={[
                styles.promotionBadge,
                { backgroundColor: promotionColor },
              ]}
            >
              <ThemedText style={styles.promotionBadgeText}>
                {promotionDiscount}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorativeCircle1, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, decorativeAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle3, decorativeAnimatedStyle]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <Animated.View style={[styles.heroHeader, headerAnimatedStyle]}>
          {/* Floating Login Button - Only show for guests */}
          {!user && (
            <TouchableOpacity
              style={styles.floatingLoginButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="white" />
              <ThemedText style={styles.floatingLoginText}>Login</ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.heroContent}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={60} color="white" />
              </View>
            </Animated.View>

            <Animated.View style={[styles.welcomeSection, contentAnimatedStyle]}>
              <ThemedText style={styles.welcomeText}>
                {user ? `Welcome back, ${user?.firstName || "Guest"}! 👋` : "Welcome to Salon 16! 👋"}
              </ThemedText>
              <ThemedText style={styles.welcomeSubtext}>
                {user 
                  ? "Ready to look and feel amazing? Book your next appointment today."
                  : "Explore our services and discover the perfect treatment for you."
                }
              </ThemedText>
            </Animated.View>

            <Animated.View style={[styles.quickActions, buttonAnimatedStyle]}>
              {/* <ThemedButton
                title="Book Now"
                onPress={handleQuickBook}
                variant="secondary"
                size="large"
                style={styles.heroButton}
                icon="calendar-outline"
              /> */}
            </Animated.View>
          </View>
        </Animated.View>

        {/* Today's Availability */}
        <Animated.View style={[styles.section, contentAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="time-outline"
                size={24}
                color="white"
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitleWhite}>
                Today&apos;s Availability
              </ThemedText>
            </View>
            <ThemedText style={styles.sectionSubtitleWhite}>Tap to book</ThemedText>
          </View>
          <View style={styles.availabilityCard}>
            <FlatList
              data={todaySlots || []}
              renderItem={({ item: slot, index }) => {
                const isAvailable = slot?.available === true;
                const timeText = slot?.time || "--:--";

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      isAvailable
                        ? styles.timeSlotAvailable
                        : styles.timeSlotUnavailable,
                    ]}
                    disabled={!isAvailable}
                    activeOpacity={0.8}
                    onPress={() => handleTimeSlotPress(slot)}
                  >
                    <ThemedText
                      style={[
                        styles.timeSlotText,
                        isAvailable
                          ? styles.timeSlotTextAvailable
                          : styles.timeSlotTextUnavailable,
                      ]}
                    >
                      {timeText}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.timeSlotStatus,
                        isAvailable
                          ? styles.timeSlotStatusAvailable
                          : styles.timeSlotStatusUnavailable,
                      ]}
                    >
                      {isAvailable ? "Available" : "Booked"}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsContainer}
              decelerationRate={0.98}
              snapToInterval={112}
              snapToAlignment="start"
              pagingEnabled={false}
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={8}
              getItemLayout={(data, index) => ({
                length: 112,
                offset: 112 * index,
                index,
              })}
            />
          </View>
        </Animated.View>

        {/* Featured Services Horizontal Scroll */}
        <Animated.View style={[styles.section, servicesAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitleWhite}>
              Featured Services
            </ThemedText>
            <TouchableOpacity
              style={styles.seeAllButtonWhite}
              onPress={handleViewAllServices}
            >
              <ThemedText style={styles.seeAllTextWhite}>See All</ThemedText>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredServices || []}
            renderItem={renderServiceCard}
            keyExtractor={(item, index) =>
              item?.id?.toString() || index.toString()
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            decelerationRate="fast"
            snapToInterval={SERVICE_CARD_WIDTH + 16}
            snapToAlignment="start"
          />
        </Animated.View>

        {/* All Services Grid */}
        <Animated.View style={[styles.section, servicesAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitleWhite}>All Services</ThemedText>
          </View>
          <View style={styles.servicesGrid}>
            {(services || []).map((service, index) => {
              const serviceName = service?.name || "Service";
              const serviceDescription =
                service?.description || "Professional service";
              const servicePrice = service?.price || 0;
              const serviceDuration = service?.duration || "30 min";
              const serviceRating = service?.rating || "0.0";
              const serviceImage =
                service?.image || "https://via.placeholder.com/300x200";

              return (
                <Animated.View
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    {
                      opacity: servicesAnim.value,
                      transform: [
                        {
                          translateY: interpolate(
                            servicesAnim.value,
                            [0, 1],
                            [50 + index * 10, 0],
                            Extrapolate.CLAMP
                          ),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.serviceCardTouchable}
                    onPress={() => handleServicePress(service)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: serviceImage }}
                      style={styles.serviceImage}
                    />
                    {service?.popular && (
                      <View style={styles.popularBadge}>
                        <ThemedText style={styles.popularBadgeText}>
                          Popular
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.serviceContent}>
                      <View style={styles.serviceHeader}>
                        <ThemedText
                          style={styles.serviceName}
                          numberOfLines={1}
                        >
                          {serviceName}
                        </ThemedText>
                        <View style={styles.ratingContainer}>
                          <Ionicons
                            name="star"
                            size={12}
                            color={colors.warning}
                          />
                          <ThemedText style={styles.ratingText}>
                            {serviceRating}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText
                        style={styles.serviceDescription}
                        numberOfLines={2}
                      >
                        {serviceDescription}
                      </ThemedText>
                      <View style={styles.serviceFooter}>
                        <ThemedText
                          style={styles.servicePrice}
                        >{`$${servicePrice}`}</ThemedText>
                        <ThemedText style={styles.serviceDuration}>
                          {serviceDuration}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Week View with Availability Heatmap */}
        {/* <Animated.View style={[styles.section, servicesAnimatedStyle]}>
          <WeekView 
            onTimeSlotPress={handleTimeSlotPress}
            onDateSelect={(date) => {
              console.log('Date selected:', date);
              // Update today's availability based on selected date
            }}
          />
        </Animated.View> */}

        {/* Location Section */}
        <Animated.View style={[styles.section, promotionsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitleWhite}>Our Location</ThemedText>
            <Ionicons name="location-outline" size={20} color="white" />
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationMapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                mapType="standard"
              >
                <Marker
                  coordinate={{
                    latitude: SALON_COORDINATES.latitude,
                    longitude: SALON_COORDINATES.longitude,
                  }}
                  title="Salon 16"
                  description="Visit us for the best salon services"
                  pinColor={colors.primary || "#6C2A52"}
                />
              </MapView>
              
              {/* Reset Location Button */}
              <TouchableOpacity
                style={styles.resetLocationButton}
                onPress={handleResetMapLocation}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="locate-outline"
                  size={20}
                  color="white"
                />
                <ThemedText style={styles.resetLocationText}>
                  Reset to Salon
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.locationContent}>
              <View style={styles.locationInfo}>
                <View style={styles.locationAddress}>
                  <Ionicons
                    name="location"
                    size={16}
                    color="white"
                  />
                  <ThemedText style={styles.locationAddressText}>
                    Salon 16, Malpitiya, Boyagane
                  </ThemedText>
                </View>
                <View style={styles.locationHours}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="white"
                  />
                  <View style={styles.hoursContainer}>
                    <ThemedText style={styles.hoursText}>
                      Mon, Wed-Sun: 8:30 AM - 8:00 PM
                    </ThemedText>
                    <ThemedText style={styles.hoursText}>
                      Tuesday: Closed
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.locationContact}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color="white"
                  />
                  <ThemedText style={styles.contactText}>
                    0789109693
                  </ThemedText>
                </View>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleGetDirections}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color="white"
                  />
                  <ThemedText style={styles.locationButtonText}>
                    Get Directions
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleCallSalon}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="call"
                    size={16}
                    color="white"
                  />
                  <ThemedText style={styles.locationButtonText}>
                    Call Now
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
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
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: height * 0.3,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100, // Space for bottom tabs
    backgroundColor: 'transparent',
  },
  heroHeader: {
    height: 400,
    position: "relative",
    marginBottom: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingLoginButton: {
    position: "absolute",
    top: spacing.xl || 20,
    right: spacing.lg || 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: spacing.md || 16,
    paddingVertical: spacing.sm || 8,
    borderRadius: borderRadius.medium || 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  floatingLoginText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
    marginLeft: spacing.xs || 4,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: spacing.md,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 38,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 26,
    textAlign: "center",
    fontWeight: "300",
  },
  heroButton: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  section: {
    marginBottom: spacing.xxl,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: spacing.sm || 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: colors.text || "#333333",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary || "#666666",
    fontStyle: "italic",
  },
  sectionTitleWhite: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitleWhite: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: "italic",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.primary || "#6C2A52",
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  seeAllButtonWhite: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  seeAllTextWhite: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  availabilityCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    // backgroundColor: "transparent",
    borderRadius: borderRadius.large || 16,
    padding: spacing.lg || 20,
    marginHorizontal: spacing.lg || 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    ...shadows.medium,
  },
  timeSlotsContainer: {
    paddingHorizontal: spacing.sm || 8,
  },
  timeSlot: {
    paddingHorizontal: spacing.lg || 20,
    paddingVertical: spacing.md || 16,
    marginRight: spacing.md || 12,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotAvailable: {
    // No background or border for available slots
  },
  timeSlotUnavailable: {
    // No background or border for unavailable slots
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeSlotTextAvailable: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeSlotTextUnavailable: {
    color: "rgba(255, 255, 255, 0.7)",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  timeSlotStatus: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: spacing.xs || 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeSlotStatusAvailable: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  timeSlotStatusUnavailable: {
    color: "rgba(255, 255, 255, 0.6)",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  servicesContainer: {
    paddingHorizontal: spacing.lg,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    marginBottom: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    ...shadows.medium,
  },
  serviceCardHorizontal: {
    width: SERVICE_CARD_WIDTH,
    marginRight: spacing.md || 12,
    marginBottom: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    ...shadows.medium,
  },
  serviceCardTouchable: {
    flex: 1,
  },
  serviceImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.background,
  },
  popularBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  serviceContent: {
    padding: spacing.md,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    flex: 1,
    marginRight: spacing.xs,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  serviceDuration: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
  },
  quickActionsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    ...shadows.medium,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActionsButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
  },
  promotionCard: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    ...shadows.medium,
  },
  locationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    ...shadows.medium,
  },
  locationMapContainer: {
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: borderRadius.medium || 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  resetLocationButton: {
    position: "absolute",
    top: spacing.md || 12,
    right: spacing.md || 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm || 12,
    paddingVertical: spacing.xs || 8,
    borderRadius: borderRadius.medium || 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetLocationText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
    marginLeft: spacing.xs || 4,
  },
  locationContent: {
    padding: spacing.lg || 20,
  },
  locationInfo: {
    marginBottom: spacing.lg || 20,
  },
  locationAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md || 12,
  },
  locationAddressText: {
    fontSize: 16,
    color: "white",
    marginLeft: spacing.sm || 8,
    fontWeight: "600",
  },
  locationHours: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md || 12,
  },
  hoursContainer: {
    marginLeft: spacing.sm || 8,
    flex: 1,
  },
  hoursText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: spacing.xs || 4,
    lineHeight: 20,
  },
  locationContact: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 16,
    color: "white",
    marginLeft: spacing.sm || 8,
    fontWeight: "600",
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: spacing.md || 12,
    paddingHorizontal: spacing.lg || 16,
    borderRadius: borderRadius.medium || 12,
    marginHorizontal: spacing.xs || 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  locationButtonText: {
    fontSize: 14,
    color: "white",
    marginLeft: spacing.xs || 4,
    fontWeight: "600",
  },
  promotionCardTouchable: {
    flex: 1,
  },
  promotionImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.background,
  },
  promotionGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  promotionContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  promotionDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: spacing.sm,
  },
  promotionBadge: {
    alignSelf: "flex-start",
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  promotionBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
});
