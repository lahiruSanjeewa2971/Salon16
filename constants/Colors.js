/**
 * Salon 16 - Premium Salon Booking App Color Palette
 * Elegant, modern, and salon-inspired design system
 */

// Primary Colors - Deep plum/burgundy for elegance
const primary = {
  50: '#FDF2F8',   // Very light plum
  100: '#FCE7F3',  // Light plum
  200: '#FBCFE8',  // Lighter plum
  300: '#F9A8D4',  // Light plum
  400: '#F472B6',  // Medium plum
  500: '#EC4899',  // Base plum
  600: '#DB2777',  // Dark plum
  700: '#BE185D',  // Darker plum
  800: '#9D174D',  // Very dark plum
  900: '#831843',  // Darkest plum
  main: '#6C2A52', // Deep plum (primary)
  dark: '#8E3B60', // Burgundy (primary dark)
};

// Secondary Colors - Warm beige/peach for approachability
const secondary = {
  50: '#FEFCFB',   // Very light beige
  100: '#FDF7F0',  // Light beige
  200: '#FBE8D3',  // Lighter beige
  300: '#F8D7C4',  // Light peach
  400: '#F5E0DC',  // Soft peach
  500: '#F2C9A8',  // Base peach
  600: '#E8B4A0',  // Medium peach
  700: '#D49B7A',  // Dark peach
  800: '#C08254',  // Darker peach
  900: '#A66B2E',  // Darkest peach
  main: '#F5E0DC', // Soft peach (secondary)
  light: '#F8D7C4', // Warm beige (secondary light)
};

// Accent Colors - Gold for premium touch
const accent = {
  50: '#FFFBEB',   // Very light gold
  100: '#FEF3C7',  // Light gold
  200: '#FDE68A',  // Lighter gold
  300: '#FCD34D',  // Light gold
  400: '#FBBF24',  // Medium gold
  500: '#F59E0B',  // Base gold
  600: '#D97706',  // Dark gold
  700: '#B45309',  // Darker gold
  800: '#92400E',  // Very dark gold
  900: '#78350F',  // Darkest gold
  main: '#D4AF37', // Metallic gold (accent)
  light: '#F4D03F', // Light gold
};

// Neutral Colors - Clean backgrounds and text
const neutral = {
  50: '#FAFAFA',   // Very light gray
  100: '#F7F7F7',  // Light gray
  200: '#E5E5E5',  // Lighter gray
  300: '#D4D4D4',  // Light gray
  400: '#A3A3A3',  // Medium gray
  500: '#737373',  // Base gray
  600: '#525252',  // Dark gray
  700: '#404040',  // Darker gray
  800: '#262626',  // Very dark gray
  900: '#171717',  // Darkest gray
  white: '#FFFFFF',
  black: '#000000',
};

// Status Colors
const status = {
  success: '#10B981',  // Green
  warning: '#F59E0B',  // Amber
  error: '#EF4444',    // Red
  info: '#3B82F6',     // Blue
};

// Service Category Colors
const serviceColors = {
  haircut: '#6C2A52',      // Deep plum
  coloring: '#8E3B60',     // Burgundy
  styling: '#D4AF37',      // Gold
  treatment: '#F5E0DC',    // Soft peach
  piercing: '#F8D7C4',     // Warm beige
  manicure: '#EC4899',     // Pink
  pedicure: '#F472B6',     // Light pink
  massage: '#F9A8D4',      // Very light pink
};

export const Colors = {
  // Primary palette
  primary,
  secondary,
  accent,
  neutral,
  status,
  serviceColors,
  
  // Light theme (default)
  light: {
    // Text colors
    text: neutral[900],
    textSecondary: neutral[600],
    textTertiary: neutral[400],
    textInverse: neutral.white,
    
    // Background colors
    background: neutral.white,
    backgroundSecondary: neutral[50],
    backgroundTertiary: neutral[100],
    surface: neutral.white,
    surfaceSecondary: neutral[50],
    
    // Brand colors
    primary: primary.main,
    primaryLight: primary[400],
    primaryDark: primary[800],
    secondary: secondary.main,
    secondaryLight: secondary.light,
    accent: accent.main,
    accentLight: accent.light,
    
    // Status colors
    success: status.success,
    warning: status.warning,
    error: status.error,
    info: status.info,
    
    // Border colors
    border: neutral[200],
    borderLight: neutral[100],
    borderDark: neutral[300],
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    
    // Tab colors
    tabIconDefault: neutral[400],
    tabIconSelected: primary.main,
    tabBackground: neutral.white,
    
    // Button colors
    buttonPrimary: primary.main,
    buttonSecondary: secondary.main,
    buttonAccent: accent.main,
    buttonDisabled: neutral[300],
    
    // Input colors
    inputBackground: neutral.white,
    inputBorder: neutral[300],
    inputFocus: primary.main,
    inputError: status.error,
    
    // Card colors
    cardBackground: neutral.white,
    cardBorder: neutral[200],
    cardShadow: 'rgba(0, 0, 0, 0.08)',
  },
  
  // Dark theme
  dark: {
    // Text colors
    text: neutral.white,
    textSecondary: neutral[300],
    textTertiary: neutral[400],
    textInverse: neutral[900],
    
    // Background colors
    background: neutral[900],
    backgroundSecondary: neutral[800],
    backgroundTertiary: neutral[700],
    surface: neutral[800],
    surfaceSecondary: neutral[700],
    
    // Brand colors
    primary: primary[400],
    primaryLight: primary[300],
    primaryDark: primary[600],
    secondary: secondary[400],
    secondaryLight: secondary[300],
    accent: accent[400],
    accentLight: accent[300],
    
    // Status colors
    success: status.success,
    warning: status.warning,
    error: status.error,
    info: status.info,
    
    // Border colors
    border: neutral[600],
    borderLight: neutral[700],
    borderDark: neutral[500],
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowDark: 'rgba(0, 0, 0, 0.4)',
    
    // Tab colors
    tabIconDefault: neutral[500],
    tabIconSelected: primary[400],
    tabBackground: neutral[800],
    
    // Button colors
    buttonPrimary: primary[400],
    buttonSecondary: secondary[400],
    buttonAccent: accent[400],
    buttonDisabled: neutral[600],
    
    // Input colors
    inputBackground: neutral[700],
    inputBorder: neutral[600],
    inputFocus: primary[400],
    inputError: status.error,
    
    // Card colors
    cardBackground: neutral[800],
    cardBorder: neutral[600],
    cardShadow: 'rgba(0, 0, 0, 0.2)',
  },
};
