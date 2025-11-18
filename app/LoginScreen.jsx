import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { ThemedButton } from '../components/themed/ThemedButton';
import { ThemedText } from '../components/ThemedText';
import { useAlertHelpers } from '../components/ui/AlertSystem';
import { useToastHelpers } from '../components/ui/ToastSystem';
import { useTheme } from '../contexts/ThemeContext';
// import { useAuth } from '../hooks/auth/useAuth';
import { useAuth, useAuthActions, useAuthError, useAuthLoading } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;

export default function LoginScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const responsive = useResponsive();
  const router = useRouter();

  // Auth hooks
  const { isAuthenticated, debugAuthState } = useAuth();
  const { login } = useAuthActions();
  const { error: authError, clearError } = useAuthError();
  const { isLoggingIn, isGoogleSigningIn } = useAuthLoading();

  // Smart scrolling state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});
  const inputContainerRefs = useRef({});
  const scrollContentRef = useRef(null);

  // Keyboard listeners - only track state, don't move anything
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Auto-scroll to focused input
  const scrollToInput = (inputName) => {
    if (!isKeyboardVisible) return; // Only scroll when keyboard is visible
    
    const containerRef = inputContainerRefs.current[inputName];
    const contentRef = scrollContentRef.current;
    
    if (scrollViewRef.current && containerRef && contentRef) {
      setTimeout(() => {
        try {
          // Measure both the container and scroll content to get relative position
          containerRef.measure((cx, cy, cwidth, cheight, cpageX, cpageY) => {
            contentRef.measure((sx, sy, swidth, sheight, spageX, spageY) => {
              // Calculate relative Y position within scroll content
              const relativeY = cpageY - spageY;
              
              // Scroll to show the input with some padding above it
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  y: Math.max(0, relativeY - 120),
                  animated: true,
                });
              }
            });
          });
        } catch (error) {
          console.log('Scroll measurement error:', error);
        }
      }, 150);
    }
  };

  // Handle input focus
  const handleInputFocus = (inputName) => {
    scrollToInput(inputName);
  };

  // Alert and toast hooks
  const { showSuccess, showError, showInfo } = useAlertHelpers();
  const { showSuccess: showSuccessToast, showError: showErrorToast } = useToastHelpers();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);
  const logoScaleAnim = useSharedValue(0);

  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Logo animation
      logoScaleAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      // Fade in main content
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideUpAnim.value = withDelay(200, withSpring(0, { damping: 15 }));

      // Scale animation for form
      scaleAnim.value = withDelay(400, withSpring(1, { damping: 12 }));
    };

    startAnimations();
  }, [fadeAnim, logoScaleAnim, scaleAnim, slideUpAnim]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleAnim.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (authError) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    
    // Show toast for validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      const errorFields = Object.keys(newErrors).join(', ');
      
      showErrorToast(
        'Please Check Your Input',
        `${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention: ${errorFields}`,
        { duration: 5000 }
      );
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('Login attempt:', formData);
      
      // Debug: Check current auth state
      debugAuthState();
      
      // Call auth service to login user
      const result = await login(formData);
      
      if (result.success) {
        console.log('Login successful:', result.message);
        
        // Show success message
        showSuccessToast(
          'Login Successful!',
          `Welcome back, ${result.user.firstName}!`,
          { duration: 3000 }
        );
        
        // Navigate based on user role
        if (result.user.role === 'admin') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(customer-tabs)');
        }
      } else {
        // Show error toast with better messaging
        const errorMessage = result.error || 'Please check your credentials and try again.';
        const isEmailVerificationError = errorMessage.includes('verify your email');
        
        showErrorToast(
          isEmailVerificationError ? 'Email Verification Required' : 'Login Failed',
          isEmailVerificationError 
            ? 'Please check your email and click the verification link before logging in.'
            : errorMessage,
          { duration: 6000 }
        );
      }
    } catch (error) {
      showErrorToast(
        'Login Error',
        'Something went wrong. Please try again.',
        { duration: 5000 }
      );
    }
  };

  const handleRegister = () => {
    router.push('/RegisterScreen');
  };

  const handleGuestMode = () => {
    // Navigate back to customer home screen as guest
    router.push('/(customer-tabs)');
  };

  const handleGoogleSignIn = () => {
    console.log('LoginScreen: Google Sign-In button clicked');
  };

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    console.log('Forgot password');
  };

  // Create responsive styles using theme values
  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
      backgroundColor: colors.primary, // Fallback to gradient start color
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%', // Covers viewport exactly
    },
    decorativeCircle1: {
      position: 'absolute',
      top: responsive.isSmallScreen ? responsive.responsive.height(-5) : responsive.responsive.height(-7),
      right: responsive.isSmallScreen ? responsive.responsive.height(-5) : responsive.responsive.height(-7),
      width: responsive.isSmallScreen ? responsive.responsive.width(30) : responsive.responsive.width(40),
      height: responsive.isSmallScreen ? responsive.responsive.width(30) : responsive.responsive.width(40),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(15) : responsive.responsive.width(20),
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: responsive.isSmallScreen ? responsive.responsive.height(-10) : responsive.responsive.height(-15),
      left: responsive.isSmallScreen ? responsive.responsive.height(-10) : responsive.responsive.height(-15),
      width: responsive.isSmallScreen ? responsive.responsive.width(40) : responsive.responsive.width(60),
      height: responsive.isSmallScreen ? responsive.responsive.width(40) : responsive.responsive.width(60),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(20) : responsive.responsive.width(30),
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scrollContent: {
      paddingBottom: 20,
    },
    scrollContainer: {
      flex: 1,
    },
    mainContent: {
      minHeight: Dimensions.get('window').height - 100, // Fixed minimum height to prevent layout shifts
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center', // Always centered - no conditional changes
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingTop: responsive.isSmallScreen ? responsive.responsive.height(12) : responsive.responsive.height(15), // Move content down
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.lg,
    },
    logoContainer: {
      alignItems: 'center',
      // marginBottom: responsive.spacing.lg,
    },
    logoCircle: {
      width: responsive.isSmallScreen ? responsive.responsive.width(22) : responsive.responsive.width(26),
      height: responsive.isSmallScreen ? responsive.responsive.width(22) : responsive.responsive.width(26),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(11) : responsive.responsive.width(13),
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    title: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 2.8 : 3.2),
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: responsive.spacing.md,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.6 : 1.8),
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      fontWeight: '400',
      lineHeight: responsive.responsive.fontSize(responsive.isSmallScreen ? 2.2 : 2.4),
    },
    formContainer: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: responsive.responsive.width(4),
      padding: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          backdropFilter: 'blur(10px)',
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    inputContainer: {
      marginBottom: responsive.spacing.lg,
    },
    inputLabel: {
      fontSize: responsive.responsive.fontSize(1.6),
      fontWeight: '600',
      color: 'white',
      marginBottom: responsive.spacing.md,
    },
    inputWrapper: {
      position: 'relative',
    },
    textInput: {
      backgroundColor: Platform.OS === 'web' ? 'white' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: Platform.OS === 'ios' ? responsive.responsive.width(2.5) : responsive.responsive.width(2),
      paddingHorizontal: responsive.spacing.lg,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      fontSize: Platform.OS === 'web' ? 16 : responsive.responsive.fontSize(1.8), // Prevent zoom on web
      color: Platform.OS === 'web' ? 'black' : colors.text,
      borderWidth: 1,
      borderColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
      minHeight: responsive.responsive.height(5),
      ...Platform.select({
        web: {
          transform: 'translateZ(0)', // Hardware acceleration
          WebkitAppearance: 'none', // Remove webkit styling
          MozAppearance: 'textfield', // Remove Firefox styling
        },
      }),
    },
    passwordInput: {
      paddingRight: responsive.responsive.width(12),
    },
    passwordToggle: {
      position: 'absolute',
      right: responsive.spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.sm,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: responsive.spacing.sm,
    },
    forgotPasswordText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'rgba(255, 255, 255, 0.8)',
      textDecorationLine: 'underline',
    },
    buttonContainer: {
      width: '100%',
      marginTop: responsive.spacing.lg,
    },
    loginButton: {
      backgroundColor: 'white',
      marginBottom: responsive.spacing.sm,
      minHeight: responsive.responsive.height(5.5),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    loginButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.8 : 2.0),
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: responsive.spacing.lg,
    },
    registerText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'rgba(255, 255, 255, 0.8)',
    },
    registerLink: {
      marginLeft: responsive.spacing.xs,
    },
    registerLinkText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'white',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    guestContainer: {
      alignItems: 'center',
      marginTop: responsive.spacing.md,
    },
    guestButton: {
      paddingVertical: responsive.spacing.sm,
      paddingHorizontal: responsive.spacing.lg,
      borderRadius: responsive.responsive.width(2),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    guestButtonText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    googleSignInButton: {
      backgroundColor: 'white',
      marginBottom: responsive.spacing.md,
      width: '100%',
      // minHeight: 52, // Match ThemedButton large size
      minHeight: responsive.responsive.height(5.5),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.button.large, // Match theme border radius
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
      }),
    },
    googleSignInButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleButtonText: {
      color: '#3c4043',
      fontWeight: '600',
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.6 : 1.8),
      marginLeft: responsive.spacing.sm,
    },
    backButton: {
      position: 'absolute',
      top: responsive.isSmallScreen ? responsive.responsive.height(5) : responsive.responsive.height(6),
      left: responsive.spacing.lg,
      zIndex: 1,
      padding: responsive.spacing.sm,
    },
    backButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButtonText: {
      color: 'white',
      fontSize: responsive.responsive.fontSize(1.8),
      marginLeft: responsive.spacing.xs,
    },
    inputError: {
      borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    errorText: {
      fontSize: responsive.responsive.fontSize(1.4),
      color: 'rgba(255, 0, 0, 0.8)',
      marginTop: responsive.spacing.xs,
    },
    // Error styles removed - using toast notifications instead
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6, 1]}
      />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorativeCircle1, logoAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, logoAnimatedStyle]} />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <View style={styles.backButtonContent}>
          <Ionicons name="arrow-back" size={responsive.responsive.width(5)} color="white" />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </View>
      </TouchableOpacity>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={isKeyboardVisible} // Only allow scrolling when keyboard is visible
        bounces={false} // Prevent bounce that causes jumping
        {...Platform.select({
          ios: {
            contentInsetAdjustmentBehavior: 'never', // Prevent iOS auto-adjustment
          },
          web: {
            touchAction: 'manipulation',
          },
        })}
      >
        <View 
          ref={scrollContentRef}
          style={styles.mainContent}
        >
          {/* Header */}
          <Animated.View style={[styles.header, contentAnimatedStyle]}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(12)} color="white" />
              </View>
              
              <ThemedText style={styles.title}>
                Welcome Back
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                Sign in to continue to Salon 16
              </ThemedText>
            </Animated.View>
          </Animated.View>

          {/* Login Form */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            {/* Email Input */}
            <View 
              ref={(ref) => (inputContainerRefs.current.email = ref)}
              style={styles.inputContainer}
            >
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.email = ref)}
                  style={[styles.textInput, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  onFocus={() => handleInputFocus('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  {...Platform.select({
                    web: {
                      inputMode: 'email',
                      autoComplete: 'email',
                    },
                  })}
                />
              </View>
              {errors.email && (
                <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
              )}
            </View>

            {/* Password Input */}
            <View 
              ref={(ref) => (inputContainerRefs.current.password = ref)}
              style={styles.inputContainer}
            >
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.password = ref)}
                  style={[styles.textInput, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  onFocus={() => handleInputFocus('password')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  {...Platform.select({
                    web: {
                      inputMode: 'text',
                      autoComplete: 'current-password',
                    },
                  })}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={responsive.responsive.width(5)}
                    color={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              )}
            </View>

            {/* Forgot Password */}
            {/* <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity> */}

            {/* Login Button */}
            <View style={styles.buttonContainer}>
              <ThemedButton
                title={isLoggingIn ? "Signing In..." : "Sign In"}
                onPress={handleLogin}
                variant="secondary"
                size="large"
                style={styles.loginButton}
                textStyle={styles.loginButtonText}
                disabled={isLoggingIn}
                loading={isLoggingIn}
              />
            </View>

            {/* Google Sign-In Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                style={styles.googleSignInButton}
                activeOpacity={0.8}
                disabled={false}
              >
                <View style={styles.googleSignInButtonContent}>
                  <Ionicons name="logo-google" size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(6)} color="#4285F4" />
                  <ThemedText style={styles.googleButtonText}>
                    Continue with Google
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            {/* Auth Error Display - Removed, using toast notifications instead */}

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <ThemedText style={styles.registerText}>
                Don&apos;t have an account?
              </ThemedText>
              <TouchableOpacity style={styles.registerLink} onPress={handleRegister}>
                <ThemedText style={styles.registerLinkText}>
                  Sign Up
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Continue as Guest */}
            <View style={styles.guestContainer}>
              <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
                <ThemedText style={styles.guestButtonText}>
                  Continue as Guest
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}