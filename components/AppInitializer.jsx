import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { networkService } from '../services/networkService';
import { ThemedText } from './ThemedText';
import { useTheme } from '../contexts/ThemeContext';

/**
 * AppInitializer Component
 * Handles the initial authentication flow and navigation
 * 
 * Flow:
 * 1. Check network connectivity
 * 2. Check stored token validity
 * 3. Check user data existence
 * 4. Navigate to appropriate screen
 */
export default function AppInitializer() {
  const { colors, spacing } = useTheme();
  const { isAuthenticated, user, isLoading } = useAuth();
  const loadingState = isLoading();
  const router = useRouter();
  
  const [isOnline, setIsOnline] = useState(true);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    // Set up network status listener
    const unsubscribeNetwork = networkService.addListener((connected) => {
      setIsOnline(connected);
    });

    // Cleanup network listener
    return () => {
      unsubscribeNetwork();
    };
  }, []);

  useEffect(() => {
    // Handle authentication flow when auth state changes
    const handleAuthFlow = async () => {
      try {
        console.log('AppInitializer: Starting authentication flow...');
        console.log('AppInitializer: Auth state -', {
          isAuthenticated,
          hasUser: !!user,
          userEmail: user?.email,
          isLoading: loadingState,
          isOnline
        });

        // Wait for auth initialization to complete
        if (loadingState) {
          console.log('AppInitializer: Auth still loading, waiting...');
          return;
        }

        // Check network connectivity first
        if (!isOnline) {
          console.log('AppInitializer: Device is offline, showing welcome screen');
          router.replace('/WelcomeScreen');
          setInitializationComplete(true);
          return;
        }

        // Check if user is authenticated
        if (isAuthenticated && user) {
          console.log('AppInitializer: User is authenticated, navigating based on role');
          console.log('AppInitializer: User details -', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.name,
            role: user.role
          });
          
          // Navigate based on user role
          if (user.role === 'admin') {
            console.log('AppInitializer: Admin user detected, navigating to admin dashboard');
            router.replace('/(admin-tabs)');
          } else {
            console.log('AppInitializer: Customer user detected, navigating to customer home');
            router.replace('/(customer-tabs)');
          }
        } else {
          console.log('AppInitializer: User not authenticated, showing welcome screen');
          console.log('AppInitializer: Auth details -', {
            isAuthenticated,
            hasUser: !!user,
            userUid: user?.uid
          });
          router.replace('/WelcomeScreen');
        }

        setInitializationComplete(true);
      } catch (error) {
        console.error('AppInitializer: Error in authentication flow', error);
        // On error, show welcome screen
        router.replace('/WelcomeScreen');
        setInitializationComplete(true);
      }
    };

    // Add a small delay to ensure all services are initialized
    const timeoutId = setTimeout(handleAuthFlow, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, loadingState, isOnline, router]);

  // Show loading screen while initializing
  if (!initializationComplete) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.spinner}
          />
          <ThemedText style={[styles.loadingText, { color: colors.text }]}>
            {!isOnline ? 'Checking connection...' : 'Loading...'}
          </ThemedText>
        </View>
      </View>
    );
  }

  // This should not render as we navigate away
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
