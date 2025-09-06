import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCMkeZWqgb20dRaFIN6phPvKrTlMNcHJE",
  authDomain: "salon16.firebaseapp.com",
  projectId: "salon16",
  storageBucket: "salon16.firebasestorage.app",
  messagingSenderId: "958917048495",
  appId: "1:958917048495:android:81dc8a28cf9ead58d3bc5a"
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

export { auth };
export default app;
