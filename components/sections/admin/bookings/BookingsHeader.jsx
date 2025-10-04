import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function BookingsHeader({ animatedStyle, onSearch }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  const styles = {
    headerContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    headerContent: {
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    titleSection: {
      flex: 1,
      marginRight: spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
      lineHeight: 24,
    },
    subtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 18,
    },
    searchButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignSelf: 'flex-start',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <ThemedText style={styles.title}>📅 Bookings Management</ThemedText>
            <ThemedText style={styles.subtitle}>
              Manage appointments and schedules
            </ThemedText>
          </View>
          
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearch}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
