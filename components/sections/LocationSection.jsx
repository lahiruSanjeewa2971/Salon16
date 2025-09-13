import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import Animated, {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const LocationSection = ({ 
  mapRegion,
  salonCoordinates,
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onMapRegionChange,
  onResetMapLocation,
  onGetDirections,
  onCallSalon,
  // Animation values
  promotionsAnim,
}) => {
  // Animated styles
  const promotionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: promotionsAnim.value,
    transform: [
      { translateY: interpolate(promotionsAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
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
            onRegionChangeComplete={onMapRegionChange}
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
                latitude: salonCoordinates.latitude,
                longitude: salonCoordinates.longitude,
              }}
              title="Salon 16"
              description="Visit us for the best salon services"
              pinColor={colors.primary || "#6C2A52"}
            />
          </MapView>
          
          {/* Reset Location Button */}
          <TouchableOpacity
            style={styles.resetLocationButton}
            onPress={onResetMapLocation}
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
              onPress={onGetDirections}
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
              onPress={onCallSalon}
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
});

export default LocationSection;
