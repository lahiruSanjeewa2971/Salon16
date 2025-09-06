import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function ThemedText({
  children,
  style,
  type = 'bodyMD',
  color,
  ...rest
}) {
  const { colors, typography } = useTheme();

  const getTextStyle = () => {
    const baseStyle = typography[type] || typography.bodyMD;
    return {
      ...baseStyle,
      color: color || colors.text,
    };
  };

  return (
    <Text
      style={[getTextStyle(), style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// Predefined text variants for common use cases
export function Heading({ children, level = 1, style, ...rest }) {
  const headingTypes = {
    1: 'displayLG',
    2: 'headingXL',
    3: 'headingLG',
    4: 'headingMD',
    5: 'headingSM',
  };
  
  return (
    <ThemedText type={headingTypes[level]} style={style} {...rest}>
      {children}
    </ThemedText>
  );
}

export function Body({ children, size = 'md', style, ...rest }) {
  const bodyTypes = {
    xl: 'bodyXL',
    lg: 'bodyLG',
    md: 'bodyMD',
    sm: 'bodySM',
  };
  
  return (
    <ThemedText type={bodyTypes[size]} style={style} {...rest}>
      {children}
    </ThemedText>
  );
}

export function Caption({ children, size = 'md', style, ...rest }) {
  const captionTypes = {
    lg: 'captionLG',
    md: 'captionMD',
    sm: 'captionSM',
  };
  
  return (
    <ThemedText type={captionTypes[size]} style={style} {...rest}>
      {children}
    </ThemedText>
  );
}

export function Price({ children, large = false, style, ...rest }) {
  return (
    <ThemedText 
      type={large ? 'priceLarge' : 'price'} 
      style={style} 
      {...rest}
    >
      {children}
    </ThemedText>
  );
}

export function Label({ children, style, ...rest }) {
  return (
    <ThemedText type="label" style={style} {...rest}>
      {children}
    </ThemedText>
  );
}

export function Status({ children, style, ...rest }) {
  return (
    <ThemedText type="status" style={style} {...rest}>
      {children}
    </ThemedText>
  );
}

export default ThemedText;
