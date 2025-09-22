import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';

const BookingsHeader = ({
  colors,
  spacing,
  borderRadius,
  shadows,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  upcomingCount,
  pastCount,
  totalCount,
  // Animation values
  fadeAnim,
  slideUpAnim,
}) => {
  // Filter tabs data
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'past', label: 'Past', count: pastCount },
    { id: 'all', label: 'All', count: totalCount }
  ];

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    titleContainer: {
      marginBottom: spacing.xl,
      alignItems: 'center',
      paddingTop: spacing.md,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
      marginBottom: spacing.sm,
      textAlign: 'center',
      letterSpacing: -0.5,
      lineHeight: 38,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '400',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    filterTabsContainer: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    filterTab: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.large,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    activeFilterTab: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: borderRadius.xl,
    },
    filterTabText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    activeFilterTabText: {
      color: 'white',
      fontWeight: '700',
    },
    filterTabCount: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: 2,
    },
    activeFilterTabCount: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: 'white',
      paddingVertical: spacing.xs,
      backgroundColor: 'transparent',
      borderWidth: 0,
      outline: 'none',
      textAlignVertical: 'center',
    },
    clearButton: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
    },
  });

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
      {/* Title Section */}
      <View style={styles.titleContainer}>
        <ThemedText style={styles.title}>My Bookings</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your appointments and view booking history
        </ThemedText>
      </View>


      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                isActive && styles.activeFilterTab,
              ]}
              onPress={() => onFilterChange(tab.id)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  isActive && styles.activeFilterTabText,
                ]}
              >
                {tab.label}
              </ThemedText>
              <ThemedText
                style={[
                  styles.filterTabCount,
                  isActive && styles.activeFilterTabCount,
                ]}
              >
                {tab.count}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="rgba(255, 255, 255, 0.6)"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by service, date, or booking ID"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
          selectionColor="rgba(255, 255, 255, 0.3)"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="rgba(255, 255, 255, 0.6)"
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default BookingsHeader;
