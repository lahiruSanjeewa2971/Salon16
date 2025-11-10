import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Dimensions, Modal, Platform, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { bookingService, salonHoursService } from "../../../services/firebaseService";
import { ThemedText } from "../../ThemedText";
import { useToastHelpers } from "../ToastSystem";
import TimeSelectionSection from "./TimeSelectionSection";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ServiceBookingBottomSheet({
  visible,
  service,
  onClose,
}) {
  const theme = useTheme();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToastHelpers();

  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Calculate action buttons container height (approximate)
  const actionButtonsHeight = 
    (responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl) + // paddingTop
    ((responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg) * 2) + // button paddingVertical (top + bottom)
    (responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) * 1.5 : responsive.responsive.fontSize(2.0) * 1.5) + // button text height
    (responsive.isSmallScreen ? responsive.spacing.xl + insets.bottom : responsive.spacing.xxl + insets.bottom) + // paddingBottom + safe area
    (responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl) + // marginTop
    1; // borderTopWidth

  // Calculate available height for ScrollView content container
  const handleBarHeight = responsive.isSmallScreen ? (responsive.spacing.sm * 2 + 4) : (responsive.spacing.md * 2 + 4);
  const availableContentHeight = (SCREEN_HEIGHT * 0.9) - handleBarHeight;

  // State management
  const [salonHoursData, setSalonHoursData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingHours, setLoadingHours] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Time selection state (managed by TimeSelectionSection component)
  const [selectedTime, setSelectedTime] = useState(null); // Format: "HH:mm"
  const [isTimeValid, setIsTimeValid] = useState(false); // Validation state from TimeSelectionSection
  
  // Booking submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refresh trigger for TimeSelectionSection (increment to force refresh)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

    // Check if "Today" should be disabled based on current time + service duration + buffer
    const todayStr = formatDateToString(today);
    if (dateStr === todayStr && service) {
      const now = new Date();
      const bufferMinutes = 20; // 20-minute buffer between bookings
      
      if (salonHours && salonHours.closeTime && !salonHours.isClosed) {
        // Calculate if current time + service duration + buffer exceeds closing time
        const serviceEndTime = new Date(now);
        serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration + bufferMinutes);
        
        const [closeHour, closeMinute] = salonHours.closeTime.split(':').map(Number);
        const closeTime = new Date(now);
        closeTime.setHours(closeHour, closeMinute, 0, 0);
        
        if (serviceEndTime > closeTime) {
          return { isAvailable: false, reason: 'Too late to book today' };
        }
      } else if (!salonHours) {
        // If no salon hours, use default closing time (21:00)
        const serviceEndTime = new Date(now);
        serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration + bufferMinutes);
        
        const closeTime = new Date(now);
        closeTime.setHours(21, 0, 0, 0);
        
        if (serviceEndTime > closeTime) {
          return { isAvailable: false, reason: 'Too late to book today' };
        }
      }
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
  const handlePlaceBooking = async () => {
    // Validation checks
    if (!user) {
      showError('Authentication Required', 'Please login to place a booking');
      return;
    }

    if (!service) {
      showError('Service Error', 'Service information is missing');
      return;
    }

    if (!selectedDate) {
      showError('Date Required', 'Please select a date for your booking');
      return;
    }

    if (!selectedTime) {
      showError('Time Required', 'Please select a time for your booking');
      return;
    }

    if (!isTimeValid) {
      showError('Invalid Time', 'Please select a valid time within salon operating hours');
      return;
    }

    // Check if service duration fits before closing (with buffer)
    const bufferMinutes = 20;
    const hours = salonHoursData[selectedDate];
    if (hours && hours.closeTime && !hours.isClosed) {
      const [closeHour, closeMinute] = hours.closeTime.split(':').map(Number);
      const selectedDateTime = new Date(selectedDate + 'T' + selectedTime);
      const serviceEndTime = new Date(selectedDateTime);
      serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration + bufferMinutes);
      
      const closeTime = new Date(selectedDate + 'T' + hours.closeTime);
      if (serviceEndTime > closeTime) {
        showError('Invalid Booking', 'Service duration exceeds salon closing time');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Final check: Verify no conflicting bookings exist (double-check before saving)
      // This will return an empty array if no bookings exist or if query fails
      let existingBookings = [];
      try {
        existingBookings = await bookingService.getBookingsByDate(selectedDate);
      } catch (queryError) {
        // If query fails (e.g., permissions, empty collection), continue with empty array
        // This allows booking creation even if we can't check for conflicts
        console.warn('Could not query existing bookings, proceeding with conflict check:', queryError.message);
        existingBookings = [];
      }
      
      // Ensure existingBookings is an array
      if (!Array.isArray(existingBookings)) {
        existingBookings = [];
      }
      
      const bufferMinutes = 20;
      const selectedDateTime = new Date(selectedDate + 'T' + selectedTime);
      const bookingEndTime = new Date(selectedDateTime);
      bookingEndTime.setMinutes(bookingEndTime.getMinutes() + service.duration);

      // Check for conflicts with existing bookings (including buffer)
      const hasConflict = existingBookings.some(booking => {
        if (booking.status === 'cancelled') return false; // Ignore cancelled bookings
        
        const bookingStart = new Date(booking.date + 'T' + booking.time);
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + (booking.serviceDuration || 30));

        // Add buffer zones
        const bookingStartWithBuffer = new Date(bookingStart);
        bookingStartWithBuffer.setMinutes(bookingStartWithBuffer.getMinutes() - bufferMinutes);
        const bookingEndWithBuffer = new Date(bookingEnd);
        bookingEndWithBuffer.setMinutes(bookingEndWithBuffer.getMinutes() + bufferMinutes);

        // Check if new booking overlaps with existing booking + buffer
        return (selectedDateTime < bookingEndWithBuffer && bookingEndTime > bookingStartWithBuffer);
      });

      if (hasConflict) {
        showError(
          'Time Slot Unavailable',
          'This time slot was just booked by another customer. We\'ve refreshed available times. Please select a different time.'
        );
        setIsSubmitting(false);
        
        // Clear selection
        setSelectedTime(null);
        setIsTimeValid(false);
        
        // Trigger refresh of time slots by incrementing refreshTrigger
        setRefreshTrigger(prev => prev + 1);
        return;
      }

      // Prepare booking data
      const bookingData = {
        customerId: user.uid,
        customerName: user.displayName || user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) || user.email?.split('@')[0] || 'Customer',
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        categoryId: service.category?.id || null,
        categoryName: service.category?.name || null,
        date: selectedDate, // YYYY-MM-DD format
        time: selectedTime, // HH:mm format
        status: 'pending',
        notes: '',
        rescheduleCount: 0,
      };

      // Create booking in Firestore
      await bookingService.createBooking(bookingData);

      // Show success toast
      showSuccess(
        'Booking Confirmed',
        `Your booking for ${service.name} on ${formatDateDisplay(selectedDate, new Date(selectedDate + 'T00:00:00')).dayName} at ${formatTimeDisplay(selectedTime)} has been confirmed.`,
        { duration: 4000 }
      );

      // Close bottom sheet after a short delay to allow toast to be visible
      setTimeout(() => {
        onClose();
        // Reset state
        setSelectedDate(null);
        setSelectedTime(null);
        setIsTimeValid(false);
      }, 500);
    } catch (error) {
      console.error('Error creating booking:', error);
      showError(
        'Booking Failed',
        error.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time for display (12-hour format)
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
      minHeight: availableContentHeight,
      flexDirection: 'column',
    },
    scrollContentInner: {
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.xxl + insets.bottom : responsive.spacing.xxl * 1.5 + insets.bottom,
      flexShrink: 1,
      flexGrow: 0,
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
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.xxxl : responsive.spacing.xxl,
      marginTop: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xxxl : responsive.spacing.xxl,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.2)",
      // backgroundColor: "rgba(236, 72, 153, 0.8)",
      width: '100%',
      flexShrink: 0,
      flexGrow: 0,
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
                    <View style={styles.scrollContentInner}>
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
                        refreshTrigger={refreshTrigger}
                      />

                      {/* Action Buttons Section */}
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                          style={[
                            styles.placeBookingButton,
                            (!selectedDate || !selectedTime || !isTimeValid || isSubmitting) && styles.placeBookingButtonDisabled,
                          ]}
                          onPress={handlePlaceBooking}
                          disabled={!selectedDate || !selectedTime || !isTimeValid || isSubmitting}
                          activeOpacity={0.8}
                        >
                          <ThemedText style={styles.placeBookingButtonText}>
                            {isSubmitting ? 'Placing Booking...' : 'Place Booking'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>

                  </ScrollView>
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

