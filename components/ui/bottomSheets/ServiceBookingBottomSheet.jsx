import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Dimensions, Modal, Platform, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { salonHoursService } from "../../../services/firebaseService";
import { ThemedText } from "../../ThemedText";
import TimeSelectionSection from "./TimeSelectionSection";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ServiceBookingBottomSheet({
  visible,
  service,
  onClose,
}) {
  const theme = useTheme();
  const responsive = useResponsive();

  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // State management
  const [salonHoursData, setSalonHoursData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingHours, setLoadingHours] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Time selection state (managed by TimeSelectionSection component)
  const [selectedTime, setSelectedTime] = useState(null); // Format: "HH:mm"
  const [isTimeValid, setIsTimeValid] = useState(false); // Validation state from TimeSelectionSection

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);

  // Modern gesture handler for drag to dismiss and resize
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting position
    })
    .onUpdate((event) => {
      // Only handle gestures that start from the top area (handle bar)
      // This allows ScrollView to handle its own scrolling
      if (event.absoluteY < 100) {
        // Only handle gestures from top 100px
        const newTranslateY = translateY.value + event.translationY;
        // Allow dragging up and down, but limit to screen bounds
        if (newTranslateY >= 0 && newTranslateY <= SCREEN_HEIGHT * 0.1) {
          translateY.value = newTranslateY;
        }
      }
    })
    .onEnd((event) => {
      // Only handle dismiss/minimize if gesture started from top area
      if (event.absoluteY < 100) {
        const shouldDismiss = event.translationY > 100 || event.velocityY > 500;
        const shouldMinimize =
          event.translationY < -50 || event.velocityY < -500;

        if (shouldDismiss) {
          // Dismiss the bottom sheet
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
          backdropOpacity.value = withTiming(0, { duration: 400 });
          sheetOpacity.value = withTiming(0, { duration: 400 }, () => {
            runOnJS(onClose)();
          });
        } else if (shouldMinimize) {
          // Minimize to 1/4 of screen
          translateY.value = withSpring(SCREEN_HEIGHT * 0.75, {
            damping: 15,
            stiffness: 200,
          });
        } else {
          // Return to 90% of screen
          translateY.value = withSpring(SCREEN_HEIGHT * 0.1, {
            damping: 15,
            stiffness: 200,
          });
        }
      }
    });

  useEffect(() => {
    if (visible) {
      // Animate in to 90% of screen
      backdropOpacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(SCREEN_HEIGHT * 0.1, {
        damping: 15,
        stiffness: 200,
        mass: 1.0,
      });
      sheetOpacity.value = withTiming(1, { duration: 600 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 400 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
      sheetOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, backdropOpacity, sheetOpacity, translateY]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: sheetOpacity.value,
  }));

  const handleBackdropPress = () => {
    onClose();
  };

  // Format date as YYYY-MM-DD
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is available for booking
  const isDateAvailable = (dateStr, salonHours) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr + 'T00:00:00');
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return { isAvailable: false, reason: 'Past date' };
    }

    if (!salonHours) {
      // If no salon hours data, check if it's Tuesday (default closure)
      const dateForCheck = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = dateForCheck.getDay();
      if (dayOfWeek === 2) {
        return { isAvailable: false, reason: 'Tuesday closure' };
      }
      return { isAvailable: true, reason: 'Available' };
    }

    if (salonHours.isClosed) {
      return { isAvailable: false, reason: 'Salon is closed' };
    }

    if (salonHours.isHoliday) {
      return { isAvailable: false, reason: 'Holiday' };
    }

    if (salonHours.disableBookings) {
      return { isAvailable: false, reason: 'Bookings disabled' };
    }

    const dateForCheck = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateForCheck.getDay();
    if (dayOfWeek === 2 && !salonHours.openTime) {
      return { isAvailable: false, reason: 'Tuesday closure' };
    }

    return { isAvailable: true, reason: 'Available' };
  };

  // Load salon hours for date range
  useEffect(() => {
    if (visible && service) {
      loadSalonHoursRange();
    } else {
      // Clear state when modal closes
      setSelectedDate(null);
      setAvailableDates([]);
      setSalonHoursData({});
      setSelectedTime(null);
      setIsTimeValid(false);
    }
  }, [visible, service]);

  const loadSalonHoursRange = async () => {
    setLoadingHours(true);
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);

      const startDateStr = formatDateToString(today);
      const endDateStr = formatDateToString(endDate);

      const hoursData = await salonHoursService.getSalonHoursRange(
        startDateStr,
        endDateStr
      );

      // Convert to map for easy lookup
      const hoursMap = {};
      hoursData.forEach(hours => {
        hoursMap[hours.date] = hours;
      });

      setSalonHoursData(hoursMap);

      // Generate available dates
      generateAvailableDates(hoursMap);
    } catch (error) {
      console.error('Error loading salon hours:', error);
      // Generate dates even if fetch fails (will use defaults)
      generateAvailableDates({});
    } finally {
      setLoadingHours(false);
    }
  };

  // Generate date cards for next 30 days
  const generateAvailableDates = (hoursMap) => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateToString(date);
      const salonHours = hoursMap[dateStr];
      const availability = isDateAvailable(dateStr, salonHours);
      
      dates.push({
        date: dateStr,
        dateObj: date,
        availability: availability,
        salonHours: salonHours || null
      });
    }
    
    setAvailableDates(dates);
  };

  // Format date for display
  const formatDateDisplay = (dateStr, dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const date = dateObj || new Date(dateStr + 'T00:00:00');
    date.setHours(0, 0, 0, 0);
    
    const todayStr = formatDateToString(today);
    const tomorrowStr = formatDateToString(tomorrow);
    
    if (dateStr === todayStr) {
      return { dayName: 'Today', dayNumber: date.getDate() };
    }
    if (dateStr === tomorrowStr) {
      return { dayName: 'Tomorrow', dayNumber: date.getDate() };
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate()
    };
  };

  // Handle date selection
  const handleDateSelect = (dateStr) => {
    const dateInfo = availableDates.find(d => d.date === dateStr);
    if (dateInfo && dateInfo.availability.isAvailable) {
      setSelectedDate(dateStr);
      setSelectedTime(null); // Reset time when date changes
      setIsTimeValid(false); // Reset validation
    }
  };

  // Handle time change from TimeSelectionSection
  const handleTimeChange = (time24) => {
    setSelectedTime(time24);
  };

  // Handle validation change from TimeSelectionSection
  const handleValidationChange = (isValid) => {
    setIsTimeValid(isValid);
  };

  // Handle place booking button click
  const handlePlaceBooking = () => {
    console.log('Place Booking clicked', {
      service: service?.id,
      serviceName: service?.name,
      date: selectedDate,
      time: selectedTime,
      isValid: isTimeValid,
    });
  };

  const styles = {
    modal: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetContainer: {
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
      height: SCREEN_HEIGHT * 0.9,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      overflow: "hidden",
    },
    gradientBackground: {
      flex: 1,
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    handleBar: {
      width: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingTop: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    closeButton: {
      position: "absolute",
      top: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      right: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      width: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      height: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(5),
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    serviceHeader: {
      paddingTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.2)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    serviceName: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.0) : responsive.responsive.fontSize(2.2),
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    contentWrapper: {
      flex: 1,
      flexDirection: 'column',
    },
    scrollContent: {
      flexShrink: 1,
      flexGrow: 1,
      minHeight: 0,
    },
    scrollContentContainer: {
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
    },
    // Service Info Section
    serviceInfoSection: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
    },
    serviceInfoRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    serviceInfoItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    serviceInfoIcon: {
      marginRight: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    serviceInfoText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      fontWeight: "600",
      color: "white",
    },
    serviceInfoPrice: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      fontWeight: "600",
      color: colors.accent || "#EC4899",
    },
    serviceDescription: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.6) : responsive.responsive.fontSize(1.5),
      color: "rgba(255, 255, 255, 0.9)",
      lineHeight: responsive.isSmallScreen ? 20 : 22,
      textAlign: "center",
      marginTop: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
    },
    // Date Selection Section
    dateSelectionSection: {
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
    },
    sectionTitle: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.6) : responsive.responsive.fontSize(1.7),
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    dateCardsContainer: {
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    dateCard: {
      width: responsive.isSmallScreen ? responsive.responsive.width(20) : responsive.responsive.width(18),
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      marginRight: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dateCardSelected: {
      backgroundColor: colors.accent || "#EC4899",
      borderColor: colors.accent || "#EC4899",
      borderWidth: 2,
    },
    dateCardDisabled: {
      opacity: 0.4,
    },
    dateCardDayName: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.2) : responsive.responsive.fontSize(1.3),
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    dateCardDayNumber: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.0) : responsive.responsive.fontSize(2.2),
      fontWeight: "bold",
      color: "white",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    dateCardStatusIcon: {
      marginTop: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    loadingContainer: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      alignItems: "center",
    },
    loadingText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.5) : responsive.responsive.fontSize(1.6),
      color: "rgba(255, 255, 255, 0.8)",
    },
    // Action Buttons Section
    actionButtonsContainer: {
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.2)",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      flexShrink: 0, // Prevent button container from being compressed
    },
    placeBookingButton: {
      backgroundColor: colors.accent || "#EC4899",
      borderRadius: borderRadius.lg || 16,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.accent || "#EC4899",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    placeBookingButtonDisabled: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      opacity: 0.5,
    },
    placeBookingButtonText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      fontWeight: "bold",
      color: "white",
    },
  };

  if (!service) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={{ flex: 1 }}>
              {Platform.OS === "ios" ? (
                <BlurView intensity={20} style={{ flex: 1 }} tint="dark" />
              ) : (
                <View
                  style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Bottom Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
              {/* Gradient Background */}
              <LinearGradient
                colors={[
                  colors.primary || "#6B46C1",
                  colors.primaryDark || "#553C9A",
                  colors.accent || "#EC4899",
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Handle Bar */}
                <TouchableOpacity
                  style={styles.handleContainer}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log("Handle tapped");
                  }}
                >
                  <View style={styles.handleBar} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    console.log("Close button pressed");
                    onClose();
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="close" 
                    size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(5)} 
                    color="white" 
                  />
                </TouchableOpacity>

                <View style={styles.contentWrapper}>
                  <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                  >
                  {/* Service Header */}
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>
                      {service?.name || "Service"}
                    </ThemedText>
                  </View>

                  {/* Service Info Section */}
                  <View style={styles.serviceInfoSection}>
                    <View style={styles.serviceInfoRow}>
                      {/* Price */}
                      <View style={styles.serviceInfoItem}>
                        <Ionicons
                          name="cash"
                          size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
                          color={colors.accent || "#EC4899"}
                          style={styles.serviceInfoIcon}
                        />
                        <ThemedText style={styles.serviceInfoPrice}>
                          ${service?.price || 0}
                        </ThemedText>
                      </View>

                      {/* Duration */}
                      <View style={styles.serviceInfoItem}>
                        <Ionicons
                          name="time"
                          size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
                          color="white"
                          style={styles.serviceInfoIcon}
                        />
                        <ThemedText style={styles.serviceInfoText}>
                          {service?.duration || 0} min
                        </ThemedText>
                      </View>
                    </View>

                    {/* Description */}
                    {service?.description && (
                      <ThemedText style={styles.serviceDescription}>
                        {service.description}
                      </ThemedText>
                    )}
                  </View>

                  {/* Date Selection Section */}
                  <View style={styles.dateSelectionSection}>
                    <ThemedText style={styles.sectionTitle}>
                      Select Date
                    </ThemedText>

                    {loadingHours ? (
                      <View style={styles.loadingContainer}>
                        <ThemedText style={styles.loadingText}>
                          Loading available dates...
                        </ThemedText>
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateCardsContainer}
                        bounces={false}
                      >
                        {availableDates.map((dateInfo) => {
                          const { dayName, dayNumber } = formatDateDisplay(
                            dateInfo.date,
                            dateInfo.dateObj
                          );
                          const isSelected = selectedDate === dateInfo.date;
                          const isAvailable = dateInfo.availability.isAvailable;

                          return (
                            <TouchableOpacity
                              key={dateInfo.date}
                              style={[
                                styles.dateCard,
                                isSelected && styles.dateCardSelected,
                                !isAvailable && styles.dateCardDisabled,
                              ]}
                              onPress={() => handleDateSelect(dateInfo.date)}
                              disabled={!isAvailable}
                              activeOpacity={0.7}
                            >
                              <ThemedText style={styles.dateCardDayName}>
                                {dayName}
                              </ThemedText>
                              <ThemedText style={styles.dateCardDayNumber}>
                                {dayNumber}
                              </ThemedText>
                              <View style={styles.dateCardStatusIcon}>
                                {isAvailable ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
                                    color={isSelected ? "white" : colors.status?.success || "#10B981"}
                                  />
                                ) : (
                                  <Ionicons
                                    name="close-circle"
                                    size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
                                    color={colors.status?.error || "#EF4444"}
                                  />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>

                  {/* Time Selection Section */}
                  <TimeSelectionSection
                    selectedDate={selectedDate}
                    service={service}
                    salonHoursData={salonHoursData}
                    onTimeChange={handleTimeChange}
                    onValidationChange={handleValidationChange}
                  />
                  </ScrollView>

                  {/* Action Buttons Section */}
                  <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.placeBookingButton,
                      (!selectedDate || !selectedTime || !isTimeValid) && styles.placeBookingButtonDisabled,
                    ]}
                    onPress={handlePlaceBooking}
                    disabled={!selectedDate || !selectedTime || !isTimeValid}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={styles.placeBookingButtonText}>
                      Place Booking
                    </ThemedText>
                  </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

