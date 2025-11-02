import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useRef } from 'react';
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
import { useAuth, useAuthActions, useAuthError, useAuthLoading } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 700;

export default function RegisterScreen() {
  const { colors, spacing, borderRadius } = useTheme();
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

  useEffect(() => {
    const startAnimations = () => {
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideUpAnim.value = withDelay(200, withSpring(0, { damping: 15 }));
      scaleAnim.value = withDelay(400, withSpring(1, { damping: 12 }));
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, slideUpAnim]);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    
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
      debugAuthState();
      
      const registrationData = {
        ...formData,
        phone: null,
      };
      const result = await register(registrationData);
      
      if (result.success) {
        showSuccess(
          'Registration Successful!',
          'Your account has been created. Please check your email for verification instructions.',
          {
            confirmText: 'Go to Login',
            onConfirm: () => router.replace('/LoginScreen'),
            duration: 5000,
          }
        );
      } else {
        console.error('Registration failed:', result.error);
        
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

  // Styles matching LoginScreen pattern
  const styles = StyleSheet.create({
    container: {
      ...responsive.containerStyles.fullScreen,
      backgroundColor: colors.primary,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
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
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
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
    inputRow: {
      flexDirection: 'row',
      gap: responsive.spacing.md,
      marginBottom: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
    },
    inputContainer: {
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      flex: 1,
    },
    inputLabel: {
      fontSize: responsive.responsive.fontSize(1.6),
      fontWeight: '600',
      color: 'white',
      marginBottom: responsive.spacing.sm,
    },
    inputWrapper: {
      position: 'relative',
    },
    textInput: {
      backgroundColor: Platform.OS === 'web' ? 'white' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: Platform.OS === 'ios' ? responsive.responsive.width(2.5) : responsive.responsive.width(2),
      paddingHorizontal: responsive.spacing.lg,
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      fontSize: Platform.OS === 'web' ? 16 : responsive.responsive.fontSize(1.8),
      color: Platform.OS === 'web' ? 'black' : colors.text,
      borderWidth: 1,
      borderColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
      minHeight: responsive.responsive.height(5.5),
      includeFontPadding: false,
      textAlignVertical: 'center',
      ...Platform.select({
        android: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        web: {
          transform: 'translateZ(0)',
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
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
    inputError: {
      borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    errorText: {
      fontSize: responsive.responsive.fontSize(1.4),
      color: 'rgba(255, 0, 0, 0.8)',
      marginTop: responsive.spacing.xs,
    },
    buttonContainer: {
      width: '100%',
      marginTop: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    registerButton: {
      backgroundColor: 'white',
      marginBottom: responsive.spacing.sm,
      minHeight: responsive.responsive.height(6.5),
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
      fontSize: responsive.responsive.fontSize(responsive.isSmallScreen ? 1.8 : 2.0),
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
    },
    loginText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'rgba(255, 255, 255, 0.8)',
    },
    loginLink: {
      marginLeft: responsive.spacing.xs,
    },
    loginLinkText: {
      fontSize: responsive.responsive.fontSize(1.6),
      color: 'white',
      fontWeight: '600',
      textDecorationLine: 'underline',
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
      <Animated.View style={[styles.decorativeCircle1, contentAnimatedStyle]} />
      <Animated.View style={[styles.decorativeCircle2, contentAnimatedStyle]} />

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
            <ThemedText style={styles.title}>
              Create Account
            </ThemedText>
            
            <ThemedText style={styles.subtitle}>
              Join Salon 16 and start booking
            </ThemedText>
          </Animated.View>

          {/* Registration Form */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            {/* Name Row */}
            <View style={styles.inputRow}>
              <View 
                ref={(ref) => (inputContainerRefs.current.firstName = ref)}
                style={styles.inputContainer}
              >
                <ThemedText style={styles.inputLabel}>First Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => (inputRefs.current.firstName = ref)}
                    style={[styles.textInput, errors.firstName && styles.inputError]}
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

              <View 
                ref={(ref) => (inputContainerRefs.current.lastName = ref)}
                style={styles.inputContainer}
              >
                <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => (inputRefs.current.lastName = ref)}
                    style={[styles.textInput, errors.lastName && styles.inputError]}
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
                  placeholder="Create a password"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
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
                    size={responsive.responsive.width(5)}
                    color={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              )}
            </View>

            {/* Confirm Password Input */}
            <View 
              ref={(ref) => (inputContainerRefs.current.confirmPassword = ref)}
              style={styles.inputContainer}
            >
              <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current.confirmPassword = ref)}
                  style={[styles.textInput, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  placeholderTextColor={Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
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
                    size={responsive.responsive.width(5)}
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
    </SafeAreaView>
  );
}
