import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { ThemedText } from '../../../ThemedText';

export default function DashboardStats({ stats, animatedStyle }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Add null safety for stats
  const safeStats = stats || {
    totalBookings: 0,
    pendingBookings: 0,
    todayRevenue: 0,
    activeServices: 0,
  };

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
      fontSize: 15,
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
          <ThemedText style={styles.statNumber}>{safeStats.totalBookings}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Bookings</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{safeStats.pendingBookings}</ThemedText>
          <ThemedText style={styles.statLabel}>Pending</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>Rs: {safeStats.todayRevenue}</ThemedText>
          <ThemedText style={styles.statLabel}>Today&apos;s Revenue</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{safeStats.activeServices}</ThemedText>
          <ThemedText style={styles.statLabel}>Active Services</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}
