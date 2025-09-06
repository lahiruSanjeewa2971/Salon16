import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  ...props
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: borderRadius.button[size],
      paddingVertical: spacing.button[size].vertical,
      paddingHorizontal: spacing.button[size].horizontal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.buttonPrimary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.buttonSecondary,
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: colors.buttonAccent,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      ...typography.button,
      color: colors.textInverse,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseTextStyle,
          color: colors.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: colors.primary,
        };
      default:
        return baseTextStyle;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 36,
          paddingVertical: spacing.button.small.vertical,
          paddingHorizontal: spacing.button.small.horizontal,
        };
      case 'large':
        return {
          minHeight: 52,
          paddingVertical: spacing.button.large.vertical,
          paddingHorizontal: spacing.button.large.horizontal,
        };
      default:
        return {
          minHeight: 44,
          paddingVertical: spacing.button.medium.vertical,
          paddingHorizontal: spacing.button.medium.horizontal,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        getSizeStyles(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse} 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default ThemedButton;
