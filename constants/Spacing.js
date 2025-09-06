/**
 * Salon 16 - Spacing & Layout System
 * Consistent spacing for modern, clean design
 */

// Base spacing unit (8px grid system)
const baseUnit = 8;

// Spacing scale
export const Spacing = {
  // Micro spacing (0-8px)
  xs: baseUnit * 0.5,    // 4px
  sm: baseUnit * 1,       // 8px
  md: baseUnit * 1.5,     // 12px
  lg: baseUnit * 2,       // 16px
  
  // Standard spacing (16-32px)
  xl: baseUnit * 3,       // 24px
  xxl: baseUnit * 4,      // 32px
  xxxl: baseUnit * 5,     // 40px
  
  // Large spacing (40px+)
  huge: baseUnit * 6,     // 48px
  massive: baseUnit * 8,  // 64px
  enormous: baseUnit * 12, // 96px
  
  // Screen padding
  screen: {
    horizontal: baseUnit * 4,  // 32px
    vertical: baseUnit * 3,    // 24px
  },
  
  // Component padding
  component: {
    small: baseUnit * 1.5,     // 12px
    medium: baseUnit * 2,      // 16px
    large: baseUnit * 3,       // 24px
    xlarge: baseUnit * 4,      // 32px
  },
  
  // Card padding
  card: {
    small: baseUnit * 2,       // 16px
    medium: baseUnit * 3,      // 24px
    large: baseUnit * 4,       // 32px
  },
  
  // Button padding
  button: {
    small: {
      vertical: baseUnit * 1,    // 8px
      horizontal: baseUnit * 2,  // 16px
    },
    medium: {
      vertical: baseUnit * 1.5,  // 12px
      horizontal: baseUnit * 3,  // 24px
    },
    large: {
      vertical: baseUnit * 2,    // 16px
      horizontal: baseUnit * 4,  // 32px
    },
  },
  
  // Input padding
  input: {
    vertical: baseUnit * 1.5,   // 12px
    horizontal: baseUnit * 2,   // 16px
  },
  
  // Section spacing
  section: {
    small: baseUnit * 4,        // 32px
    medium: baseUnit * 6,       // 48px
    large: baseUnit * 8,        // 64px
  },
};

// Border radius scale
export const BorderRadius = {
  // Small radius (4-8px)
  xs: 4,
  sm: 6,
  md: 8,
  
  // Medium radius (12-16px)
  lg: 12,
  xl: 16,
  
  // Large radius (20-24px)
  xxl: 20,
  xxxl: 24,
  
  // Special radius
  round: 50,           // Fully rounded
  pill: 9999,          // Pill shape
  
  // Component specific
  button: {
    small: 8,
    medium: 12,
    large: 16,
  },
  
  card: {
    small: 8,
    medium: 12,
    large: 16,
  },
  
  input: {
    small: 8,
    medium: 10,
    large: 12,
  },
  
  image: {
    small: 8,
    medium: 12,
    large: 16,
    round: 50,
  },
  
  service: {
    card: 12,
    image: 8,
    button: 8,
  },
  
  booking: {
    card: 12,
    timeSlot: 8,
    status: 6,
  },
  
  review: {
    card: 12,
    image: 8,
    rating: 4,
  },
};

// Shadow definitions
export const Shadows = {
  // Light shadows
  light: {
    // Note: Use Platform.select() in components for cross-platform shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Medium shadows
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Large shadows
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Extra large shadows
  xlarge: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Card shadows
  card: {
    light: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Button shadows
  button: {
    light: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  
  // Input shadows
  input: {
    focus: {
      shadowColor: '#6C2A52', // Primary color
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};

// Layout dimensions
export const Layout = {
  // Screen dimensions
  screen: {
    minWidth: 320,
    maxWidth: 480,
  },
  
  // Component dimensions
  component: {
    // Button heights
    button: {
      small: 36,
      medium: 44,
      large: 52,
    },
    
    // Input heights
    input: {
      small: 36,
      medium: 44,
      large: 52,
    },
    
    // Card dimensions
    card: {
      minHeight: 80,
      maxHeight: 200,
    },
    
    // Service card dimensions
    service: {
      width: 160,
      height: 200,
      imageHeight: 120,
    },
    
    // Booking card dimensions
    booking: {
      minHeight: 100,
      maxHeight: 150,
    },
    
    // Review card dimensions
    review: {
      minHeight: 120,
      maxHeight: 200,
    },
  },
  
  // Grid dimensions
  grid: {
    columns: 2,
    gutter: baseUnit * 2, // 16px
  },
  
  // List dimensions
  list: {
    itemHeight: 60,
    separatorHeight: 1,
  },
  
  // Tab bar dimensions
  tabBar: {
    height: 60,
    iconSize: 24,
  },
  
  // Header dimensions
  header: {
    height: 60,
    largeHeight: 80,
  },
};

// Animation durations
export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export default {
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Animation,
};
