import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const TIME_SLOT_WIDTH = 80; // Width of each time slot column

export default function WeekView({ onTimeSlotPress, onDateSelect }) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  // Time slots for the week view (columns)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  // Mock availability data - replace with real data later
  const availabilityData = {
    '2024-01-15': { 
      available: true, 
      slots: ['09:00', '10:30', '14:00', '15:30'], 
      percentage: 80,
      timeSlotAvailability: {
        '09:00': true, '09:30': false, '10:00': false, '10:30': true,
        '11:00': false, '11:30': false, '12:00': false, '12:30': false,
        '13:00': false, '13:30': false, '14:00': true, '14:30': false,
        '15:00': false, '15:30': true, '16:00': false, '16:30': false,
        '17:00': false, '17:30': false, '18:00': false, '18:30': false,
        '19:00': false, '19:30': false
      }
    },
    '2024-01-16': { 
      available: false, 
      slots: [], 
      percentage: 0, // Closed
      timeSlotAvailability: {}
    },
    '2024-01-17': { 
      available: true, 
      slots: ['09:00', '11:00', '15:00'], 
      percentage: 60,
      timeSlotAvailability: {
        '09:00': true, '09:30': false, '10:00': false, '10:30': false,
        '11:00': true, '11:30': false, '12:00': false, '12:30': false,
        '13:00': false, '13:30': false, '14:00': false, '14:30': false,
        '15:00': true, '15:30': false, '16:00': false, '16:30': false,
        '17:00': false, '17:30': false, '18:00': false, '18:30': false,
        '19:00': false, '19:30': false
      }
    },
    '2024-01-18': { 
      available: true, 
      slots: ['10:00', '14:30'], 
      percentage: 40,
      timeSlotAvailability: {
        '09:00': false, '09:30': false, '10:00': true, '10:30': false,
        '11:00': false, '11:30': false, '12:00': false, '12:30': false,
        '13:00': false, '13:30': false, '14:00': false, '14:30': true,
        '15:00': false, '15:30': false, '16:00': false, '16:30': false,
        '17:00': false, '17:30': false, '18:00': false, '18:30': false,
        '19:00': false, '19:30': false
      }
    },
    '2024-01-19': { 
      available: true, 
      slots: ['09:00', '10:30', '14:00', '15:30'], 
      percentage: 80,
      timeSlotAvailability: {
        '09:00': true, '09:30': false, '10:00': false, '10:30': true,
        '11:00': false, '11:30': false, '12:00': false, '12:30': false,
        '13:00': false, '13:30': false, '14:00': true, '14:30': false,
        '15:00': false, '15:30': true, '16:00': false, '16:30': false,
        '17:00': false, '17:30': false, '18:00': false, '18:30': false,
        '19:00': false, '19:30': false
      }
    },
  };

  useEffect(() => {
    // Start animations
    fadeAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    slideAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(currentDate);
    }
    return weekDates;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAvailabilityColor = (percentage) => {
    if (percentage === 0) return '#9E9E9E'; // Closed
    if (percentage >= 80) return '#4CAF50'; // High availability
    if (percentage >= 40) return '#FF9800'; // Medium availability
    return '#F44336'; // Low availability
  };

  const getAvailabilityGradient = (percentage) => {
    if (percentage === 0) return ['#9E9E9E', '#757575']; // Closed
    if (percentage >= 80) return ['#4CAF50', '#8BC34A']; // High availability
    if (percentage >= 40) return ['#FF9800', '#FFC107']; // Medium availability
    return ['#F44336', '#FF5722']; // Low availability
  };

  const handleTimeSlotPress = (timeSlot, date) => {
    onTimeSlotPress?.(timeSlot, date);
  };

  const weekDates = getWeekDates(currentWeek);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Week Header */}
      <View style={styles.weekHeader}>
        <ThemedText style={styles.weekTitle}>This Week</ThemedText>
        <ThemedText style={styles.weekDate}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </ThemedText>
      </View>

      {/* Google Calendar Style Week View */}
      <View style={styles.calendarContainer}>
        {/* Fixed Days Column + Scrollable Time Slots */}
        <View style={styles.calendarGrid}>
          {/* Fixed Days Column (Left Side) */}
          <View style={styles.daysColumn}>
            {/* Empty space for time header alignment */}
            <View style={styles.timeHeaderSpacer} />
            {weekDates.map((date, index) => {
              const dateString = date.toISOString().split('T')[0];
              const dayData = availabilityData[dateString] || { available: false, slots: [], percentage: 0 };
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <View key={index} style={styles.dayRow}>
                  <LinearGradient
                    colors={dayData.available 
                      ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                      : ['rgba(158, 158, 158, 0.2)', 'rgba(117, 117, 117, 0.1)']
                    }
                    style={styles.dayCell}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <ThemedText style={[
                      styles.dayName,
                      isToday && styles.todayDayName,
                      !dayData.available && styles.closedDayName
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </ThemedText>
                    <ThemedText style={[
                      styles.dayNumber,
                      isToday && styles.todayDayNumber,
                      !dayData.available && styles.closedDayNumber
                    ]}>
                      {date.getDate()}
                    </ThemedText>
                    {dayData.available && (
                      <View style={styles.availabilityIndicator}>
                        <View style={[
                          styles.availabilityDot,
                          { backgroundColor: getAvailabilityColor(dayData.percentage) }
                        ]} />
                      </View>
                    )}
                  </LinearGradient>
                </View>
              );
            })}
          </View>

          {/* Scrollable Time Slots Section - Synchronized */}
          <View style={styles.timeSlotsSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.synchronizedTimeContainer}
              decelerationRate="fast"
              snapToInterval={TIME_SLOT_WIDTH}
              snapToAlignment="start"
            >
              {/* Time Header Row */}
              <View style={styles.timeHeaderRow}>
                {timeSlots.map((timeSlot, index) => (
                  <View key={index} style={styles.timeHeaderCell}>
                    <ThemedText style={styles.timeHeaderText}>{timeSlot}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Time Slots Grid */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <View key={timeIndex} style={styles.timeColumn}>
                  {weekDates.map((date, dayIndex) => {
                    const dateString = date.toISOString().split('T')[0];
                    const dayData = availabilityData[dateString] || { available: false, timeSlotAvailability: {} };
                    const isAvailable = dayData.timeSlotAvailability[timeSlot] || false;
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.timeSlotCell,
                          isAvailable && styles.availableTimeSlot,
                          isToday && styles.todayTimeSlot
                        ]}
                        onPress={() => isAvailable && handleTimeSlotPress(timeSlot, date)}
                        activeOpacity={isAvailable ? 0.8 : 1}
                        disabled={!isAvailable}
                      >
                        {isAvailable ? (
                          <LinearGradient
                            colors={[colors.primary || '#6C2A52', colors.accent || '#EC4899']}
                            style={styles.availableSlotGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <ThemedText style={styles.availableSlotText}>✓</ThemedText>
                          </LinearGradient>
                        ) : (
                          <View style={styles.unavailableSlot}>
                            <ThemedText style={styles.unavailableSlotText}>—</ThemedText>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
  },
  timeSlotsSection: {
    flex: 1,
  },
  synchronizedTimeContainer: {
    paddingRight: 20,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeHeaderSpacer: {
    height: 40, // Height of time header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeHeaderCell: {
    width: TIME_SLOT_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  daysColumn: {
    width: 100,
  },
  dayRow: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayDayName: {
    color: 'white',
    fontWeight: 'bold',
  },
  closedDayName: {
    color: 'rgba(158, 158, 158, 0.6)',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  todayDayNumber: {
    color: 'white',
  },
  closedDayNumber: {
    color: 'rgba(158, 158, 158, 0.6)',
  },
  availabilityIndicator: {
    marginTop: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeColumn: {
    width: TIME_SLOT_WIDTH,
  },
  timeSlotCell: {
    height: 60,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableTimeSlot: {
    backgroundColor: 'rgba(108, 42, 82, 0.1)',
  },
  todayTimeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  availableSlotGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableSlotText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  unavailableSlot: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableSlotText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
