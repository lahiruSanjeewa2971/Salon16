import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function ThemedView({
  children,
  style,
  variant = 'default',
  padding,
  margin,
  ...otherProps
}) {
  const { colors, spacing } = useTheme();

  const getViewStyle = () => {
    const baseStyle = {
      backgroundColor: colors.background,
    };

    switch (variant) {
      case 'surface':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
        };
      case 'card':
        return {
          ...baseStyle,
          backgroundColor: colors.cardBackground,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundSecondary,
        };
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: colors.accent,
        };
      default:
        return baseStyle;
    }
  };

  const getPaddingStyle = () => {
    if (!padding) return {};
    
    if (typeof padding === 'number') {
      return { padding };
    }
    
    if (typeof padding === 'object') {
      return {
        paddingTop: padding.top || padding.vertical || padding.all,
        paddingBottom: padding.bottom || padding.vertical || padding.all,
        paddingLeft: padding.left || padding.horizontal || padding.all,
        paddingRight: padding.right || padding.horizontal || padding.all,
      };
    }
    
    return { padding: spacing[padding] || spacing.md };
  };

  const getMarginStyle = () => {
    if (!margin) return {};
    
    if (typeof margin === 'number') {
      return { margin };
    }
    
    if (typeof margin === 'object') {
      return {
        marginTop: margin.top || margin.vertical || margin.all,
        marginBottom: margin.bottom || margin.vertical || margin.all,
        marginLeft: margin.left || margin.horizontal || margin.all,
        marginRight: margin.right || margin.horizontal || margin.all,
      };
    }
    
    return { margin: spacing[margin] || spacing.md };
  };

  return (
    <View
      style={[
        getViewStyle(),
        getPaddingStyle(),
        getMarginStyle(),
        style,
      ]}
      {...otherProps}
    >
      {children}
    </View>
  );
}

export default ThemedView;
