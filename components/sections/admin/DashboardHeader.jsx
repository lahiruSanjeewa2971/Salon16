import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '../../ThemedText';
import { useTheme } from '../../../contexts/ThemeContext';

export default function DashboardHeader({ animatedStyle }) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const spacing = theme?.spacing || {};

  const styles = {
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingVertical: spacing.sm
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: spacing.lg,
    },
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Admin Dashboard
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Welcome back! Here&apos;s your salon overview for today
        </ThemedText>
      </View>
    </Animated.View>
  );
}
