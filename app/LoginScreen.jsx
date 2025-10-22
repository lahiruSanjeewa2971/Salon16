import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
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
import { useAuth, useAuthActions, useAuthError, useAuthLoading } from '../hooks/useAuth';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;

export default function LoginScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const router = useRouter();

  // Auth hooks
  const { isAuthenticated, debugAuthState } = useAuth();
  const { login } = useAuthActions();
  const { error: authError, clearError } = useAuthError();
  const { isLoggingIn } = useAuthLoading();

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
      flex: 1,
      backgroundColor: colors.background,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: height,
    },
    decorativeCircle1: {
      position: 'absolute',
      top: isSmallScreen ? -40 : -60,
      right: isSmallScreen ? -40 : -60,
      width: isSmallScreen ? 120 : 160,
      height: isSmallScreen ? 120 : 160,
      borderRadius: isSmallScreen ? 60 : 80,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle2: {
      position: 'absolute',
      bottom: isSmallScreen ? -80 : -120,
      left: isSmallScreen ? -80 : -120,
      width: isSmallScreen ? 160 : 240,
      height: isSmallScreen ? 160 : 240,
      borderRadius: isSmallScreen ? 80 : 120,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scrollContainer: {
      flex: 1,
    },
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? spacing.lg : spacing.xl,
      paddingTop: isSmallScreen ? spacing.lg : 0,
      paddingBottom: isSmallScreen ? spacing.lg : 0,
    },
    header: {
      alignItems: 'center',
      marginBottom: isSmallScreen ? spacing.xl : spacing.xxl,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoCircle: {
      width: isSmallScreen ? 70 : 90,
      height: isSmallScreen ? 70 : 90,
      borderRadius: isSmallScreen ? 35 : 45,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
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
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: isSmallScreen ? 14 : 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      fontWeight: '300',
    },
    formContainer: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: isSmallScreen ? spacing.lg : spacing.xl,
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
      marginBottom: spacing.lg,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
      marginBottom: spacing.sm,
    },
    inputWrapper: {
      position: 'relative',
    },
    textInput: {
      backgroundColor: Platform.OS === 'web' ? 'white' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: Platform.OS === 'ios' ? 10 : 8,
      paddingHorizontal: spacing.md,
      paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
      fontSize: 16,
      color: Platform.OS === 'web' ? 'black' : colors.text,
      borderWidth: 1,
      borderColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
    },
    passwordInput: {
      paddingRight: 50,
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: spacing.sm,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      textDecorationLine: 'underline',
    },
    buttonContainer: {
      width: '100%',
      marginTop: spacing.lg,
    },
    loginButton: {
      backgroundColor: 'white',
      marginBottom: spacing.md,
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
      fontSize: isSmallScreen ? 16 : 18,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    registerText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    registerLink: {
      marginLeft: spacing.xs,
    },
    registerLinkText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    guestContainer: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    guestButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    guestButtonText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    backButton: {
      position: 'absolute',
      top: isSmallScreen ? 40 : 50,
      left: spacing.lg,
      zIndex: 1,
      padding: spacing.sm,
    },
    backButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButtonText: {
      color: 'white',
      fontSize: 16,
      marginLeft: spacing.xs,
    },
    inputError: {
      borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    errorText: {
      fontSize: 12,
      color: 'rgba(255, 0, 0, 0.8)',
      marginTop: spacing.xs,
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
      />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorativeCircle1, logoAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, logoAnimatedStyle]} />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <View style={styles.backButtonContent}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </View>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Header */}
          <Animated.View style={[styles.header, contentAnimatedStyle]}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={isSmallScreen ? 35 : 45} color="white" />
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
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

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