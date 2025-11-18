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

  // Log when component renders
  console.log('AppInitializer: Component rendered');
  console.log('AppInitializer: Current path:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');

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
    console.log('AppInitializer: useEffect triggered');
    
    // Handle authentication flow when auth state changes
    const handleAuthFlow = async () => {
      try {
        console.log('AppInitializer: ===== AUTHENTICATION FLOW =====');
        console.log('AppInitializer: Auth state -', {
          isAuthenticated,
          hasUser: !!user,
          userEmail: user?.email,
          isLoading: loadingState,
          isOnline
        });
        if (loadingState) {
          console.log('AppInitializer: Auth still loading, waiting...');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));

        // Check network connectivity
        if (!isOnline) {
          console.log('AppInitializer: Device is offline, showing welcome screen');
          router.replace('/WelcomeScreen');
          setInitializationComplete(true);
          return;
        }

        // Check authentication and navigate based on role
        if (isAuthenticated && user) {
          console.log('AppInitializer: ✅ User authenticated - navigating based on role');
          
          // Navigate based on user role
          if (user.role === 'admin') {
            console.log('AppInitializer: → Navigating to admin dashboard');
            router.replace('/(admin-tabs)');
          } else {
            console.log('AppInitializer: → Navigating to customer home');
            router.replace('/(customer-tabs)');
          }
        } else {
          console.log('AppInitializer: ❌ User not authenticated - showing welcome screen');
          router.replace('/WelcomeScreen');
        }

        setInitializationComplete(true);
      } catch (error) {
        console.error('AppInitializer: Error in authentication flow', error);
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
