import { useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { bookingService } from "../../../services/firebaseService";
import { ThemedText } from "../../ThemedText";

export default function TimeSelectionSection({
  selectedDate,
  service,
  salonHoursData,
  onTimeChange,
  onValidationChange,
}) {
  const theme = useTheme();
  const responsive = useResponsive();

  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Time selection state
  const [existingBookings, setExistingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [timeSelectionMode, setTimeSelectionMode] = useState(null); // 'picker' | 'slots'
  const [selectedTime, setSelectedTime] = useState(null); // Format: "HH:mm"
  const [selectedHour, setSelectedHour] = useState(9); // For time picker
  const [selectedMinute, setSelectedMinute] = useState(30); // For time picker
  const [selectedAmPm, setSelectedAmPm] = useState('AM'); // For time picker
  const [timeValidationError, setTimeValidationError] = useState(null); // Error message for invalid time

  // Refs for scroll views
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Get default salon hours based on day of week
  const getDefaultSalonHours = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const defaultSchedule = {
      0: { openTime: '10:00', closeTime: '18:00', isClosed: false }, // Sunday
      1: { openTime: '08:30', closeTime: '21:00', isClosed: false }, // Monday
      2: { openTime: '08:30', closeTime: '21:00', isClosed: true }, // Tuesday (closed)
      3: { openTime: '08:30', closeTime: '21:00', isClosed: false }, // Wednesday
      4: { openTime: '08:30', closeTime: '21:00', isClosed: false }, // Thursday
      5: { openTime: '08:30', closeTime: '21:00', isClosed: false }, // Friday
      6: { openTime: '09:00', closeTime: '20:00', isClosed: false }, // Saturday
    };

    return defaultSchedule[dayOfWeek];
  };

  // Get salon hours for a date (custom or default)
  const getSalonHoursForDate = (dateStr) => {
    // First check if custom hours exist
    const customHours = salonHoursData[dateStr];
    if (customHours && customHours.openTime && customHours.closeTime) {
      return customHours;
    }
    // Otherwise use default hours based on day of week
    return getDefaultSalonHours(dateStr);
  };

  // Format time for display (12-hour format)
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Format time for storage (24-hour format)
  const formatTime24 = (hour, minute, ampm) => {
    let hour24 = hour;
    if (ampm === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Validate time picker selection
  const validateTimePickerSelection = (hour, minute, ampm, date = selectedDate) => {
    if (!date || !service) return { valid: false, error: 'Date or service not selected' };

    const hours = getSalonHoursForDate(date);
    if (!hours || !hours.openTime || !hours.closeTime || hours.isClosed) {
      return { valid: false, error: 'Salon hours not available' };
    }

    // Convert to 24-hour format
    const time24 = formatTime24(hour, minute, ampm);

    // Parse salon hours
    const selectedDateTime = new Date(date + 'T' + time24);
    const openTime = new Date(date + 'T' + hours.openTime);
    const closeTime = new Date(date + 'T' + hours.closeTime);

    // Check if selected time is within salon hours
    if (selectedDateTime < openTime || selectedDateTime >= closeTime) {
      return { valid: false, error: 'Selected time is outside salon hours' };
    }

    // Check if service duration fits before closing
    const serviceEndTime = new Date(selectedDateTime);
    serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration);

    if (serviceEndTime > closeTime) {
      return { valid: false, error: 'Service duration exceeds closing time' };
    }

    return { valid: true };
  };

  // Load existing bookings for selected date
  useEffect(() => {
    if (selectedDate) {
      loadExistingBookings(selectedDate);
    } else {
      setExistingBookings([]);
      setTimeSelectionMode(null);
      setSelectedTime(null);
      setTimeValidationError(null);
      onTimeChange(null);
      onValidationChange(false);
    }
  }, [selectedDate]);

  const loadExistingBookings = async (date) => {
    setLoadingBookings(true);
    try {
      const bookings = await bookingService.getBookingsByDate(date);
      setExistingBookings(bookings || []);

      // Determine time selection mode
      const hasBookings = bookings && bookings.length > 0;
      setTimeSelectionMode(hasBookings ? 'slots' : 'picker');

      // Initialize time picker with salon opening time if in picker mode
      if (!hasBookings) {
        const hours = getSalonHoursForDate(date);
        if (hours && hours.openTime && !hours.isClosed) {
          const [openHour24, openMinute] = hours.openTime.split(':').map(Number);
          let hour12 = openHour24 % 12 || 12;
          const ampm = openHour24 >= 12 ? 'PM' : 'AM';

          // Round minute to nearest 15-minute interval
          const roundedMinute = Math.round(openMinute / 15) * 15;
          const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;

          setSelectedHour(hour12);
          setSelectedMinute(finalMinute);
          setSelectedAmPm(ampm);

          // Validate and set initial time
          const validation = validateTimePickerSelection(hour12, finalMinute, ampm, date);
          if (validation.valid) {
            const time24 = formatTime24(hour12, finalMinute, ampm);
            setSelectedTime(time24);
            setTimeValidationError(null);
            onTimeChange(time24);
            onValidationChange(true);

            // Scroll to initial position after a short delay
            setTimeout(() => {
              const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
              const hourOffset = (hour12 - 1) * itemHeight;
              const minuteIndex = [0, 15, 30, 45].indexOf(finalMinute);
              const minuteOffset = minuteIndex * itemHeight;
              hourScrollRef.current?.scrollTo({ y: hourOffset, animated: true });
              minuteScrollRef.current?.scrollTo({ y: minuteOffset, animated: true });
            }, 100);
          } else {
            setSelectedTime(null);
            setTimeValidationError(null); // Don't show error on initial load
            onTimeChange(null);
            onValidationChange(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setExistingBookings([]);
      setTimeSelectionMode('picker'); // Default to picker mode on error
    } finally {
      setLoadingBookings(false);
    }
  };

  // Handle time picker selection
  const handleTimePickerChange = (hour, minute, ampm) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedAmPm(ampm);

    const validation = validateTimePickerSelection(hour, minute, ampm);
    if (validation.valid) {
      const time24 = formatTime24(hour, minute, ampm);
      setSelectedTime(time24);
      setTimeValidationError(null);
      onTimeChange(time24);
      onValidationChange(true);
    } else {
      const time24 = formatTime24(hour, minute, ampm);
      setSelectedTime(time24); // Still show the time even if invalid
      setTimeValidationError(validation.error || 'Selected time is outside operating hours');
      onTimeChange(time24);
      onValidationChange(false);
    }
  };

  // Handle scroll events for hour picker
  const handleHourScroll = (event) => {
    const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / itemHeight);
    const hour = Math.max(1, Math.min(12, index + 1));

    if (hour !== selectedHour) {
      handleTimePickerChange(hour, selectedMinute, selectedAmPm);
    }
  };

  // Handle scroll events for minute picker
  const handleMinuteScroll = (event) => {
    const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / itemHeight);
    const minutes = [0, 15, 30, 45];
    const minute = minutes[Math.max(0, Math.min(3, index))];

    if (minute !== selectedMinute) {
      handleTimePickerChange(selectedHour, minute, selectedAmPm);
    }
  };

  // Get operating hours display text
  const getOperatingHoursText = () => {
    if (!selectedDate) return '';
    const hours = getSalonHoursForDate(selectedDate);
    if (!hours || !hours.openTime || !hours.closeTime || hours.isClosed) return '';

    const formatTime12 = (time24) => {
      const [hours, minutes] = time24.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return `${formatTime12(hours.openTime)} - ${formatTime12(hours.closeTime)}`;
  };

  const styles = {
    timeSelectionSection: {
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
    },
    sectionTitle: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.6) : responsive.responsive.fontSize(1.7),
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.9)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    operatingHoursText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.3) : responsive.responsive.fontSize(1.4),
      color: "rgba(255, 255, 255, 0.7)",
      textAlign: "center",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    loadingContainer: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      alignItems: "center",
    },
    loadingText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.5) : responsive.responsive.fontSize(1.6),
      color: "rgba(255, 255, 255, 0.8)",
    },
    timePickerContainer: {
      alignItems: "center",
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    timePickerWrapper: {
      width: "100%",
      alignItems: "center",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    timePickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      position: "relative",
      height: responsive.isSmallScreen ? responsive.responsive.height(22) : responsive.responsive.height(26),
    },
    timePickerColumn: {
      alignItems: "center",
      marginHorizontal: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      flex: 1,
      maxWidth: responsive.isSmallScreen ? responsive.responsive.width(25) : responsive.responsive.width(22),
      height: "100%",
    },
    timePickerLabel: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.0) : responsive.responsive.fontSize(1.1),
      color: "rgba(255, 255, 255, 0.6)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    timePickerScrollView: {
      height: responsive.isSmallScreen ? responsive.responsive.height(22) : responsive.responsive.height(26),
      width: "100%",
    },
    timePickerItem: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12),
    },
    timePickerItemText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      color: "rgba(255, 255, 255, 0.4)",
      fontWeight: "500",
    },
    timePickerItemSelected: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: borderRadius.md || 12,
      transform: [{ scale: 1.05 }],
    },
    timePickerItemSelectedText: {
      color: "white",
      fontWeight: "bold",
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.2) : responsive.responsive.fontSize(2.4),
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    timePickerSelectionIndicator: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      marginTop: responsive.isSmallScreen ? responsive.responsive.height(-5) : responsive.responsive.height(-6),
      height: responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12),
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: borderRadius.md || 12,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.3)",
      zIndex: -1,
    },
    amPmContainer: {
      flexDirection: "row",
      marginTop: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    amPmButton: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      borderRadius: borderRadius.md || 8,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      minWidth: responsive.isSmallScreen ? responsive.responsive.width(20) : responsive.responsive.width(22),
      marginHorizontal: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    amPmButtonSelected: {
      backgroundColor: colors.accent || "#EC4899",
      borderColor: colors.accent || "#EC4899",
      borderWidth: 2,
    },
    amPmButtonText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.6) : responsive.responsive.fontSize(1.7),
      color: "rgba(255, 255, 255, 0.8)",
      fontWeight: "600",
      textAlign: "center",
    },
    amPmButtonSelectedText: {
      color: "white",
      fontWeight: "bold",
    },
    selectedTimeDisplay: {
      marginTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: borderRadius.lg || 16,
      borderWidth: 2,
      borderColor: colors.accent || "#EC4899",
      alignItems: "center",
      shadowColor: colors.accent || "#EC4899",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      width: "100%",
      maxWidth: responsive.isSmallScreen ? responsive.responsive.width(80) : responsive.responsive.width(70),
    },
    selectedTimeDisplayError: {
      borderColor: colors.status?.error || "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    selectedTimeLabel: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.0) : responsive.responsive.fontSize(1.1),
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    selectedTimeValue: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.4) : responsive.responsive.fontSize(2.6),
      color: "white",
      fontWeight: "bold",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    timeValidationError: {
      marginTop: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      borderRadius: borderRadius.md || 8,
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.4)",
      alignItems: "center",
    },
    timeValidationErrorText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.2) : responsive.responsive.fontSize(1.3),
      color: "#FFB3B3",
      textAlign: "center",
      fontWeight: "500",
    },
  };

  if (!selectedDate) return null;

  return (
    <View style={styles.timeSelectionSection}>
      <ThemedText style={styles.sectionTitle}>
        Select Time
      </ThemedText>

      {getOperatingHoursText() && (
        <ThemedText style={styles.operatingHoursText}>
          Operating Hours: {getOperatingHoursText()}
        </ThemedText>
      )}

      {loadingBookings ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>
            Loading available times...
          </ThemedText>
        </View>
      ) : timeSelectionMode === 'picker' ? (
        // Mode 1: No Bookings - Beautiful Time Picker
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerWrapper}>
            <View style={styles.timePickerRow}>
              {/* Selection Indicator Background */}
              <View style={styles.timePickerSelectionIndicator} />

              {/* Hour Picker */}
              <View style={styles.timePickerColumn}>
                <ThemedText style={styles.timePickerLabel}>Hour</ThemedText>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.timePickerScrollView}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  snapToInterval={responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12)}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleHourScroll}
                  onScrollEndDrag={handleHourScroll}
                  contentContainerStyle={{
                    paddingVertical: responsive.isSmallScreen ? responsive.responsive.height(6) : responsive.responsive.height(7),
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timePickerItem,
                        selectedHour === hour && styles.timePickerItemSelected,
                      ]}
                      onPress={() => {
                        handleTimePickerChange(hour, selectedMinute, selectedAmPm);
                        // Scroll to selected item
                        const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
                        const offset = (hour - 1) * itemHeight;
                        hourScrollRef.current?.scrollTo({ y: offset, animated: true });
                      }}
                      activeOpacity={0.8}
                    >
                      <ThemedText
                        style={[
                          styles.timePickerItemText,
                          selectedHour === hour && styles.timePickerItemSelectedText,
                        ]}
                      >
                        {hour}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.timePickerColumn}>
                <ThemedText style={styles.timePickerLabel}>Minute</ThemedText>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.timePickerScrollView}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  snapToInterval={responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12)}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinuteScroll}
                  onScrollEndDrag={handleMinuteScroll}
                  contentContainerStyle={{
                    paddingVertical: responsive.isSmallScreen ? responsive.responsive.height(6) : responsive.responsive.height(7),
                  }}
                >
                  {[0, 15, 30, 45].map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timePickerItem,
                        selectedMinute === minute && styles.timePickerItemSelected,
                      ]}
                      onPress={() => {
                        handleTimePickerChange(selectedHour, minute, selectedAmPm);
                        // Scroll to selected item
                        const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
                        const minuteIndex = [0, 15, 30, 45].indexOf(minute);
                        const offset = minuteIndex * itemHeight;
                        minuteScrollRef.current?.scrollTo({ y: offset, animated: true });
                      }}
                      activeOpacity={0.8}
                    >
                      <ThemedText
                        style={[
                          styles.timePickerItemText,
                          selectedMinute === minute && styles.timePickerItemSelectedText,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* AM/PM Toggle */}
          <View style={styles.amPmContainer}>
            <TouchableOpacity
              style={[
                styles.amPmButton,
                selectedAmPm === 'AM' && styles.amPmButtonSelected,
              ]}
              onPress={() => handleTimePickerChange(selectedHour, selectedMinute, 'AM')}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.amPmButtonText,
                  selectedAmPm === 'AM' && styles.amPmButtonSelectedText,
                ]}
              >
                AM
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.amPmButton,
                selectedAmPm === 'PM' && styles.amPmButtonSelected,
              ]}
              onPress={() => handleTimePickerChange(selectedHour, selectedMinute, 'PM')}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.amPmButtonText,
                  selectedAmPm === 'PM' && styles.amPmButtonSelectedText,
                ]}
              >
                PM
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Selected Time Display */}
          {selectedTime && (
            <View style={[
              styles.selectedTimeDisplay,
              timeValidationError && styles.selectedTimeDisplayError
            ]}>
              <ThemedText style={styles.selectedTimeLabel}>
                {timeValidationError ? 'Invalid Time' : 'Selected Time'}
              </ThemedText>
              <ThemedText style={styles.selectedTimeValue}>
                {formatTimeDisplay(selectedTime)}
              </ThemedText>
              {timeValidationError && (
                <View style={styles.timeValidationError}>
                  <ThemedText style={styles.timeValidationErrorText}>
                    {timeValidationError}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      ) : timeSelectionMode === 'slots' ? (
        // Mode 2: Has Bookings - Time Slot Cards (Placeholder for future implementation)
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>
            Time slot cards will be implemented here
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

