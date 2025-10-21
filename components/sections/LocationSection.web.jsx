// Web version of LocationSection - uses MapLibre instead of react-native-maps
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

// We will only initialize MapLibre on web to avoid native bundling issues
let maplibregl = null;
const ensureMapLibreCss = () => {
  if (Platform.OS !== 'web') return;
  const id = 'maplibre-gl-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css';
  document.head.appendChild(link);
};

const DEFAULT_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

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
  promotionsAnim,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Animated styles
  const promotionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: promotionsAnim?.value ?? 1,
    transform: [
      { translateY: interpolate(promotionsAnim?.value ?? 1, [0, 1], [50, 0]) },
    ],
  }));

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius, shadows), [colors, spacing, borderRadius, shadows]);

  const initializeMap = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    if (!containerRef.current || mapRef.current) return;

    ensureMapLibreCss();
    if (!maplibregl) {
      try {
        maplibregl = (await import('maplibre-gl')).default;
      } catch (error) {
        console.error('Failed to load MapLibre GL:', error);
        return;
      }
    }

    try {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: DEFAULT_STYLE_URL,
        center: [salonCoordinates.longitude, salonCoordinates.latitude],
        zoom: 14,
        attributionControl: false,
      });

      // Add navigation controls
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      // Add marker
      markerRef.current = new maplibregl.Marker({
        color: '#6C2A52',
      })
        .setLngLat([salonCoordinates.longitude, salonCoordinates.latitude])
        .addTo(mapRef.current);

      // Handle map events
      mapRef.current.on('moveend', () => {
        if (onMapRegionChange && mapRef.current) {
          const center = mapRef.current.getCenter();
          onMapRegionChange({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      });

      mapRef.current.on('load', () => {
        setIsMapReady(true);
      });
    } catch (error) {
      console.error('MapLibre initialization error:', error);
    }
  }, [salonCoordinates, onMapRegionChange]);

  useEffect(() => {
    initializeMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [initializeMap]);

  // Keep marker/center synced with prop changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!mapRef.current || !salonCoordinates) return;
    const center = [salonCoordinates.longitude, salonCoordinates.latitude];
    if (markerRef.current) {
      markerRef.current.setLngLat(center);
    }
    // Only recenter if map isn't interacted yet or when explicitly resetting
  }, [salonCoordinates?.latitude, salonCoordinates?.longitude]);

  const handleReset = () => {
    if (Platform.OS === 'web' && mapRef.current && salonCoordinates) {
      mapRef.current.easeTo({ center: [salonCoordinates.longitude, salonCoordinates.latitude], zoom: 14, duration: 800 });
    }
    if (onResetMapLocation) onResetMapLocation();
  };

  const handleGetDirections = () => {
    if (Platform.OS === 'web') {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${salonCoordinates.latitude},${salonCoordinates.longitude}`;
      window.open(url, '_blank');
    } else if (onGetDirections) {
      onGetDirections();
    }
  };

  const handleCallSalon = () => {
    if (Platform.OS === 'web') {
      window.open('tel:+1234567890', '_self');
    } else if (onCallSalon) {
      onCallSalon();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <Animated.View style={[styles.section, promotionsAnimatedStyle]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitleWhite}>Our Location</ThemedText>
          <Ionicons name="location-outline" size={20} color="white" />
        </View>
        <View style={styles.locationCard}>
          <View style={styles.locationMapContainer}>
            <View style={[styles.nativePlaceholder]}>
              <ThemedText style={styles.placeholderText}>Map is available on web/PWA. Native maps will be updated in a later step.</ThemedText>
            </View>
            <TouchableOpacity style={styles.resetLocationButton} onPress={handleReset} activeOpacity={0.8}>
              <Ionicons name="locate-outline" size={20} color="white" />
              <ThemedText style={styles.resetLocationText}>Reset to Salon</ThemedText>
            </TouchableOpacity>
          </View>
          {renderLocationDetails({ colors, spacing, borderRadius, styles, onGetDirections: handleGetDirections, onCallSalon: handleCallSalon })}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.section, promotionsAnimatedStyle]}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitleWhite}>Our Location</ThemedText>
        <Ionicons name="location-outline" size={20} color="white" />
      </View>
      <View style={styles.locationCard}>
        <View style={styles.locationMapContainer}>
          <View ref={containerRef} style={styles.mapContainer} />
          <TouchableOpacity style={styles.resetLocationButton} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="locate-outline" size={20} color="white" />
            <ThemedText style={styles.resetLocationText}>Reset to Salon</ThemedText>
          </TouchableOpacity>
        </View>
        {renderLocationDetails({ colors, spacing, borderRadius, styles, onGetDirections: handleGetDirections, onCallSalon: handleCallSalon })}
      </View>
    </Animated.View>
  );
};

// Helper function to render location details
const renderLocationDetails = ({ colors, spacing, borderRadius, styles, onGetDirections, onCallSalon }) => (
  <View style={styles.locationDetails}>
    <View style={styles.locationInfo}>
      <ThemedText style={styles.locationTitle}>Salon16 Beauty Studio</ThemedText>
      <ThemedText style={styles.locationAddress}>
        123 Beauty Street{'\n'}
        Downtown District{'\n'}
        City, State 12345
      </ThemedText>
      <ThemedText style={styles.locationPhone}>📞 (123) 456-7890</ThemedText>
    </View>
    
    <View style={styles.locationActions}>
      <TouchableOpacity style={styles.actionButton} onPress={onGetDirections} activeOpacity={0.8}>
        <Ionicons name="navigate-outline" size={20} color="white" />
        <ThemedText style={styles.actionButtonText}>Directions</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={onCallSalon} activeOpacity={0.8}>
        <Ionicons name="call-outline" size={20} color="white" />
        <ThemedText style={styles.actionButtonText}>Call Now</ThemedText>
      </TouchableOpacity>
    </View>
  </View>
);

const createStyles = (colors, spacing, borderRadius, shadows) => StyleSheet.create({
  section: {
    paddingHorizontal: spacing?.lg || 16,
    paddingVertical: spacing?.xl || 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing?.lg || 16,
  },
  sectionTitleWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius?.lg || 12,
    padding: spacing?.lg || 16,
    ...shadows?.medium,
  },
  locationMapContainer: {
    height: 200,
    borderRadius: borderRadius?.md || 8,
    overflow: 'hidden',
    marginBottom: spacing?.lg || 16,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius?.md || 8,
  },
  placeholderText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: spacing?.md || 12,
  },
  resetLocationButton: {
    position: 'absolute',
    top: spacing?.sm || 8,
    right: spacing?.sm || 8,
    backgroundColor: 'rgba(108, 42, 82, 0.9)',
    paddingHorizontal: spacing?.md || 12,
    paddingVertical: spacing?.sm || 8,
    borderRadius: borderRadius?.md || 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing?.xs || 4,
  },
  resetLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationDetails: {
    gap: spacing?.md || 12,
  },
  locationInfo: {
    gap: spacing?.sm || 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  locationPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationActions: {
    flexDirection: 'row',
    gap: spacing?.md || 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(108, 42, 82, 0.8)',
    paddingVertical: spacing?.md || 12,
    paddingHorizontal: spacing?.lg || 16,
    borderRadius: borderRadius?.md || 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing?.sm || 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LocationSection;
