import React from 'react';
import { View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function CustomerControls({ 
  searchQuery, 
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  animatedStyle 
}) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'recent', label: 'Recent' },
    { key: 'a-z', label: 'A-Z' },
    { key: 'last-visit-7', label: 'Last 7 Days' },
    { key: 'last-visit-30', label: 'Last 30 Days' },
    { key: 'last-visit-90', label: 'Last 90 Days' },
    { key: 'bookings-1-2', label: '1-2 Bookings' },
    { key: 'bookings-3-5', label: '3-5 Bookings' },
    { key: 'bookings-5+', label: '5+ Bookings' },
    { key: 'hair', label: 'Hair' },
    { key: 'nail', label: 'Nail' },
    { key: 'facial', label: 'Facial' },
    { key: 'spa', label: 'Spa' },
  ];

  const styles = {
    controlsContainer: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    searchInput: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      marginLeft: spacing.sm,
    },
    filtersContainer: {
      marginBottom: spacing.sm,
    },
    filtersLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: spacing.sm,
      fontWeight: '500',
    },
    filtersScroll: {
      flexDirection: 'row',
    },
    filterButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    filterButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    filterText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 12,
      fontWeight: '500',
    },
    filterTextActive: {
      color: 'white',
      fontWeight: '600',
    },
  };

  return (
    <View style={animatedStyle}>
      <View style={styles.controlsContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Options */}
        <View style={styles.filtersContainer}>
          <ThemedText style={styles.filtersLabel}>Filter by:</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
