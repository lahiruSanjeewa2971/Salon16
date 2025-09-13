import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

import WeekView from '../WeekView';

const WeekViewSection = ({ 
  colors, 
  spacing, 
  borderRadius, 
  shadows,
  onTimeSlotPress,
  onDateSelect,
  // Animation values
  servicesAnim,
}) => {
  // Animated styles
  const servicesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: servicesAnim.value,
    transform: [
      { translateY: interpolate(servicesAnim.value, [0, 1], [50, 0]) },
    ],
  }));

  const styles = createStyles(colors, spacing, borderRadius, shadows);

  return (
    <Animated.View style={[styles.section, servicesAnimatedStyle]}>
      <WeekView 
        onTimeSlotPress={onTimeSlotPress}
        onDateSelect={onDateSelect}
      />
    </Animated.View>
  );
};

const createStyles = (colors, spacing, borderRadius, shadows) => StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
    backgroundColor: 'transparent',
    position: 'relative',
  },
});

export default WeekViewSection;
