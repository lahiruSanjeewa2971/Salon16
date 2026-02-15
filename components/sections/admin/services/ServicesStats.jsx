import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/ThemeContext';
import { ThemedText } from '../../../ThemedText';

export default function ServicesStats({ stats, animatedStyle }) {
  const { spacing, borderRadius } = useTheme();

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
          <ThemedText style={styles.statNumber}>{stats.totalServices}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Services</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{stats.activeServices}</ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>Rs.{stats.avgPrice}</ThemedText>
          <ThemedText style={styles.statLabel}>Avg Price</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}
