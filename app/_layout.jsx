import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { Platform, StyleSheet } from "react-native";
import { AlertProvider } from "../components/ui/AlertSystem";
import { ToastProvider } from "../components/ui/ToastSystem";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { useColorScheme } from "../hooks/useColorScheme";
import { setupErrorHandling } from "../utils/errorLogger";

// PWA Service Worker Registration - Web Only
if (
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator
) {
  // Create inline service worker
  const serviceWorkerCode = `
    const CACHE_NAME = 'salon16-v3';
    const urlsToCache = ['/', '/manifest.json'];
    
    self.addEventListener('install', (event) => {
      console.log('SW: Installing...');
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(urlsToCache))
          .then(() => self.skipWaiting())
      );
    });
    
    self.addEventListener('activate', (event) => {
      console.log('SW: Activating...');
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                return caches.delete(cacheName);
              }
            })
          );
        }).then(() => self.clients.claim())
      );
    });
    
    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request)
          .then((response) => response || fetch(event.request))
      );
    });
  `;

  // Register inline service worker
  setTimeout(() => {
    window.addEventListener("load", async () => {
      try {
        console.log("🔧 Creating and registering inline service worker...");

        // Create blob URL for service worker
        const blob = new Blob([serviceWorkerCode], {
          type: "application/javascript",
        });
        const swUrl = URL.createObjectURL(blob);

        const registration = await navigator.serviceWorker.register(swUrl);
        console.log(
          "✅ Inline Service Worker registered successfully:",
          registration
        );

        // Clean up blob URL
        URL.revokeObjectURL(swUrl);

        // Check if service worker is controlling the page
        if (registration.active) {
          console.log("✅ Service Worker is active and controlling the page");
        }
      } catch (error) {
        console.error("❌ Inline Service Worker registration failed:", error);
      }
    });
  }, 100);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Setup error handling
  React.useEffect(() => {
    setupErrorHandling();
  }, []);

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <ToastProvider>
              <NavigationThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="TestScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="WelcomeScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="LoginScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="RegisterScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="HomeScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="DebugScreen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(customer-tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(admin-tabs)"
                    options={{ headerShown: false }}
                  />
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

// Responsive root container styles
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        width: "100vw",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      },
      default: {
        flex: 1,
      },
    }),
  },
});
