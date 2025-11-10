import { Ionicons } from "@expo/vector-icons";
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
  refreshTrigger, // Optional: trigger to refresh slots
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
  
  // Time slots state (for Mode 2)
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

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

  // Format time from Date object to 24-hour format
  const formatTime24FromDate = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format time from Date object to 12-hour display format
  const formatTimeFromDate = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return {
      time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`,
      hour: displayHours,
      minute: minutes,
      ampm: ampm
    };
  };

  /**
   * Check if a time slot conflicts with existing bookings (with buffer)
   * @param {Date} startTime - Slot start time
   * @param {Date} endTime - Slot end time
   * @param {Array} existingBookings - Existing bookings
   * @param {number} bufferMinutes - Buffer time in minutes (default: 20)
   * @returns {boolean} - True if slot is booked/unavailable
   */
  const isSlotBooked = (startTime, endTime, existingBookings, bufferMinutes = 20) => {
    if (!existingBookings || existingBookings.length === 0) return false;

    return existingBookings.some(booking => {
      // Ignore cancelled bookings
      if (booking.status === 'cancelled') return false;

      const bookingStart = new Date(`${booking.date}T${booking.time}`);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + (booking.serviceDuration || 30));

      // Add buffer time: 20 minutes before and after each booking
      const bookingStartWithBuffer = new Date(bookingStart);
      bookingStartWithBuffer.setMinutes(bookingStartWithBuffer.getMinutes() - bufferMinutes);

      const bookingEndWithBuffer = new Date(bookingEnd);
      bookingEndWithBuffer.setMinutes(bookingEndWithBuffer.getMinutes() + bufferMinutes);

      // Check for overlap (including buffer zones)
      // Slot is unavailable if it overlaps with booking + buffer
      return (startTime < bookingEndWithBuffer && endTime > bookingStartWithBuffer);
    });
  };

  /**
   * Generate available time slots for a date (when bookings exist)
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} salonHours - Salon hours for the date
   * @param {number} serviceDuration - Service duration in minutes (from selected service)
   * @param {Array} existingBookings - Existing bookings for the date
   * @param {number} bufferMinutes - Buffer time between bookings (default: 20)
   * @returns {Array} - Array of time slot objects
   */
  const generateTimeSlots = (date, salonHours, serviceDuration, existingBookings, bufferMinutes = 20) => {
    const slots = [];

    if (!salonHours || !salonHours.openTime || !salonHours.closeTime || salonHours.isClosed) {
      return slots;
    }

    // Parse open and close times
    const [openHour, openMinute] = salonHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = salonHours.closeTime.split(':').map(Number);

    const openTime = new Date(date + 'T00:00:00');
    openTime.setHours(openHour, openMinute, 0, 0);

    const closeTime = new Date(date + 'T00:00:00');
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    // Check if date is "Today" - filter out past times
    const isTodayDate = isToday(date);
    const now = new Date();
    const earliestTime = isTodayDate ? getEarliestValidTime() : null;

    // Generate slots based on service duration
    // Slot interval = service duration (ensures each slot can accommodate the full service)
    // For very short services (< 15 min), use 15-minute intervals for better UX
    // For longer services, use the service duration as interval
    const slotInterval = serviceDuration < 15 ? 15 : serviceDuration;
    const currentTime = new Date(openTime);

    while (currentTime < closeTime) {
      // Skip if this is today and time is in the past
      if (isTodayDate && earliestTime && currentTime < earliestTime) {
        currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
        continue;
      }

      const slotEndTime = new Date(currentTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + serviceDuration);

      // Check if slot ends before closing time (accounting for service duration)
      if (slotEndTime <= closeTime) {
        const timeFormatted = formatTimeFromDate(currentTime);

        // Check if slot conflicts with existing bookings (including buffer)
        const isAvailable = !isSlotBooked(
          currentTime,
          slotEndTime,
          existingBookings,
          bufferMinutes
        );

        slots.push({
          time: timeFormatted.time,
          time24: formatTime24FromDate(currentTime),
          isAvailable: isAvailable,
          startTime: new Date(currentTime),
          endTime: slotEndTime,
          hour: timeFormatted.hour,
          minute: timeFormatted.minute,
          ampm: timeFormatted.ampm
        });
      }

      // Move to next slot using service-based interval
      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }

    return slots;
  };

  // Check if selected date is "Today"
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr + 'T00:00:00');
    selectedDate.setHours(0, 0, 0, 0);
    return today.getTime() === selectedDate.getTime();
  };

  // Get earliest valid time for "Today" (current time rounded up to next 15-minute interval)
  const getEarliestValidTime = () => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    // Round up to next 15-minute interval
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    const earliestTime = new Date(now);
    if (roundedMinutes >= 60) {
      earliestTime.setHours(earliestTime.getHours() + 1);
      earliestTime.setMinutes(0);
    } else {
      earliestTime.setMinutes(roundedMinutes);
    }
    earliestTime.setSeconds(0);
    earliestTime.setMilliseconds(0);
    return earliestTime;
  };

  // Check if a time option is disabled for "Today" (past time)
  const isTimeOptionDisabled = (hour, minute, ampm) => {
    if (!isToday(selectedDate)) return false;
    
    const earliestValidTime = getEarliestValidTime();
    const time24 = formatTime24(hour, minute, ampm);
    const selectedDateTime = new Date(selectedDate + 'T' + time24);
    
    return selectedDateTime < earliestValidTime;
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

    // For "Today", check if selected time is in the past
    if (isToday(date)) {
      const earliestValidTime = getEarliestValidTime();
      if (selectedDateTime < earliestValidTime) {
        const formatTime12 = (dateObj) => {
          const hours = dateObj.getHours();
          const minutes = dateObj.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        return { valid: false, error: `Please select a time after ${formatTime12(earliestValidTime)}` };
      }
    }

    // Check if service duration fits before closing (including 20-minute buffer)
    const bufferMinutes = 20;
    const serviceEndTime = new Date(selectedDateTime);
    serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration + bufferMinutes);

    if (serviceEndTime > closeTime) {
      return { valid: false, error: 'Service duration exceeds closing time' };
    }

    return { valid: true };
  };

  // Track previous date and refresh trigger to detect changes
  const prevDateRef = useRef(selectedDate);
  const prevRefreshTriggerRef = useRef(refreshTrigger || 0);

  // Load existing bookings for selected date
  useEffect(() => {
    if (selectedDate) {
      const isDateChange = prevDateRef.current !== null && prevDateRef.current !== selectedDate;
      const isRefresh = refreshTrigger !== undefined && refreshTrigger > prevRefreshTriggerRef.current;
      
      // Update refs
      if (isDateChange) {
        prevDateRef.current = selectedDate;
      }
      if (isRefresh) {
        prevRefreshTriggerRef.current = refreshTrigger;
      }
      
      // If refresh trigger changed (not initial load), clear selection
      if (isRefresh && !isDateChange) {
        // Only refresh if date hasn't changed (date change already handles clearing)
        setSelectedSlotIndex(null);
        setSelectedTime(null);
        setSelectedHour(9);
        setSelectedMinute(30);
        setSelectedAmPm('AM');
        setTimeValidationError(null);
        onTimeChange(null);
        onValidationChange(false);
      } else if (isDateChange) {
        // Clear time selection when date changes
        setSelectedTime(null);
        setSelectedHour(9);
        setSelectedMinute(30);
        setSelectedAmPm('AM');
        setTimeValidationError(null);
        setSelectedSlotIndex(null);
        onTimeChange(null);
        onValidationChange(false);
        prevDateRef.current = selectedDate;
      }
      
      loadExistingBookings(selectedDate, isDateChange && !isRefresh);
    } else {
      setExistingBookings([]);
      setTimeSelectionMode(null);
      setSelectedTime(null);
      setSelectedHour(9);
      setSelectedMinute(30);
      setSelectedAmPm('AM');
      setTimeValidationError(null);
      onTimeChange(null);
      onValidationChange(false);
      prevDateRef.current = null;
    }
  }, [selectedDate, refreshTrigger]); // Add refreshTrigger as dependency

  const loadExistingBookings = async (date, skipAutoInit = false) => {
    console.log("🔍 TimeSelectionSection: Load existing bookings called");
    console.log("🔍 TimeSelectionSection: Date parameter:", date);
    console.log("🔍 TimeSelectionSection: Date type:", typeof date);
    console.log("🔍 TimeSelectionSection: Date value:", JSON.stringify(date));
    
    setLoadingBookings(true);
    try {
      const bookings = await bookingService.getBookingsByDate(date);
      console.log("📊 TimeSelectionSection: Bookings loaded:", bookings?.length || 0);
      console.log("📊 TimeSelectionSection: Bookings array:", bookings);
      setExistingBookings(bookings || []);

      // Determine time selection mode
      const hasBookings = bookings && bookings.length > 0;
      setTimeSelectionMode(hasBookings ? 'slots' : 'picker');

      if (hasBookings) {
        // Mode 2: Generate time slots
        const hours = getSalonHoursForDate(date);
        if (hours && service) {
          const slots = generateTimeSlots(
            date,
            hours,
            service.duration,
            bookings || [],
            20 // 20-minute buffer
          );
          setTimeSlots(slots);
          // Clear any previous selection
          setSelectedSlotIndex(null);
          setSelectedTime(null);
          onTimeChange(null);
          onValidationChange(false);
        }
      } else {
        // Mode 1: Initialize time picker with salon opening time
        // Skip auto-initialization if this is a date change (user should manually select time)
        if (!skipAutoInit) {
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
        // Clear slots when switching to picker mode
        setTimeSlots([]);
        setSelectedSlotIndex(null);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setExistingBookings([]);
      setTimeSelectionMode('picker'); // Default to picker mode on error
      setTimeSlots([]);
      setSelectedSlotIndex(null);
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

  // Handle time slot selection (Mode 2)
  const handleSlotSelect = (slotIndex) => {
    const slot = timeSlots[slotIndex];
    if (!slot || !slot.isAvailable) return;

    setSelectedSlotIndex(slotIndex);
    setSelectedTime(slot.time24);
    setTimeValidationError(null);
    onTimeChange(slot.time24);
    onValidationChange(true);
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
      marginBottom: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    timeErrorContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      borderRadius: borderRadius.md || 12,
      borderWidth: 1,
      borderColor: colors.status?.error || "#EF4444",
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      marginHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    timeErrorIcon: {
      marginRight: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    timeErrorText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.4) : responsive.responsive.fontSize(1.5),
      color: "#FFB3B3",
      fontWeight: "600",
      textAlign: "center",
      flex: 1,
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
      // marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
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
      height: responsive.isSmallScreen ? responsive.responsive.height(27) : responsive.responsive.height(26),
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
      paddingVertical: 0,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      height: responsive.isSmallScreen ? responsive.responsive.height(8) : responsive.responsive.height(12),
      minHeight: responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12),
    },
    timePickerItemText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      color: "rgba(255, 255, 255, 0.4)",
      fontWeight: "500",
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
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
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
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
    // Time Slots Styles (Mode 2)
    timeSlotsContainer: {
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderRadius: borderRadius.lg || 16,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.4)',
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
    },
    infoIcon: {
      marginRight: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
    },
    infoText: {
      flex: 1,
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.4) : responsive.responsive.fontSize(1.5),
      color: 'rgba(255, 255, 255, 0.95)',
      lineHeight: responsive.isSmallScreen ? 20 : 22,
    },
    timeSlotsScrollView: {
      maxHeight: responsive.isSmallScreen ? responsive.responsive.height(40) : responsive.responsive.height(45),
    },
    timeSlotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
    },
    timeSlotCard: {
      width: responsive.isSmallScreen ? responsive.responsive.width(29) : responsive.responsive.width(28),
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
      borderRadius: borderRadius.lg || 16,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginHorizontal: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    timeSlotCardSelected: {
      backgroundColor: colors.accent || '#EC4899',
      borderColor: colors.accent || '#EC4899',
      borderWidth: 2,
      shadowColor: colors.accent || '#EC4899',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
      transform: [{ scale: 1.05 }],
    },
    timeSlotCardDisabled: {
      opacity: 0.4,
      backgroundColor: 'rgba(107, 114, 128, 0.2)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
    },
    timeSlotTime: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.8) : responsive.responsive.fontSize(2.0),
      fontWeight: 'bold',
      color: 'white',
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    timeSlotTimeSelected: {
      color: 'white',
    },
    timeSlotTimeDisabled: {
      color: 'rgba(255, 255, 255, 0.5)',
    },
    timeSlotAmPm: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.2) : responsive.responsive.fontSize(1.3),
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    timeSlotAmPmSelected: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    timeSlotAmPmDisabled: {
      color: 'rgba(255, 255, 255, 0.4)',
    },
    timeSlotIndicator: {
      marginTop: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    emptySlotsContainer: {
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.xl : responsive.spacing.xxl,
      alignItems: 'center',
    },
    emptySlotsText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.5) : responsive.responsive.fontSize(1.6),
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
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

      {/* Error Message - Display after Operating Hours */}
      {timeValidationError && (
        <View style={styles.timeErrorContainer}>
          <Ionicons
            name="alert-circle"
            size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
            color={colors.status?.error || "#EF4444"}
            style={styles.timeErrorIcon}
          />
          <ThemedText style={styles.timeErrorText}>
            {timeValidationError}
          </ThemedText>
        </View>
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
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                    const isDisabled = isTimeOptionDisabled(hour, selectedMinute, selectedAmPm);
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timePickerItem,
                          selectedHour === hour && styles.timePickerItemSelected,
                        ]}
                        onPress={() => {
                          if (!isDisabled) {
                            handleTimePickerChange(hour, selectedMinute, selectedAmPm);
                            // Scroll to selected item
                            const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
                            const offset = (hour - 1) * itemHeight;
                            hourScrollRef.current?.scrollTo({ y: offset, animated: true });
                          }
                        }}
                        disabled={isDisabled}
                        activeOpacity={isDisabled ? 1 : 0.8}
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
                    );
                  })}
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
                  {[0, 15, 30, 45].map((minute) => {
                    const isDisabled = isTimeOptionDisabled(selectedHour, minute, selectedAmPm);
                    return (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timePickerItem,
                          selectedMinute === minute && styles.timePickerItemSelected,
                        ]}
                        onPress={() => {
                          if (!isDisabled) {
                            handleTimePickerChange(selectedHour, minute, selectedAmPm);
                            // Scroll to selected item
                            const itemHeight = responsive.isSmallScreen ? responsive.responsive.height(10) : responsive.responsive.height(12);
                            const minuteIndex = [0, 15, 30, 45].indexOf(minute);
                            const offset = minuteIndex * itemHeight;
                            minuteScrollRef.current?.scrollTo({ y: offset, animated: true });
                          }
                        }}
                        disabled={isDisabled}
                        activeOpacity={isDisabled ? 1 : 0.8}
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
                    );
                  })}
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
              onPress={() => {
                if (!isTimeOptionDisabled(selectedHour, selectedMinute, 'AM')) {
                  handleTimePickerChange(selectedHour, selectedMinute, 'AM');
                }
              }}
              disabled={isTimeOptionDisabled(selectedHour, selectedMinute, 'AM')}
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
              onPress={() => {
                if (!isTimeOptionDisabled(selectedHour, selectedMinute, 'PM')) {
                  handleTimePickerChange(selectedHour, selectedMinute, 'PM');
                }
              }}
              disabled={isTimeOptionDisabled(selectedHour, selectedMinute, 'PM')}
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
        // Mode 2: Has Bookings - Time Slot Cards
        <View style={styles.timeSlotsContainer}>
          {/* Info Message Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle"
              size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)}
              color="rgba(255, 255, 255, 0.9)"
              style={styles.infoIcon}
            />
            <ThemedText style={styles.infoText}>
              {isToday(selectedDate) ? 'Today' : 'This date'} has bookings. Please select your preferred time among these available slots.
            </ThemedText>
          </View>

          {/* Time Slots Grid */}
          {timeSlots.length === 0 ? (
            <View style={styles.emptySlotsContainer}>
              <ThemedText style={styles.emptySlotsText}>
                No available time slots for this date
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.timeSlotsScrollView}
              contentContainerStyle={styles.timeSlotsGrid}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {timeSlots.map((slot, index) => {
                const isSelected = selectedSlotIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlotCard,
                      isSelected && styles.timeSlotCardSelected,
                      !slot.isAvailable && styles.timeSlotCardDisabled,
                    ]}
                    onPress={() => handleSlotSelect(index)}
                    disabled={!slot.isAvailable}
                    activeOpacity={slot.isAvailable ? 0.7 : 1}
                  >
                    <ThemedText
                      style={[
                        styles.timeSlotTime,
                        isSelected && styles.timeSlotTimeSelected,
                        !slot.isAvailable && styles.timeSlotTimeDisabled,
                      ]}
                    >
                      {slot.hour}:{slot.minute.toString().padStart(2, '0')}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.timeSlotAmPm,
                        isSelected && styles.timeSlotAmPmSelected,
                        !slot.isAvailable && styles.timeSlotAmPmDisabled,
                      ]}
                    >
                      {slot.ampm}
                    </ThemedText>
                    <View style={styles.timeSlotIndicator}>
                      {slot.isAvailable ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={responsive.isSmallScreen ? responsive.responsive.width(4.5) : responsive.responsive.width(5)}
                          color={isSelected ? 'white' : (colors.status?.success || '#10B981')}
                        />
                      ) : (
                        <Ionicons
                          name="close-circle"
                          size={responsive.isSmallScreen ? responsive.responsive.width(4.5) : responsive.responsive.width(5)}
                          color={colors.status?.error || '#EF4444'}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

