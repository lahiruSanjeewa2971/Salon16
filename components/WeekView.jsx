import React, { useState, useEffect, useRef } from 'react';
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
const TIME_SLOT_WIDTH = 80;
const DAY_HEIGHT = 60;

export default function WeekView({ onTimeSlotPress }) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Refs for synchronized scrolling
  const headerScrollRef = useRef(null);
  const gridScrollRef = useRef(null);
  
  // Track which scroll view is being actively scrolled by user
  const activeScrollView = useRef(null);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  // Time slots (columns)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
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
      3: ['09:00', '10:00', '11:30', '13:30', '15:00', '17:00'], // Wednesday
      4: ['08:30', '10:30', '12:00', '14:00', '15:30', '17:30'], // Thursday
      5: ['09:00', '10:30', '12:30', '14:30', '16:00', '18:00'], // Friday
      6: ['08:00', '09:30', '11:00', '13:00', '14:30', '16:30', '18:30'] // Saturday
    };
    
    const availableTimes = availability[dayOfWeek] || [];
    return availableTimes.includes(timeSlot);
  };

  const handleTimeSlotPress = (timeSlot, date) => {
    onTimeSlotPress?.(timeSlot, date);
  };

  // Synchronized scrolling functions
  const handleHeaderScroll = (event) => {
    if (activeScrollView.current === 'grid') return; // Don't sync if grid is being scrolled
    
    const offsetX = event.nativeEvent.contentOffset.x;
    activeScrollView.current = 'header';
    
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollTo({ x: offsetX, animated: false });
    }
  };

  const handleGridScroll = (event) => {
    if (activeScrollView.current === 'header') return; // Don't sync if header is being scrolled
    
    const offsetX = event.nativeEvent.contentOffset.x;
    activeScrollView.current = 'grid';
    
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollTo({ x: offsetX, animated: false });
    }
  };

  // Reset active scroll view when scrolling stops
  const handleScrollEnd = () => {
    activeScrollView.current = null;
  };

  const weekDates = getWeekDates(currentWeek);

  // Debug logging
  console.log('WeekView Debug - Week Dates:', weekDates.map(d => d.toISOString().split('T')[0]));
  console.log('WeekView Debug - Time Slots:', timeSlots.slice(0, 5));
  console.log('WeekView Debug - First day availability:', timeSlots.slice(0, 3).map(ts => ({
    timeSlot: ts,
    available: getAvailabilityForTimeSlot(ts, weekDates[0])
  })));

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

      {/* Calendar Container */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarGrid}>
          {/* Fixed Days Column */}
          <View style={styles.daysColumn}>
            {/* Time header spacer */}
            <View style={styles.timeHeaderSpacer} />
            
            {weekDates.map((date, index) => {
              const dayOfWeek = date.getDay();
              const isToday = date.toDateString() === new Date().toDateString();
              const isClosed = dayOfWeek === 2;
              
              return (
                <View key={index} style={styles.dayRow}>
                  <View style={[
                    styles.dayCell,
                    isClosed && styles.closedDayCell
                  ]}>
                    <ThemedText style={[
                      styles.dayName,
                      isToday && styles.todayDayName,
                      isClosed && styles.closedDayName
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </ThemedText>
                    <ThemedText style={[
                      styles.dayNumber,
                      isToday && styles.todayDayNumber,
                      isClosed && styles.closedDayNumber
                    ]}>
                      {date.getDate()}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Scrollable Time Slots Section */}
          <View style={styles.timeSlotsSection}>
            {/* Time Header Row - Scrollable */}
            <View style={styles.timeHeaderRow}>
              <ScrollView 
                ref={headerScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeHeaderScrollContent}
                decelerationRate="fast"
                snapToInterval={TIME_SLOT_WIDTH}
                snapToAlignment="start"
                onScroll={handleHeaderScroll}
                onScrollEndDrag={handleScrollEnd}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={1}
              >
                {timeSlots.map((timeSlot, index) => (
                  <View key={index} style={styles.timeHeaderCell}>
                    <ThemedText style={styles.timeHeaderText}>{timeSlot}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Time Slots Grid - Scrollable */}
            <ScrollView 
              ref={gridScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsScrollContent}
              decelerationRate="fast"
              snapToInterval={TIME_SLOT_WIDTH}
              snapToAlignment="start"
              onScroll={handleGridScroll}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={1}
            >
              {/* Time Slots Grid - Each day is a row */}
              {weekDates.map((date, dayIndex) => (
                <View key={dayIndex} style={styles.timeRow}>
                  {timeSlots.map((timeSlot, timeIndex) => {
                    const isAvailable = getAvailabilityForTimeSlot(timeSlot, date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <TouchableOpacity
                        key={timeIndex}
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
  daysColumn: {
    width: 100,
  },
  timeHeaderSpacer: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayRow: {
    height: DAY_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  closedDayCell: {
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
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
  timeSlotsSection: {
    flex: 1,
    height: 460, // 40px header + 7 rows × 60px = 460px
  },
  timeHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    height: 40,
  },
  timeHeaderScrollContent: {
    paddingRight: 20,
  },
  timeSlotsScrollContent: {
    paddingRight: 20,
  },
  timeHeaderCell: {
    width: TIME_SLOT_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeSlotCell: {
    width: TIME_SLOT_WIDTH,
    height: DAY_HEIGHT,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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