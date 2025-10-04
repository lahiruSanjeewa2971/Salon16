import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function ServicesHeader({ animatedStyle }) {
  const { spacing } = useTheme();

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
          Services Management
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Manage salon services, pricing, and availability
        </ThemedText>
      </View>
    </Animated.View>
  );
}
