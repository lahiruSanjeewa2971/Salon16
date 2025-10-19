// Script to initialize default salon settings in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase configuration (you may need to adjust this based on your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "salon16",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default salon settings
const defaultSettings = {
  weeklySchedule: {
    monday: { openTime: '08:30', closeTime: '21:00', isClosed: false },
    tuesday: { openTime: '08:30', closeTime: '21:00', isClosed: true },
    wednesday: { openTime: '08:30', closeTime: '21:00', isClosed: false },
    thursday: { openTime: '08:30', closeTime: '21:00', isClosed: false },
    friday: { openTime: '08:30', closeTime: '21:00', isClosed: false },
    saturday: { openTime: '09:00', closeTime: '20:00', isClosed: false },
    sunday: { openTime: '10:00', closeTime: '18:00', isClosed: false }
  },
  defaultTuesdayClosed: true,
  holidayPolicy: 'closed',
  createdAt: new Date(),
  updatedAt: new Date()
};

async function initializeSalonSettings() {
  try {
    console.log('Initializing salon settings...');
    
    // Check if settings already exist
    const docRef = doc(db, 'salonSettings', 'default');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('Salon settings already exist, skipping initialization.');
      return;
    }
    
    // Create default settings
    await setDoc(docRef, defaultSettings);
    console.log('✅ Default salon settings initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing salon settings:', error);
  }
}

// Run the initialization
initializeSalonSettings();
