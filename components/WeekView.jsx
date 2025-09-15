import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const TIME_LABEL_WIDTH = 80;
const DAY_COLUMN_WIDTH = (screenWidth - TIME_LABEL_WIDTH - 40) / 3; // 3 days, minus time label and margins
const TIME_SLOT_HEIGHT = 60;
const CALENDAR_HEIGHT = 400; // Fixed height for scrolling

export default function WeekView({ onTimeSlotPress, isToastShowing = false }) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  // Time slots (rows)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  // Get next 3 days (Today, Tomorrow, Day After Tomorrow)
  const getNextThreeDays = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    return [
      { 
        date: today, 
        label: 'Today', 
        shortLabel: 'TODAY',
        dayName: today.toLocaleDateString('en-US', { weekday: 'short' })
      },
      { 
        date: tomorrow, 
        label: 'Tomorrow', 
        shortLabel: 'TOMORROW',
        dayName: tomorrow.toLocaleDateString('en-US', { weekday: 'short' })
      },
      { 
        date: dayAfterTomorrow, 
        label: 'Day After', 
        shortLabel: 'DAY AFTER',
        dayName: dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'short' })
      }
    ];
  };

  useEffect(() => {
    fadeAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    slideAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const getAvailabilityForTimeSlot = (timeSlot, date) => {
    const dayOfWeek = date.getDay();
    
    // Tuesday is closed
    if (dayOfWeek === 2) {
      return false;
    }
    
    // Define availability for each day and time slot
    const availability = {
      0: ['09:00', '10:30', '14:00', '15:30', '16:00'], // Sunday
      1: ['08:00', '09:30', '11:00', '13:00', '14:30', '16:30'], // Monday
      2: [], // Tuesday - Closed
      3: ['09:00', '10:00', '11:30', '13:30', '15:00', '17:00'], // Wednesday
      4: ['08:30', '10:30', '12:00', '14:00', '15:30', '17:30'], // Thursday
      5: ['09:00', '10:30', '12:30', '14:30', '16:00', '18:00'], // Friday
      6: ['08:00', '09:30', '11:00', '13:00', '14:30', '16:30', '18:30'] // Saturday
    };
    
    const availableTimes = availability[dayOfWeek] || [];
    return availableTimes.includes(timeSlot);
  };

  const handleTimeSlotPress = (timeSlot, date) => {
    const isAvailable = getAvailabilityForTimeSlot(timeSlot, date);
    console.log('Time slot clicked:', {
      timeSlot,
      date: date.toDateString(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      fullDateTime: date.toLocaleString(),
      isAvailable: isAvailable ? 'Available (✓)' : 'Unavailable (—)'
    });
    onTimeSlotPress?.({
      timeSlot,
      date,
      isAvailable
    });
  };

  const threeDays = getNextThreeDays();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Header */}
      <View style={styles.weekHeader}>
        <ThemedText style={styles.weekTitle}>Next 3 Days</ThemedText>
        <ThemedText style={styles.weekDate}>
          {threeDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {threeDays[2].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </ThemedText>
      </View>

      {/* Calendar Container */}
      <View style={styles.calendarContainer}>
        {/* Fixed Header Row - 3 Days */}
        <View style={styles.daysHeaderRow}>
          {/* Empty space for time label alignment */}
          <View style={styles.timeLabelSpacer} />
          {threeDays.map((day, index) => {
            const isClosed = day.date.getDay() === 2; // Tuesday is closed
            
            return (
              <View key={index} style={[
                styles.dayHeaderColumn,
                isClosed && styles.closedHeaderColumn
              ]}>
                <ThemedText style={[
                  styles.dayHeaderLabel,
                  isClosed && styles.closedHeaderLabel
                ]}>
                  {day.dayName}
                </ThemedText>
                <ThemedText style={[
                  styles.dayHeaderDate,
                  isClosed && styles.closedHeaderDate
                ]}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {/* Scrollable Time Slots - Vertical with Fixed Height */}
        <View style={styles.timeSlotsContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.timeSlotsScrollContent}
            decelerationRate="fast"
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {timeSlots.map((timeSlot, timeIndex) => (
              <View key={timeIndex} style={styles.timeSlotRow}>
                {/* Time Label */}
                <View style={styles.timeLabelColumn}>
                  <ThemedText style={styles.timeLabelText}>{timeSlot}</ThemedText>
                </View>
                
                {/* Time Slot Cells for each day */}
                {threeDays.map((day, dayIndex) => {
                  const isAvailable = getAvailabilityForTimeSlot(timeSlot, day.date);
                  
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.timeSlotCell,
                        isAvailable && styles.availableTimeSlot,
                        isToastShowing && styles.disabledTimeSlot
                      ]}
                      onPress={() => !isToastShowing && handleTimeSlotPress(timeSlot, day.date)}
                      activeOpacity={isToastShowing ? 1 : 0.7}
                      disabled={isToastShowing}
                    >
                      <View style={styles.slotContainer}>
                        <ThemedText style={[
                          styles.slotText,
                          isAvailable && styles.availableSlotText
                        ]}>
                          {isAvailable ? '✓' : '—'}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  weekDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeLabelSpacer: {
    width: TIME_LABEL_WIDTH,
    height: 60,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayHeaderColumn: {
    width: DAY_COLUMN_WIDTH,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  dayHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  dayHeaderDate: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closedHeaderColumn: {
    backgroundColor: 'rgba(158, 158, 158, 0.15)',
  },
  closedHeaderLabel: {
    color: 'rgba(158, 158, 158, 0.8)',
  },
  closedHeaderDate: {
    color: 'rgba(158, 158, 158, 0.8)',
  },
  timeSlotsContainer: {
    height: CALENDAR_HEIGHT,
  },
  timeSlotsScrollContent: {
    paddingBottom: 20,
  },
  timeSlotRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: TIME_SLOT_HEIGHT,
  },
  timeLabelColumn: {
    width: TIME_LABEL_WIDTH,
    height: TIME_SLOT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  timeLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timeSlotCell: {
    width: DAY_COLUMN_WIDTH,
    height: TIME_SLOT_HEIGHT,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  availableTimeSlot: {
    backgroundColor: 'rgba(108, 42, 82, 0.1)',
  },
  slotContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '300',
  },
  availableSlotText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  disabledTimeSlot: {
    opacity: 0.5,
  },
});