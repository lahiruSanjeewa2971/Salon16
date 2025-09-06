import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Animation, BorderRadius, Layout, Shadows, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';

// Theme context
const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [customTheme, setCustomTheme] = useState(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Set custom theme
  const setTheme = (theme) => {
    setCustomTheme(theme);
  };

  // Reset to system theme
  const resetTheme = () => {
    setCustomTheme(null);
    setIsDarkMode(systemColorScheme === 'dark');
  };

  // Get current theme
  const getCurrentTheme = () => {
    if (customTheme) {
      return customTheme;
    }
    return isDarkMode ? 'dark' : 'light';
  };

  // Theme object
  const theme = {
    // Color scheme
    isDark: isDarkMode,
    colorScheme: getCurrentTheme(),
    
    // Colors
    colors: Colors[getCurrentTheme()],
    colorPalette: Colors,
    
    // Typography
    typography: Typography,
    fonts: Typography,
    
    // Spacing and layout
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    layout: Layout,
    animation: Animation,
    
    // Theme management
    toggleDarkMode,
    setTheme,
    resetTheme,
    isCustomTheme: !!customTheme,
  };

  // Update theme when system color scheme changes
  useEffect(() => {
    if (!customTheme) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, customTheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get colors
export function useColors() {
  const { colors } = useTheme();
  return colors;
}

// Hook to get typography
export function useTypography() {
  const { typography } = useTheme();
  return typography;
}

// Hook to get spacing
export function useSpacing() {
  const { spacing } = useTheme();
  return spacing;
}

// Hook to get layout
export function useLayout() {
  const { layout } = useTheme();
  return layout;
}

// Hook to get shadows
export function useShadows() {
  const { shadows } = useTheme();
  return shadows;
}

// Hook to get border radius
export function useBorderRadius() {
  const { borderRadius } = useTheme();
  return borderRadius;
}

// Hook to get animation
export function useAnimation() {
  const { animation } = useTheme();
  return animation;
}

// Theme utilities
export const ThemeUtils = {
  // Get service color
  getServiceColor: (serviceType, colors) => {
    return colors.serviceColors[serviceType] || colors.primary;
  },
  
  // Get status color
  getStatusColor: (status, colors) => {
    const statusColors = {
      pending: colors.warning,
      accepted: colors.success,
      rejected: colors.error,
      completed: colors.success,
      cancelled: colors.textSecondary,
    };
    return statusColors[status] || colors.textSecondary;
  },
  
  // Get rating color
  getRatingColor: (rating, colors) => {
    if (rating >= 4) return colors.success;
    if (rating >= 3) return colors.warning;
    return colors.error;
  },
  
  // Create card style
  createCardStyle: (colors, shadows, borderRadius, spacing) => ({
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.card.medium,
    padding: spacing.card.medium,
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
  }),
  
  // Create button style
  createButtonStyle: (variant, colors, borderRadius, spacing) => {
    const baseStyle = {
      borderRadius: borderRadius.button.medium,
      paddingVertical: spacing.button.medium.vertical,
      paddingHorizontal: spacing.button.medium.horizontal,
      alignItems: 'center',
      justifyContent: 'center',
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
      default:
        return baseStyle;
    }
  },
  
  // Create input style
  createInputStyle: (colors, borderRadius, spacing) => ({
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.input.medium,
    paddingVertical: spacing.input.vertical,
    paddingHorizontal: spacing.input.horizontal,
    fontSize: 16,
    color: colors.text,
  }),
  
  // Create text style
  createTextStyle: (variant, colors, typography) => ({
    ...typography[variant],
    color: colors.text,
  }),
  
  // Create service card style
  createServiceCardStyle: (colors, shadows, borderRadius, spacing) => ({
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.service.card,
    padding: spacing.card.small,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 1px 3px ${colors.shadow}`,
      },
    }),
  }),
  
  // Create booking card style
  createBookingCardStyle: (colors, shadows, borderRadius, spacing) => ({
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.booking.card,
    padding: spacing.card.medium,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
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
  }),
  
  // Create review card style
  createReviewCardStyle: (colors, shadows, borderRadius, spacing) => ({
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.review.card,
    padding: spacing.card.medium,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
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
  }),
};

export default ThemeContext;
