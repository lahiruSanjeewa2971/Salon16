import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '../../components/ThemedText';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useToastHelpers } from '../../components/ui/ToastSystem';

export default function CustomerBookingsScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showInfo } = useToastHelpers();

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
            Please login to access your bookings
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          My Bookings
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          View your upcoming appointments, booking history, and manage your reservations.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
