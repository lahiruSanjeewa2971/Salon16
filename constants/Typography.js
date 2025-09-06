/**
 * Salon 16 - Typography System
 * Modern, elegant typography for salon booking app
 */

// Font families
export const Fonts = {
  // Headings - Sans-serif with style
  heading: {
    primary: 'Montserrat',      // Main headings
    secondary: 'Poppins',       // Subheadings
  },
  
  // Body text - Neutral sans-serif
  body: {
    primary: 'Roboto',          // Main body text
    secondary: 'Inter',         // Alternative body text
  },
  
  // Special text
  accent: {
    primary: 'Montserrat',      // Prices, status
    secondary: 'Poppins',       // Special labels
  },
};

// Font weights
export const FontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

// Font sizes
export const FontSizes = {
  // Display sizes (large headings)
  display: {
    xl: 32,
    lg: 28,
    md: 24,
    sm: 20,
  },
  
  // Heading sizes
  heading: {
    xl: 24,
    lg: 20,
    md: 18,
    sm: 16,
  },
  
  // Body text sizes
  body: {
    xl: 18,
    lg: 16,
    md: 14,
    sm: 12,
  },
  
  // Caption sizes
  caption: {
    lg: 12,
    md: 10,
    sm: 8,
  },
};

// Line heights
export const LineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

// Letter spacing
export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

// Typography styles
export const Typography = {
  // Display styles
  displayXL: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.display.xl,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display.xl * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  displayLG: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.display.lg,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  displayMD: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.display.md,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display.md * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  displaySM: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.display.sm,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.display.sm * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  // Heading styles
  headingXL: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.heading.xl,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.heading.xl * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  headingLG: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.heading.lg,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.heading.lg * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  headingMD: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.heading.md,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.heading.md * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  headingSM: {
    fontFamily: Fonts.heading.secondary,
    fontSize: FontSizes.heading.sm,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.heading.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Body text styles
  bodyXL: {
    fontFamily: Fonts.body.primary,
    fontSize: FontSizes.body.xl,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body.xl * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  bodyLG: {
    fontFamily: Fonts.body.primary,
    fontSize: FontSizes.body.lg,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body.lg * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  bodyMD: {
    fontFamily: Fonts.body.primary,
    fontSize: FontSizes.body.md,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body.md * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  bodySM: {
    fontFamily: Fonts.body.primary,
    fontSize: FontSizes.body.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Caption styles
  captionLG: {
    fontFamily: Fonts.body.secondary,
    fontSize: FontSizes.caption.lg,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption.lg * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  captionMD: {
    fontFamily: Fonts.body.secondary,
    fontSize: FontSizes.caption.md,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption.md * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  captionSM: {
    fontFamily: Fonts.body.secondary,
    fontSize: FontSizes.caption.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Special styles
  price: {
    fontFamily: Fonts.accent.primary,
    fontSize: FontSizes.body.lg,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.body.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  priceLarge: {
    fontFamily: Fonts.accent.primary,
    fontSize: FontSizes.heading.lg,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.heading.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  button: {
    fontFamily: Fonts.heading.secondary,
    fontSize: FontSizes.body.md,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.body.md * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  
  buttonLarge: {
    fontFamily: Fonts.heading.secondary,
    fontSize: FontSizes.body.lg,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.body.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  
  label: {
    fontFamily: Fonts.body.secondary,
    fontSize: FontSizes.body.sm,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.body.sm * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  
  // Status styles
  status: {
    fontFamily: Fonts.accent.secondary,
    fontSize: FontSizes.body.sm,
    fontWeight: FontWeights.semiBold,
    lineHeight: FontSizes.body.sm * LineHeights.tight,
    letterSpacing: LetterSpacing.wide,
  },
  
  // Service category styles
  serviceCategory: {
    fontFamily: Fonts.heading.secondary,
    fontSize: FontSizes.body.md,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.body.md * LineHeights.tight,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Navigation styles
  tabLabel: {
    fontFamily: Fonts.body.secondary,
    fontSize: FontSizes.caption.lg,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.caption.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Welcome banner styles
  welcome: {
    fontFamily: Fonts.heading.primary,
    fontSize: FontSizes.display.lg,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  // Review rating styles
  rating: {
    fontFamily: Fonts.accent.primary,
    fontSize: FontSizes.heading.md,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.heading.md * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
};

export default Typography;
