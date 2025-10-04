import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Calendar } from 'react-native-calendars';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function BookingsCalendar({ animatedStyle, onDateSelect, bookings = [], selectedDate }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Define today outside of useMemo so it can be used in Calendar component
  const today = new Date().toISOString().split('T')[0];

  // Process bookings to mark dates with appointments - memoized to prevent unnecessary re-renders
  const markedDates = useMemo(() => {
    const marked = {};
    
    // Mark today
    marked[today] = {
      marked: true,
      dotColor: colors?.primary || '#8B5CF6',
      selected: selectedDate === today,
      selectedColor: colors?.primary || '#8B5CF6',
    };

    // Mark dates with bookings
    bookings.forEach(booking => {
      const bookingDate = booking.date;
      if (bookingDate) {
        marked[bookingDate] = {
          marked: true,
          dotColor: colors?.success || '#10B981',
          selected: selectedDate === bookingDate,
          selectedColor: colors?.primary || '#8B5CF6',
        };
      }
    });

    return marked;
  }, [bookings, selectedDate, colors?.primary, colors?.success, today]);

  const handleDateSelect = (day) => {
    // Only call the parent handler, don't manage local state
    if (onDateSelect) {
      onDateSelect(day.dateString);
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
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <ThemedText style={styles.calendarTitle}>📅 Calendar View</ThemedText>
          <ThemedText style={styles.calendarSubtitle}>
            Select a date to view appointments
          </ThemedText>
        </View>
        
        <View style={styles.calendarWrapper}>
          <Calendar
            current={today}
            onDayPress={handleDateSelect}
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
        </View>
      </View>
    </Animated.View>
  );
}
