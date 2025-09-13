import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const TodaysAvailability = ({ 
  todaySlots, 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onTimeSlotPress,
  // Animation values
  servicesAnim,
}) => {
  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: servicesAnim.value,
    transform: [
      { translateY: interpolate(servicesAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
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
                onPress={() => onTimeSlotPress(slot)}
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
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: spacing.sm || 8,
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
  availabilityCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
});

export default TodaysAvailability;
