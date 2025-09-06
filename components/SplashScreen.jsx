import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const { colors } = useTheme();

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      // Logo animation
      logoScale.value = withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 300 })
      );
      logoOpacity.value = withTiming(1, { duration: 600 });

      // Text animation
      textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

      // Finish splash screen
      setTimeout(() => {
        onFinish();
      }, 2000);
    };

    startAnimation();
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center',
            },
            logoAnimatedStyle,
          ]}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="cut" size={50} color="white" />
          </View>
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center' }, textAnimatedStyle]}>
          <Animated.Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Salon 16
          </Animated.Text>
          <Animated.Text
            style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
            }}
          >
            Your Beauty, Our Passion
          </Animated.Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
