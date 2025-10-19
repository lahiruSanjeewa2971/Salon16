import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Calendar } from 'react-native-calendars';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';
import { salonHoursService } from '../../../../services/firebaseService';

export default function BookingsCalendar({ 
  animatedStyle, 
  onDateSelect, 
  onDayLongPress,
  bookings = [], 
  selectedDate,
  refreshTrigger = 0
}) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Define today outside of useMemo so it can be used in Calendar component
  const today = new Date().toISOString().split('T')[0];

  // Salon status state
  const [salonStatus, setSalonStatus] = useState({});
  const [isLoadingSalonStatus, setIsLoadingSalonStatus] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch salon status for the current month
  const fetchSalonStatus = useCallback(async (month) => {
    try {
      setIsLoadingSalonStatus(true);
      
      // Calculate start and end dates for the month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      console.log(`📅 BookingsCalendar: Fetching salon status for ${startDateString} to ${endDateString}`);
      
      const status = await salonHoursService.getSalonStatusForCalendar(startDateString, endDateString);
      setSalonStatus(status);
      
      console.log(`📊 BookingsCalendar: Loaded salon status for ${Object.keys(status).length} days`);
    } catch (error) {
      console.error('❌ BookingsCalendar: Error fetching salon status:', error);
      // Set empty status on error - will fall back to default styling
      setSalonStatus({});
    } finally {
      setIsLoadingSalonStatus(false);
    }
  }, []);

  // Fetch salon status on component mount and when month changes
  useEffect(() => {
    fetchSalonStatus(currentMonth);
  }, [currentMonth, fetchSalonStatus]);

  // Handle refresh trigger from parent component
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('📅 BookingsCalendar: Refresh triggered, refetching salon status');
      fetchSalonStatus(currentMonth);
    }
  }, [refreshTrigger, fetchSalonStatus, currentMonth]);

  // Handle month change in calendar
  const handleMonthChange = useCallback((month) => {
    const newMonth = new Date(month.dateString);
    setCurrentMonth(newMonth);
  }, []);

  // Get salon status color for a date
  const getSalonStatusColor = useCallback((dateString) => {
    const status = salonStatus[dateString];
    if (!status) return null; // No status data available
    
    if (status.isClosed || status.isHoliday) {
      return colors.status?.error || '#EF4444'; // Red for closed
    } else if (status.disableBookings) {
      return colors.status?.warning || '#F59E0B'; // Orange for bookings disabled
    } else {
      return colors.status?.success || '#10B981'; // Green for open
    }
  }, [salonStatus, colors.status]);

  // Get salon status indicator for a date
  const getSalonStatusIndicator = useCallback((dateString) => {
    const status = salonStatus[dateString];
    if (!status) return null;
    
    if (status.isHoliday) return '🎉'; // Holiday marker
    if (status.dayOfWeek === 2 && status.isClosed && !status.isTuesdayOverride) return '🔒'; // Tuesday closure
    if (status.disableBookings) return '⚠️'; // Bookings disabled
    if (status.isClosed) return '❌'; // Closed
    return '✅'; // Open
  }, [salonStatus]);

  // Process bookings and salon status to mark dates - memoized to prevent unnecessary re-renders
  const markedDates = useMemo(() => {
    const marked = {};
    
    // Mark today with special styling
    marked[today] = {
      marked: true,
      dotColor: colors?.primary || '#8B5CF6',
      selected: selectedDate === today,
      selectedColor: colors?.primary || '#8B5CF6',
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: colors?.primary || '#8B5CF6',
          borderRadius: 8,
        }
      }
    };

    // Mark dates with salon status
    Object.keys(salonStatus).forEach(dateString => {
      const status = salonStatus[dateString];
      const statusColor = getSalonStatusColor(dateString);
      const statusIndicator = getSalonStatusIndicator(dateString);
      
      if (statusColor) {
        marked[dateString] = {
          ...marked[dateString], // Preserve existing booking marks
          marked: true,
          dotColor: statusColor,
          selected: selectedDate === dateString,
          selectedColor: colors?.primary || '#8B5CF6',
          customStyles: {
            container: {
              backgroundColor: statusColor + '20', // 20% opacity background
              borderRadius: 8,
              borderWidth: status.isSpecific ? 1 : 0, // Border for specific overrides
              borderColor: statusColor,
            },
            text: {
              color: statusColor,
              fontWeight: status.isSpecific ? 'bold' : 'normal',
            }
          },
          // Add custom data for tooltip/legend
          salonStatus: {
            isClosed: status.isClosed,
            disableBookings: status.disableBookings,
            isHoliday: status.isHoliday,
            isTuesdayOverride: status.isTuesdayOverride,
            dayName: status.dayName,
            indicator: statusIndicator,
            isSpecific: status.isSpecific
          }
        };
      }
    });

    // Mark dates with bookings (overlay on salon status)
    bookings.forEach(booking => {
      const bookingDate = booking.date;
      if (bookingDate) {
        marked[bookingDate] = {
          ...marked[bookingDate], // Preserve salon status
          marked: true,
          dotColor: colors?.success || '#10B981',
          selected: selectedDate === bookingDate,
          selectedColor: colors?.primary || '#8B5CF6',
          // Add booking indicator
          customStyles: {
            ...marked[bookingDate]?.customStyles,
            container: {
              ...marked[bookingDate]?.customStyles?.container,
              // Add booking indicator
              position: 'relative',
            }
          }
        };
      }
    });

    return marked;
  }, [bookings, selectedDate, salonStatus, getSalonStatusColor, getSalonStatusIndicator, colors?.primary, colors?.success, today]);

  const handleDateSelect = (day) => {
    // Single click - keep current implementation
    if (onDateSelect) {
      onDateSelect(day.dateString);
    }
  };

  const handleDayLongPress = (day) => {
    // Long press - open bottom sheet for that day
    if (onDayLongPress) {
      onDayLongPress(day.dateString);
    }
  };

  const styles = {
    calendarContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    calendarHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    calendarSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    calendarWrapper: {
      padding: spacing.md,
    },
    legendContainer: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    legendTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    legendItems: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.xs,
    },
    legendText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
    },
    loadingText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <ThemedText style={styles.calendarTitle}>📅 Calendar View</ThemedText>
          <ThemedText style={styles.calendarSubtitle}>
            Tap to select date • Long press to open booking sheet
          </ThemedText>
        </View>
        
        <View style={styles.calendarWrapper}>
          <Calendar
            current={today}
            onDayPress={handleDateSelect}
            onDayLongPress={handleDayLongPress}
            onMonthChange={handleMonthChange}
            monthFormat={'MMMM yyyy'}
            hideExtraDays={true}
            firstDay={1}
            showWeekNumbers={false}
            disableMonthChange={false}
            enableSwipeMonths={true}
            markedDates={markedDates}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: 'white',
              selectedDayBackgroundColor: colors?.primary || '#8B5CF6',
              selectedDayTextColor: 'white',
              todayTextColor: colors?.primary || '#8B5CF6',
              dayTextColor: 'white',
              textDisabledColor: 'rgba(255, 255, 255, 0.3)',
              dotColor: colors?.success || '#10B981',
              selectedDotColor: 'white',
              arrowColor: 'white',
              disabledArrowColor: 'rgba(255, 255, 255, 0.3)',
              monthTextColor: 'white',
              indicatorColor: colors?.primary || '#8B5CF6',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={{
              height: 350,
            }}
          />
          
          {/* Salon Status Legend */}
          <View style={styles.legendContainer}>
            <ThemedText style={styles.legendTitle}>Salon Status</ThemedText>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.status?.success || '#10B981' }]} />
                <ThemedText style={styles.legendText}>Open</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.status?.warning || '#F59E0B' }]} />
                <ThemedText style={styles.legendText}>Bookings Disabled</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.status?.error || '#EF4444' }]} />
                <ThemedText style={styles.legendText}>Closed</ThemedText>
              </View>
            </View>
            {isLoadingSalonStatus && (
              <ThemedText style={styles.loadingText}>
                {refreshTrigger > 0 ? 'Refreshing salon status...' : 'Loading salon status...'}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
