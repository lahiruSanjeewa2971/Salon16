import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const { width } = Dimensions.get('window');
const SERVICE_CARD_WIDTH = (width - 48) / 2;

const AllServicesGrid = ({ 
  services, 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onServicePress,
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

  return (
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
                onPress={() => onServicePress(service)}
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
});

export default AllServicesGrid;
