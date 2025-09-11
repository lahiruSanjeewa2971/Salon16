import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '../../components/ThemedText';
import { ThemedButton } from '../../components/themed/ThemedButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth, useAuthActions } from '../../hooks/useAuth';
import { useToastHelpers } from '../../components/ui/ToastSystem';

export default function CustomerProfileScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { signOut } = useAuthActions();
  const { showSuccess: showSuccessToast, showError: showErrorToast, showInfo } = useToastHelpers();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 200,
    },
  });

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      showInfo('To access this, please login.');
      // Redirect to home screen after showing toast
      setTimeout(() => {
        router.replace('/(customer-tabs)');
      }, 2000);
    }
  }, [user, router, showInfo]);

  // Show loading/redirect message for guests
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Access Restricted</ThemedText>
          <ThemedText style={styles.subtitle}>
            Please login to access your profile
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      console.log('Logout attempt...');
      
      const success = await signOut();
      
      if (success) {
        console.log('Logout successful');
        
        showSuccessToast(
          'Logout Successful!',
          'You have been logged out successfully.',
          { duration: 3000 }
        );
        
        // Redirect to welcome screen
        router.replace('/WelcomeScreen');
      } else {
        console.error('Logout failed');
        
        showErrorToast(
          'Logout Failed',
          'Failed to logout. Please try again.',
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      showErrorToast(
        'Logout Error',
        'Something went wrong. Please try again.',
        { duration: 5000 }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          Profile
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your personal information, preferences, and account settings.
        </ThemedText>
        
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
