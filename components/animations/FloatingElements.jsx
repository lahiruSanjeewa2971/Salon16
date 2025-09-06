import React, { useEffect } from 'react';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export function FloatingElements() {
  const floatAnim1 = useSharedValue(0);
  const floatAnim2 = useSharedValue(0);
  const floatAnim3 = useSharedValue(0);

  useEffect(() => {
    // Create floating animation for decorative elements
    floatAnim1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      false
    );

    floatAnim2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      ),
      -1,
      false
    );

    floatAnim3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3500 }),
        withTiming(0, { duration: 3500 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatAnim1.value, [0, 1], [0, -20]),
      },
      {
        scale: interpolate(floatAnim1.value, [0, 1], [1, 1.1]),
      },
    ],
    opacity: interpolate(floatAnim1.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatAnim2.value, [0, 1], [0, -15]),
      },
      {
        scale: interpolate(floatAnim2.value, [0, 1], [1, 1.05]),
      },
    ],
    opacity: interpolate(floatAnim2.value, [0, 0.5, 1], [0.2, 0.5, 0.2]),
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatAnim3.value, [0, 1], [0, -25]),
      },
      {
        scale: interpolate(floatAnim3.value, [0, 1], [1, 1.08]),
      },
    ],
    opacity: interpolate(floatAnim3.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 100,
            left: 50,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 200,
            right: 80,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 300,
            left: 30,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          animatedStyle3,
        ]}
      />
    </>
  );
}

export default FloatingElements;
