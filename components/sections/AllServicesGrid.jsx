import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import ServiceBookingBottomSheet from '../ui/ServiceBookingBottomSheet';

const { width } = Dimensions.get('window');
const SERVICE_CARD_WIDTH = (width - 48) / 2;

const AllServicesGrid = ({ 
  services, 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onServicePress,
  isLoading = false,
  // Animation values
  servicesAnim,
}) => {
  // Animated styles
  const servicesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: servicesAnim.value,
    transform: [
      { translateY: interpolate(servicesAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  // Bottom sheet state
  const [selectedService, setSelectedService] = useState(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  // Handle service booking
  const handleBookNow = (service) => {
    setSelectedService(service);
    setIsBottomSheetVisible(true);
  };

  // Handle bottom sheet close
  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedService(null);
  };

  // Loading state component
  const renderLoadingState = () => (
    <Animated.View style={[styles.section, servicesAnimatedStyle]}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitleWhite}>All Services</ThemedText>
      </View>
      <View style={styles.servicesGrid}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.loadingCard}>
            <View style={styles.loadingImage} />
            <View style={styles.loadingContent}>
              <View style={styles.loadingTitle} />
              <View style={styles.loadingDescription} />
              <View style={styles.loadingFooter}>
                <View style={styles.loadingPrice} />
                <View style={styles.loadingDuration} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <Animated.View style={[styles.section, servicesAnimatedStyle]}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitleWhite}>All Services</ThemedText>
      </View>
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <View style={styles.emptyStateIcon}>
            <Ionicons 
              name="cut-outline" 
              size={48} 
              color="rgba(255, 255, 255, 0.6)" 
            />
          </View>
          <ThemedText style={styles.emptyStateTitle}>
            No Services Available
          </ThemedText>
          <ThemedText style={styles.emptyStateDescription}>
            We're currently updating our service offerings. Please check back soon!
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );

  // Show loading state
  if (isLoading) {
    return renderLoadingState();
  }

  // Show empty state if no services
  if (!services || services.length === 0) {
    return renderEmptyState();
  }

  return (
    <Animated.View style={[styles.section, servicesAnimatedStyle]}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitleWhite}>All Services</ThemedText>
      </View>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => {
          const serviceName = service?.name || "Service";
          const serviceDescription = service?.description || "Professional service";
          const servicePrice = service?.price || 0;
          const serviceDuration = service?.duration || "30 min";
          const serviceImage = service?.image || "https://via.placeholder.com/300x200";
          const categoryName = service?.category?.name || "General";
          const categoryColor = service?.color || colors.primary || "#6C2A52";

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
              <View style={styles.serviceCardTouchable}>
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
                <View style={styles.categoryBadge}>
                  <ThemedText style={styles.categoryBadgeText}>
                    {categoryName}
                  </ThemedText>
                </View>
                <View style={styles.serviceContent}>
                  <View>
                    <View style={styles.serviceHeader}>
                      <ThemedText
                        style={styles.serviceName}
                        numberOfLines={1}
                      >
                        {serviceName}
                      </ThemedText>
                      <View style={styles.durationContainer}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                        <ThemedText style={styles.durationText}>
                          {serviceDuration}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      style={styles.serviceDescription}
                      numberOfLines={2}
                    >
                      {serviceDescription}
                    </ThemedText>
                  </View>
                  <View style={styles.serviceFooter}>
                    <ThemedText
                      style={styles.servicePrice}
                    >{`$${servicePrice}`}</ThemedText>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => handleBookNow(service)}
                      activeOpacity={0.8}
                    >
                      <ThemedText style={styles.bookButtonText}>
                        Book Now
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Service Booking Bottom Sheet */}
      <ServiceBookingBottomSheet
        visible={isBottomSheetVisible}
        service={selectedService}
        onClose={handleCloseBottomSheet}
      />
    </Animated.View>
  );
};

const createStyles = (colors, spacing, borderRadius, shadows) => StyleSheet.create({
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
  sectionTitleWhite: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: borderRadius.xl,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    flex: 1,
    justifyContent: 'space-between',
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
    lineHeight: 18,
    flex: 1,
    marginBottom: spacing.sm,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
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
  // New service card elements
  categoryBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  // Loading state styles
  loadingCard: {
    width: SERVICE_CARD_WIDTH,
    marginBottom: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  loadingImage: {
    width: "100%",
    height: 140,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  loadingContent: {
    padding: spacing.md,
  },
  loadingTitle: {
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
  },
  loadingDescription: {
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.small,
    marginBottom: spacing.sm,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingPrice: {
    height: 16,
    width: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.small,
  },
  loadingDuration: {
    height: 16,
    width: 80,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.small,
  },
  // Empty state styles
  emptyStateContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyStateContent: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

export default AllServicesGrid;
