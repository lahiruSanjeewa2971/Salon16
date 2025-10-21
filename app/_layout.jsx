import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertProvider } from '../components/ui/AlertSystem';
import { ToastProvider } from '../components/ui/ToastSystem';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { setupErrorHandling } from '../utils/errorLogger';
import { Platform } from 'react-native';

// PWA Service Worker Registration - Web Only
if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    window.addEventListener('load', async () => {
      try {
        console.log('🔧 Attempting to register service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check if service worker is controlling the page
        if (registration.active) {
          console.log('✅ Service Worker is active and controlling the page');
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        console.log('🔍 Available service worker files:', await navigator.serviceWorker.getRegistrations());
      }
    });
  }, 100);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Setup error handling
  React.useEffect(() => {
    setupErrorHandling();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <ToastProvider>
              <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                          <Stack.Screen name="index" options={{ headerShown: false }} />
                          <Stack.Screen name="TestScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="WelcomeScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="DebugScreen" options={{ headerShown: false }} />
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="(customer-tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </NavigationThemeProvider>
            </ToastProvider>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
