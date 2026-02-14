import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with platform-specific persistence
let auth;
try {
  if (Platform.OS === 'web') {
    // Web platform - use getAuth
    auth = getAuth(app);
  } else {
    // Mobile platforms - use initializeAuth with AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  // Fallback to getAuth if initialization fails
  console.warn('Firebase Auth initialization failed, using fallback:', error.message);
  auth = getAuth(app);
}

// Initialize Firebase services
export const db = getFirestore(app);

// Configure Firestore settings for better network handling
const configureFirestore = async () => {
  try {
    // Enable network with retry logic
    await enableNetwork(db);
    console.log('Firebase Firestore connected successfully');
  } catch (error) {
    console.warn('Firebase Firestore connection issue:', error.message);
    // App will work in offline mode
  }
};

// Initialize Firestore connection
configureFirestore();

// Export network management functions
export const firebaseNetwork = {
  enable: () => enableNetwork(db),
  disable: () => disableNetwork(db)
};

// Messaging initialization for web platform only (guard browser globals)
let messaging = null;
const isWeb = (typeof window !== 'undefined') && (typeof navigator !== 'undefined') && Platform.OS === 'web';
if (isWeb && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error.message);
  }
}

export { messaging };

  export { auth };
export default app;
