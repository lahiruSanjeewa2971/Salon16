import React from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemedCard({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  ...props
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: colors.cardBackground,
      borderRadius: borderRadius.card.medium,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: `0 2px 4px ${colors.shadow}`,
        },
      }),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...Platform.select({
            ios: {
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
            web: {
              boxShadow: `0 4px 8px ${colors.shadow}`,
            },
          }),
        };
      case 'flat':
        return {
          ...baseStyle,
          ...Platform.select({
            ios: {
              shadowOpacity: 0,
            },
            android: {
              elevation: 0,
            },
            web: {
              boxShadow: 'none',
            },
          }),
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowOpacity: 0,
            },
            android: {
              elevation: 0,
            },
            web: {
              boxShadow: 'none',
            },
          }),
        };
      case 'service':
        return {
          ...baseStyle,
          borderRadius: borderRadius.service.card,
          ...Platform.select({
            ios: {
              shadowOpacity: 0.08,
              shadowRadius: 3,
            },
            android: {
              elevation: 2,
            },
            web: {
              boxShadow: `0 1px 3px ${colors.shadow}`,
            },
          }),
        };
      case 'booking':
        return {
          ...baseStyle,
          borderRadius: borderRadius.booking.card,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowOpacity: 0.08,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
            web: {
              boxShadow: `0 2px 4px ${colors.shadow}`,
            },
          }),
        };
      case 'review':
        return {
          ...baseStyle,
          borderRadius: borderRadius.review.card,
          ...Platform.select({
            ios: {
              shadowOpacity: 0.05,
              shadowRadius: 3,
            },
            android: {
              elevation: 1,
            },
            web: {
              boxShadow: `0 1px 3px ${colors.shadow}`,
            },
          }),
        };
      default:
        return baseStyle;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'small':
        return { padding: spacing.card.small };
      case 'large':
        return { padding: spacing.card.large };
      default:
        return { padding: spacing.card.medium };
    }
  };

  return (
    <View
      style={[
        getCardStyle(),
        getPaddingStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default ThemedCard;
