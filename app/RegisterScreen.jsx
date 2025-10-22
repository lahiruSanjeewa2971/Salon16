import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
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
import { useResponsive } from '../hooks/useResponsive';

const { height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = height < 700;

export default function RegisterScreen() {
  const { colors, spacing } = useTheme();
  const responsive = useResponsive();
  const router = useRouter();

  // Auth hooks
  const { isAuthenticated, debugAuthState } = useAuth();
  const { register } = useAuthActions();
  const { error: authError, clearError } = useAuthError();
  const { isRegistering } = useAuthLoading();

  // Smart scrolling state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});

  // Keyboard listeners
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
    if (isKeyboardVisible && scrollViewRef.current && inputRefs.current[inputName]) {
      setTimeout(() => {
        inputRefs.current[inputName]?.measureLayout(
          scrollViewRef.current.getInnerViewNode(),
          (x, y, width, height) => {
            scrollViewRef.current?.scrollTo({
              y: y - 100, // Offset to show input clearly
              animated: true,
            });
          },
          () => {}
        );
      }, 100);
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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Debug: Check current auth state
      debugAuthState();
      
      // Call auth service to register user
      const result = await register(formData);
      
      if (result.success) {
        // Show success alert with email verification info
        showSuccess(
          'Registration Successful!',
          'Your account has been created. Please check your email for verification instructions.',
          {
            confirmText: 'Go to Login',
            onConfirm: () => router.replace('/LoginScreen'),
            duration: 5000, // 5 seconds instead of default 3 seconds
          }
        );
      } else {
        console.error('Registration failed:', result.error);
        
        // Show error toast with better messaging
        const errorMessage = result.error || 'Please try again with valid information.';
        const isEmailExistsError = errorMessage.includes('already exists') || errorMessage.includes('already in use');
        
        showErrorToast(
          isEmailExistsError ? 'Email Already Registered' : 'Registration Failed',
          isEmailExistsError 
            ? 'This email is already registered. Please try logging in instead.'
            : errorMessage,
          { duration: 6000 }
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      showErrorToast(
        'Registration Error',
        'Something went wrong. Please try again.',
        { duration: 5000 }
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.push('/LoginScreen');
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
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
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
      marginBottom: isSmallScreen ? spacing.lg : spacing.xl,
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
    inputRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputContainer: {
      marginBottom: spacing.lg,
      flex: 1,
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
      borderColor: Platform.OS === 'web' 
        ? (errors.firstName || errors.lastName || errors.email || errors.phone || errors.password || errors.confirmPassword ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)')
        : (errors.firstName || errors.lastName || errors.email || errors.phone || errors.password || errors.confirmPassword ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)'),
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
    errorText: {
      fontSize: 12,
      color: 'rgba(255, 0, 0, 0.8)',
      marginTop: spacing.xs,
    },
    buttonContainer: {
      width: '100%',
      marginTop: spacing.lg,
    },
    registerButton: {
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
    registerButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: isSmallScreen ? 16 : 18,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    loginText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    loginLink: {
      marginLeft: spacing.xs,
    },
    loginLinkText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    // Error styles removed - using toast notifications instead
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
          <Ionicons name="arrow-back" size={20} color="white" />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </View>
      </TouchableOpacity>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: isKeyboardVisible ? 0 : 1 }
          ]}
          showsVerticalScrollIndicator={isKeyboardVisible}
          scrollEnabled={isKeyboardVisible}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.mainContent}>
          {/* Header */}
          <Animated.View style={[styles.header, contentAnimatedStyle]}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={isSmallScreen ? 35 : 45} color="white" />
              </View>
              
              <ThemedText style={styles.title}>
                Create Account
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                Join Salon 16 and start booking
              </ThemedText>
            </Animated.View>
          </Animated.View>

          {/* Registration Form */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            {/* Name Row */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>First Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => (inputRefs.current.firstName = ref)}
                    style={styles.textInput}
                    placeholder="First name"
                    placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    onFocus={() => handleInputFocus('firstName')}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {errors.firstName && (
                  <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>
                )}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => (inputRefs.current.lastName = ref)}
                    style={styles.textInput}
                    placeholder="Last name"
                    placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    onFocus={() => handleInputFocus('lastName')}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {errors.lastName && (
                  <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>
                )}
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.email = ref)}
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  onFocus={() => handleInputFocus('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.phone = ref)}
                  style={styles.textInput}
                  placeholder="Enter your phone"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  onFocus={() => handleInputFocus('phone')}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>
              {errors.phone && (
                <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.password = ref)}
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  onFocus={() => handleInputFocus('password')}
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.confirmPassword = ref)}
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  onFocus={() => handleInputFocus('confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}
            </View>

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <ThemedButton
                title={isRegistering ? "Creating Account..." : "Create Account"}
                onPress={handleRegister}
                variant="secondary"
                size="large"
                style={styles.registerButton}
                textStyle={styles.registerButtonText}
                disabled={isRegistering}
                loading={isRegistering}
              />
            </View>

            {/* Auth Error Display - Removed, using toast notifications instead */}

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <ThemedText style={styles.loginText}>
                Already have an account?
              </ThemedText>
              <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
                <ThemedText style={styles.loginLinkText}>
                  Sign In
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
