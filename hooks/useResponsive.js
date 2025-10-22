import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native';
import { useMemo } from 'react';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from 'react-native-responsive-dimensions';

/**
 * Custom hook for responsive design utilities
 * Optimized for development performance
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  // Development mode optimization
  const isDev = __DEV__;
  
  // Memoize breakpoints to prevent unnecessary recalculations
  const breakpoints = useMemo(() => ({
    mobile: width < 768,
    tablet: width >= 768 && width < 1024,
    desktop: width >= 1024,
    largeDesktop: width >= 1440,
  }), [width]);

  // Memoize screen size
  const screenSize = useMemo(() => 
    breakpoints.mobile ? 'mobile' : 
    breakpoints.tablet ? 'tablet' : 
    breakpoints.desktop ? 'desktop' : 'largeDesktop',
    [breakpoints]
  );

  // Memoize responsive utilities
  const responsive = useMemo(() => ({
    fontSize: (size) => responsiveFontSize(size),
    height: (percentage) => responsiveHeight(percentage),
    screenHeight: (percentage) => responsiveScreenHeight(percentage),
    width: (percentage) => responsiveWidth(percentage),
    screenWidth: (percentage) => responsiveScreenWidth(percentage),
    padding: (percentage) => ({
      paddingHorizontal: responsiveWidth(percentage),
      paddingVertical: responsiveHeight(percentage),
    }),
    margin: (percentage) => ({
      marginHorizontal: responsiveWidth(percentage),
      marginVertical: responsiveHeight(percentage),
    }),
  }), []);

  // Memoize platform utilities
  const platform = useMemo(() => ({
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
  }), []);

  // Memoize container styles
  const containerStyles = useMemo(() => ({
    fullScreen: {
      flex: 1,
      ...(platform.isWeb && {
        width: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
      }),
    },
    responsiveContainer: {
      flex: 1,
      width: '100%',
      ...(breakpoints.desktop && {
        maxWidth: responsiveWidth(80),
        alignSelf: 'center',
      }),
    },
    cardContainer: {
      width: '100%',
      ...(breakpoints.mobile ? {
        marginHorizontal: responsiveWidth(4),
      } : {
        marginHorizontal: responsiveWidth(2),
      }),
    },
  }), [platform.isWeb, breakpoints.desktop, breakpoints.mobile]);

  // Memoize spacing utilities
  const spacing = useMemo(() => ({
    xs: responsiveWidth(1),
    sm: responsiveWidth(2),
    md: responsiveWidth(3),
    lg: responsiveWidth(4),
    xl: responsiveWidth(6),
    xxl: responsiveWidth(8),
  }), []);

  const heightSpacing = useMemo(() => ({
    xs: responsiveHeight(1),
    sm: responsiveHeight(2),
    md: responsiveHeight(3),
    lg: responsiveHeight(4),
    xl: responsiveHeight(6),
    xxl: responsiveHeight(8),
  }), []);

  return useMemo(() => ({
    width,
    height,
    ...breakpoints,
    screenSize,
    responsive,
    platform,
    containerStyles,
    spacing,
    heightSpacing,
    isSmallScreen: breakpoints.mobile,
    isMediumScreen: breakpoints.tablet,
    isLargeScreen: breakpoints.desktop || breakpoints.largeDesktop,
  }), [width, height, breakpoints, screenSize, responsive, platform, containerStyles, spacing, heightSpacing]);
};

export default useResponsive;
