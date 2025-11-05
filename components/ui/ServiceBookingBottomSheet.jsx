import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Dimensions, Modal, Platform, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../contexts/ThemeContext";
import {
  salonHoursService
} from "../../services/firebaseService";
import { ThemedText } from "../ThemedText";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ServiceBookingBottomSheet({
  visible,
  service,
  selectedDate,
  mode = "service", // 'service', 'day', or 'salon-hours'
  salonHours = null, // Salon hours data for salon-hours mode
  onClose,
  onSave, // Callback for saving salon hours
}) {
  const theme = useTheme();

  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Salon hours state management
  const [salonHoursState, setSalonHoursState] = useState({
    openTime: "08:30",
    closeTime: "21:00",
    isClosed: false,
    disableBookings: false,
    isHoliday: false,
    notes: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(null); // 'open' | 'close' | null
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempTime, setTempTime] = useState("08:30");
  const [error, setError] = useState(null);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);

  // Salon hours logic
  const isTuesday = selectedDate
    ? new Date(selectedDate).getDay() === 2
    : false;

  const getSalonStatus = () => {
    if (salonHoursState.isClosed || salonHoursState.isHoliday) return "closed";
    if (isTuesday) return "closed";
    if (salonHoursState.disableBookings) return "bookings-disabled";
    return "open";
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return colors.status?.success || "#10B981";
      case "closed":
        return colors.status?.error || "#EF4444";
      case "bookings-disabled":
        return colors.status?.warning || "#F59E0B";
      default:
        return colors.status?.info || "#3B82F6";
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "open":
        return "Salon is open for business";
      case "closed":
        return isTuesday
          ? "Tuesday is our weekly closure day"
          : "Salon is closed today";
      case "bookings-disabled":
        return "Salon is open but bookings are disabled";
      default:
        return "Status unknown";
    }
  };

  // Load salon hours data when bottom sheet opens
  useEffect(() => {
    if (mode === "salon-hours" && visible && selectedDate) {
      loadSalonHours();
    }
  }, [mode, visible, selectedDate]);

  // Clear state when bottom sheet closes
  useEffect(() => {
    if (!visible) {
      clearState();
    }
  }, [visible]);

  // Load salon hours with proper fallback logic
  const loadSalonHours = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Loading salon hours for: ${selectedDate}`);

      // Get salon hours for the specific date
      const hoursData = await salonHoursService.getSalonHours(selectedDate);

      // Apply day-specific logic
      const dayOfWeek = new Date(selectedDate).getDay();
      const isSelectedTuesday = dayOfWeek === 2;

      // Set state with proper day-specific logic
      setSalonHoursState({
        openTime: hoursData.openTime || "08:30",
        closeTime: hoursData.closeTime || "21:00",
        isClosed:
          hoursData.isClosed !== undefined
            ? hoursData.isClosed
            : isSelectedTuesday,
        disableBookings: hoursData.disableBookings || false,
        isHoliday: hoursData.isHoliday || false,
        notes: hoursData.notes || "",
      });

      console.log(
        `Bottom sheet opened for ${
          isSelectedTuesday ? "Tuesday" : "Regular day"
        }`
      );
      console.log("Loaded salon hours:", hoursData);
    } catch (error) {
      console.error("Error loading salon hours:", error);
      setError("Failed to load salon hours");

      // Fallback to default values
      const dayOfWeek = new Date(selectedDate).getDay();
      const isSelectedTuesday = dayOfWeek === 2;

      setSalonHoursState({
        openTime: "08:30",
        closeTime: "21:00",
        isClosed: isSelectedTuesday,
        disableBookings: false,
        isHoliday: false,
        notes: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all state when bottom sheet closes
  const clearState = () => {
    setSalonHoursState({
      openTime: "08:30",
      closeTime: "21:00",
      isClosed: false,
      disableBookings: false,
      isHoliday: false,
      notes: "",
    });
    setIsEditing(false);
    setShowTimePicker(null);
    setIsSaving(false);
    setIsLoading(false);
    setError(null);
    setTempTime("08:30");
  };

  // Handle salon hours changes
  const handleSalonHoursChange = (field, value) => {
    setSalonHoursState((prev) => {
      const newState = {
        ...prev,
        [field]: value,
      };

      // If admin changes operating hours, automatically uncheck "Salon Closed Today"
      // This applies to all days, not just Tuesday
      if ((field === "openTime" || field === "closeTime") && prev.isClosed) {
        newState.isClosed = false;
        console.log("Operating hours changed - salon is now open");
      }

      // If admin manually checks "Salon Closed Today" on Tuesday, that's allowed
      // If admin unchecks "Salon Closed Today" on Tuesday, that's also allowed (override)
      if (field === "isClosed") {
        if (value === false && isTuesday) {
          console.log("Tuesday salon manually opened by admin");
        } else if (value === true && isTuesday) {
          console.log("Tuesday salon manually closed by admin");
        }
      }

      return newState;
    });
    setIsEditing(true);
  };

  // Handle save with proper validation and error handling
  const handleSave = async () => {
    if (!onSave || !selectedDate) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate data before saving
      if (salonHoursState.openTime >= salonHoursState.closeTime) {
        setError("Open time must be before close time");
        return;
      }

      console.log("Saving salon hours:", salonHoursState);

      // Prepare data for saving
      const saveData = {
        ...salonHoursState,
        date: selectedDate,
      };

      // Save to database
      await salonHoursService.saveSalonHours(saveData);

      // Call parent callback
      await onSave(saveData);

      console.log("Salon hours saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving salon hours:", error);
      setError("Failed to save salon hours. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Time picker functions
  const openTimePicker = (type) => {
    const currentTime =
      type === "open" ? salonHoursState.openTime : salonHoursState.closeTime;
    setTempTime(currentTime);
    setShowTimePicker(type);
  };

  const confirmTimeChange = () => {
    // Validate time range
    if (showTimePicker === "open" && tempTime >= salonHoursState.closeTime) {
      // Open time should be before close time
      return;
    }
    if (showTimePicker === "close" && tempTime <= salonHoursState.openTime) {
      // Close time should be after open time
      return;
    }

    if (showTimePicker === "open") {
      handleSalonHoursChange("openTime", tempTime);
    } else if (showTimePicker === "close") {
      handleSalonHoursChange("closeTime", tempTime);
    }
    setShowTimePicker(null);
  };

  // Check if current time selection is valid
  const isTimeSelectionValid = () => {
    if (showTimePicker === "open") {
      return tempTime < salonHoursState.closeTime;
    }
    if (showTimePicker === "close") {
      return tempTime > salonHoursState.openTime;
    }
    return true;
  };

  const cancelTimeChange = () => {
    setShowTimePicker(null);
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

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
      height: SCREEN_HEIGHT * 0.9, // Increased height to allow proper scrolling
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
      paddingVertical: spacing.md || 12,
      paddingHorizontal: spacing.lg || 20,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingTop: spacing.sm || 8,
    },
    closeButton: {
      position: "absolute",
      top: spacing.lg || 20,
      right: spacing.lg || 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    serviceHeader: {
      paddingTop: spacing.xl || 24,
      paddingBottom: spacing.lg || 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.2)",
      marginBottom: spacing.lg || 16,
    },
    serviceName: {
      fontSize: 20,
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingBottom: spacing.sm || 8,
    },
    placeholderContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg || 20,
    },
    placeholderText: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      lineHeight: 24,
    },
    // Salon Hours Management Styles
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      paddingHorizontal: spacing.lg || 20,
      paddingBottom: spacing.xxl * 3 || 120, // Triple bottom padding for save button spacing
      paddingTop: spacing.sm || 8,
    },
    section: {
      marginBottom: spacing.lg || 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md || 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.9)",
      marginLeft: spacing.sm || 8,
      letterSpacing: 1,
    },
    statusCard: {
      padding: spacing.md || 12,
      borderRadius: borderRadius.lg || 12,
      marginBottom: spacing.sm || 8,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xs || 4,
    },
    statusText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
      marginLeft: spacing.sm || 8,
    },
    statusMessage: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      lineHeight: 20,
    },
    tuesdayBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: spacing.sm || 8,
      paddingVertical: spacing.xs || 4,
      borderRadius: borderRadius.sm || 4,
      marginLeft: spacing.sm || 8,
    },
    tuesdayBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "white",
      letterSpacing: 1,
    },
    hoursCard: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      padding: spacing.md || 12,
      borderRadius: borderRadius.lg || 12,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md || 12,
    },
    timeLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
    },
    timeButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: spacing.md || 12,
      paddingVertical: spacing.sm || 8,
      borderRadius: borderRadius.md || 8,
    },
    timeText: {
      fontSize: 14,
      fontWeight: "500",
      color: "white",
      marginRight: spacing.xs || 4,
    },
    timeButtonDisabled: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      opacity: 0.5,
    },
    timeTextDisabled: {
      color: "rgba(255, 255, 255, 0.5)",
    },
    settingsCard: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      padding: spacing.md || 12,
      borderRadius: borderRadius.lg || 12,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm || 8,
    },
    settingText: {
      fontSize: 14,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      marginLeft: spacing.sm || 8,
    },
    notesCard: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      padding: spacing.md || 12,
      borderRadius: borderRadius.lg || 12,
    },
    notesInput: {
      fontSize: 14,
      color: "white",
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: spacing.sm || 8,
    },
    characterCount: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.6)",
      textAlign: "right",
    },
    saveButton: {
      marginTop: spacing.lg || 16,
      marginBottom: spacing.xl * 2 || 40, // Increased bottom margin for proper spacing
      borderRadius: borderRadius.lg || 12,
      overflow: "hidden",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.lg || 16, // Increased vertical padding
      paddingHorizontal: spacing.lg || 20,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
      marginLeft: spacing.sm || 8,
    },
    // Time Picker Styles
    timePickerModal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg || 20,
    },
    timePickerContainer: {
      backgroundColor: colors.primary || "#6B46C1",
      borderRadius: borderRadius.xl || 16,
      width: "100%",
      maxHeight: "70%",
      overflow: "hidden",
    },
    timePickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg || 20,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.2)",
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "white",
    },
    timePickerCloseButton: {
      padding: spacing.sm || 8,
    },
    timePickerScroll: {
      maxHeight: 300,
    },
    timeOption: {
      paddingVertical: spacing.md || 12,
      paddingHorizontal: spacing.lg || 20,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    timeOptionSelected: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    timeOptionText: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
    },
    timeOptionTextSelected: {
      color: "white",
      fontWeight: "600",
    },
    timePickerActions: {
      flexDirection: "row",
      padding: spacing.lg || 20,
      gap: spacing.md || 12,
    },
    timePickerCancelButton: {
      flex: 1,
      paddingVertical: spacing.md || 12,
      borderRadius: borderRadius.md || 8,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
    },
    timePickerCancelText: {
      fontSize: 16,
      fontWeight: "500",
      color: "white",
    },
    timePickerConfirmButton: {
      flex: 1,
      paddingVertical: spacing.md || 12,
      borderRadius: borderRadius.md || 8,
      backgroundColor: colors.status?.success || "#10B981",
      alignItems: "center",
    },
    timePickerConfirmText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
    },
    timePickerConfirmButtonDisabled: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    timePickerConfirmTextDisabled: {
      color: "rgba(255, 255, 255, 0.5)",
    },
    // Loading and Error States
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing.xl || 20,
    },
    loadingText: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
    },
    errorContainer: {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      padding: spacing.md || 12,
      borderRadius: borderRadius.md || 8,
      margin: spacing.md || 12,
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
    errorText: {
      fontSize: 14,
      color: "#FCA5A5",
      textAlign: "center",
    },
  };

  if (!service && mode === "service") return null;

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
            <SafeAreaView style={{ flex: 1 }}>
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
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.content}>
                  {/* Service Header */}
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>
                      {mode === "service"
                        ? service?.name || "Service"
                        : `${
                            selectedDate
                              ? new Date(selectedDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "Selected Date"
                          }`}
                    </ThemedText>
                  </View>

                  {/* Content based on mode */}
                  {mode === "salon-hours" ? (
                    <>
                      {/* Loading State */}
                      {isLoading && (
                        <View style={styles.loadingContainer}>
                          <ThemedText style={styles.loadingText}>
                            Loading salon hours...
                          </ThemedText>
                        </View>
                      )}

                      {/* Error State */}
                      {error && (
                        <View style={styles.errorContainer}>
                          <ThemedText style={styles.errorText}>
                            {error}
                          </ThemedText>
                        </View>
                      )}

                      {/* Main Content */}
                      {!isLoading && (
                        <ScrollView
                          style={styles.scrollContent}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.scrollContentContainer}
                          bounces={true}
                          scrollEventThrottle={16}
                          nestedScrollEnabled={true}
                          alwaysBounceVertical={false}
                          keyboardShouldPersistTaps="handled"
                          contentInsetAdjustmentBehavior="automatic"
                        >
                          {/* Salon Status Section */}
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="business"
                                size={20}
                                color="white"
                              />
                              <ThemedText style={styles.sectionTitle}>
                                SALON STATUS
                              </ThemedText>
                            </View>
                            <View
                              style={[
                                styles.statusCard,
                                {
                                  backgroundColor: getStatusColor(
                                    getSalonStatus()
                                  ),
                                },
                              ]}
                            >
                              <View style={styles.statusRow}>
                                <Ionicons
                                  name={
                                    getSalonStatus() === "open"
                                      ? "checkmark-circle"
                                      : "close-circle"
                                  }
                                  size={24}
                                  color="white"
                                />
                                <ThemedText style={styles.statusText}>
                                  {getSalonStatus() === "open"
                                    ? "Salon Open"
                                    : getSalonStatus() === "closed"
                                    ? "Salon Closed"
                                    : "Bookings Disabled"}
                                </ThemedText>
                                {isTuesday && salonHoursState.isClosed && (
                                  <View style={styles.tuesdayBadge}>
                                    <ThemedText style={styles.tuesdayBadgeText}>
                                      TUESDAY
                                    </ThemedText>
                                  </View>
                                )}
                              </View>
                              <ThemedText style={styles.statusMessage}>
                                {getStatusMessage(getSalonStatus())}
                              </ThemedText>
                            </View>
                          </View>

                          {/* Operating Hours Section */}
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons name="time" size={20} color="white" />
                              <ThemedText style={styles.sectionTitle}>
                                OPERATING HOURS
                              </ThemedText>
                            </View>
                            <View style={styles.hoursCard}>
                              <View style={styles.timeRow}>
                                <ThemedText style={styles.timeLabel}>
                                  Open Time:
                                </ThemedText>
                                <TouchableOpacity
                                  style={[
                                    styles.timeButton,
                                    salonHoursState.isClosed &&
                                      styles.timeButtonDisabled,
                                  ]}
                                  onPress={() =>
                                    !salonHoursState.isClosed &&
                                    openTimePicker("open")
                                  }
                                  disabled={salonHoursState.isClosed}
                                >
                                  <ThemedText
                                    style={[
                                      styles.timeText,
                                      salonHoursState.isClosed &&
                                        styles.timeTextDisabled,
                                    ]}
                                  >
                                    {formatTime(salonHoursState.openTime)}
                                  </ThemedText>
                                  <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="white"
                                  />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.timeRow}>
                                <ThemedText style={styles.timeLabel}>
                                  Close Time:
                                </ThemedText>
                                <TouchableOpacity
                                  style={[
                                    styles.timeButton,
                                    salonHoursState.isClosed &&
                                      styles.timeButtonDisabled,
                                  ]}
                                  onPress={() =>
                                    !salonHoursState.isClosed &&
                                    openTimePicker("close")
                                  }
                                  disabled={salonHoursState.isClosed}
                                >
                                  <ThemedText
                                    style={[
                                      styles.timeText,
                                      salonHoursState.isClosed &&
                                        styles.timeTextDisabled,
                                    ]}
                                  >
                                    {formatTime(salonHoursState.closeTime)}
                                  </ThemedText>
                                  <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="white"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>

                          {/* Day Settings Section */}
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="settings"
                                size={20}
                                color="white"
                              />
                              <ThemedText style={styles.sectionTitle}>
                                DAY SETTINGS
                              </ThemedText>
                            </View>
                            <View style={styles.settingsCard}>
                              <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() =>
                                  handleSalonHoursChange(
                                    "isClosed",
                                    !salonHoursState.isClosed
                                  )
                                }
                              >
                                <Ionicons
                                  name={
                                    salonHoursState.isClosed
                                      ? "checkbox"
                                      : "square-outline"
                                  }
                                  size={24}
                                  color="white"
                                />
                                <ThemedText style={styles.settingText}>
                                  Salon Closed Today
                                </ThemedText>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() =>
                                  handleSalonHoursChange(
                                    "disableBookings",
                                    !salonHoursState.disableBookings
                                  )
                                }
                              >
                                <Ionicons
                                  name={
                                    salonHoursState.disableBookings
                                      ? "checkbox"
                                      : "square-outline"
                                  }
                                  size={24}
                                  color="white"
                                />
                                <ThemedText style={styles.settingText}>
                                  Disable Bookings Only
                                </ThemedText>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() =>
                                  handleSalonHoursChange(
                                    "isHoliday",
                                    !salonHoursState.isHoliday
                                  )
                                }
                              >
                                <Ionicons
                                  name={
                                    salonHoursState.isHoliday
                                      ? "checkbox"
                                      : "square-outline"
                                  }
                                  size={24}
                                  color="white"
                                />
                                <ThemedText style={styles.settingText}>
                                  Mark as Holiday
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Notes Section */}
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="document-text"
                                size={20}
                                color="white"
                              />
                              <ThemedText style={styles.sectionTitle}>
                                NOTES
                              </ThemedText>
                            </View>
                            <View style={styles.notesCard}>
                              <TextInput
                                style={styles.notesInput}
                                placeholder="Optional notes for this day..."
                                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                                value={salonHoursState.notes}
                                onChangeText={(text) =>
                                  handleSalonHoursChange("notes", text)
                                }
                                multiline
                                maxLength={200}
                              />
                              <ThemedText style={styles.characterCount}>
                                {salonHoursState.notes.length}/200
                              </ThemedText>
                            </View>
                          </View>

                          {/* Save Button */}
                          <TouchableOpacity
                            style={[
                              styles.saveButton,
                              (isSaving || !isEditing) &&
                                styles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={isSaving || !isEditing}
                          >
                            <LinearGradient
                              colors={
                                isEditing && !isSaving
                                  ? [
                                      colors.status?.success || "#10B981",
                                      colors.status?.success || "#10B981",
                                    ]
                                  : [
                                      "rgba(255, 255, 255, 0.2)",
                                      "rgba(255, 255, 255, 0.1)",
                                    ]
                              }
                              style={styles.saveButtonGradient}
                            >
                              <Ionicons
                                name={isSaving ? "hourglass" : "save"}
                                size={20}
                                color="white"
                              />
                              <ThemedText style={styles.saveButtonText}>
                                {isSaving
                                  ? "Saving..."
                                  : isEditing
                                  ? "Save Changes"
                                  : "No Changes"}
                              </ThemedText>
                            </LinearGradient>
                          </TouchableOpacity>
                        </ScrollView>
                      )}
                    </>
                  ) : (
                    <View style={styles.placeholderContent}>
                      <ThemedText style={styles.placeholderText}>
                        {mode === "service"
                          ? `Service booking functionality will be implemented here.`
                          : `Day booking functionality will be implemented here.`}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={cancelTimeChange}
        >
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <ThemedText style={styles.timePickerTitle}>
                  Select {showTimePicker === "open" ? "Open" : "Close"} Time
                </ThemedText>
                <TouchableOpacity
                  onPress={cancelTimeChange}
                  style={styles.timePickerCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      tempTime === time && styles.timeOptionSelected,
                    ]}
                    onPress={() => setTempTime(time)}
                  >
                    <ThemedText
                      style={[
                        styles.timeOptionText,
                        tempTime === time && styles.timeOptionTextSelected,
                      ]}
                    >
                      {formatTime(time)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.timePickerActions}>
                <TouchableOpacity
                  style={styles.timePickerCancelButton}
                  onPress={cancelTimeChange}
                >
                  <ThemedText style={styles.timePickerCancelText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timePickerConfirmButton,
                    !isTimeSelectionValid() &&
                      styles.timePickerConfirmButtonDisabled,
                  ]}
                  onPress={confirmTimeChange}
                  disabled={!isTimeSelectionValid()}
                >
                  <ThemedText
                    style={[
                      styles.timePickerConfirmText,
                      !isTimeSelectionValid() &&
                        styles.timePickerConfirmTextDisabled,
                    ]}
                  >
                    Confirm
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}
