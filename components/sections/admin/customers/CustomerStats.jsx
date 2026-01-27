import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { ThemedText } from '../../../ThemedText';

export default function CustomerStats({ stats, animatedStyle }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  const styles = {
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginHorizontal: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{stats.totalCustomers}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Customers</ThemedText>
        </View>
        {/* <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{stats.activeCustomers}</ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View> */}
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{stats.newThisMonth}</ThemedText>
          <ThemedText style={styles.statLabel}>New This Month</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{stats.avgBookings}</ThemedText>
          <ThemedText style={styles.statLabel}>Avg Bookings</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}
