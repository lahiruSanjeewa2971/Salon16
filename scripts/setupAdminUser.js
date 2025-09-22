/**
 * Admin User Setup Script for Salon 16
 * 
 * This script creates an admin user in Firebase Authentication and Firestore
 * with the credentials: salon16admin@gmail.com / Abcd@1234
 * 
 * Run this script using: node scripts/setupAdminUser.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection,
  addDoc 
} from 'firebase/firestore';

// Firebase configuration (same as in firebase.config.js)
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
const auth = getAuth(app);
const db = getFirestore(app);

// Admin user credentials
const ADMIN_EMAIL = 'rathne1997@gmail.com';
const ADMIN_PASSWORD = 'Abcd@1234';
const ADMIN_DISPLAY_NAME = 'Rathne Admin';

// Admin user data for Firestore
const adminUserData = {
  email: ADMIN_EMAIL,
  displayName: ADMIN_DISPLAY_NAME,
  firstName: 'Rathne',
  lastName: 'Admin',
  phone: '+1234567890',
  userType: 'admin',
  isActive: true,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  adminSettings: {
    canManageServices: true,
    canManageCustomers: true,
    canViewAnalytics: true,
    canManageBookings: true,
    canManageStaff: true
  },
  preferences: {
    notifications: true,
    preferredServices: [],
    theme: 'light'
  }
};

// Salon settings data
const salonSettingsData = {
  salonName: 'Salon 16',
  address: '123 Main Street, City, State 12345',
  phone: '+1234567890',
  email: 'info@salon16.com',
  workingHours: {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: true },
    sunday: { open: '10:00', close: '16:00', isOpen: false }
  },
  blockedDates: [],
  timeSlotDuration: 30, // 30 minutes
  advanceBookingDays: 90, // 90 days
  rescheduleLimit: 2, // 2 reschedules per day
  cancellationHours: 2, // 2 hours before appointment
  createdAt: new Date(),
  updatedAt: new Date()
};

// Sample service categories
const serviceCategories = [
  {
    name: 'Hair Services',
    description: 'Professional hair cutting, styling, and coloring services',
    icon: 'cut',
    color: '#6C2A52',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Nail Services',
    description: 'Manicures, pedicures, and nail art services',
    icon: 'hand-left',
    color: '#EC4899',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Facial Services',
    description: 'Skincare treatments and facial services',
    icon: 'flower',
    color: '#D4AF37',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Spa Services',
    description: 'Relaxing spa and wellness treatments',
    icon: 'leaf',
    color: '#8E3B60',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date()
  }
];

// Sample services
const sampleServices = [
  {
    categoryId: 'hair-services', // Will be updated with actual category ID
    name: 'Hair Cut & Style',
    description: 'Professional haircut with styling and blow-dry',
    price: 85.00,
    durationMinutes: 60,
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    categoryId: 'hair-services',
    name: 'Hair Coloring',
    description: 'Full hair coloring service with premium products',
    price: 150.00,
    durationMinutes: 120,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    categoryId: 'nail-services',
    name: 'Manicure & Pedicure',
    description: 'Complete nail care with polish application',
    price: 65.00,
    durationMinutes: 75,
    isFeatured: false,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    categoryId: 'facial-services',
    name: 'Deep Facial Treatment',
    description: 'Rejuvenating facial with deep cleansing and moisturizing',
    price: 120.00,
    durationMinutes: 90,
    isFeatured: true,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function setupAdminUser() {
  try {
    console.log('🚀 Starting admin user setup...');
    
    // Step 1: Create admin user in Firebase Authentication
    console.log('📧 Creating admin user in Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      ADMIN_EMAIL, 
      ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('✅ Admin user created in Firebase Auth:', user.uid);
    
    // Step 2: Update user profile
    console.log('👤 Updating user profile...');
    await updateProfile(user, {
      displayName: ADMIN_DISPLAY_NAME
    });
    
    // Step 3: Send email verification
    console.log('📬 Sending email verification...');
    await sendEmailVerification(user);
    console.log('✅ Email verification sent to:', ADMIN_EMAIL);
    
    // Step 4: Create admin user document in Firestore
    console.log('💾 Creating admin user document in Firestore...');
    const adminUserRef = doc(db, 'users', user.uid);
    await setDoc(adminUserRef, adminUserData);
    console.log('✅ Admin user document created in Firestore');
    
    // Step 5: Create salon settings document
    console.log('⚙️ Creating salon settings...');
    const settingsRef = doc(db, 'settings', 'salon');
    await setDoc(settingsRef, salonSettingsData);
    console.log('✅ Salon settings created');
    
    // Step 6: Create service categories
    console.log('🏷️ Creating service categories...');
    const categoriesRef = collection(db, 'categories');
    const categoryIds = {};
    
    for (const category of serviceCategories) {
      const categoryDoc = await addDoc(categoriesRef, category);
      categoryIds[category.name.toLowerCase().replace(/\s+/g, '-')] = categoryDoc.id;
      console.log(`✅ Created category: ${category.name} (ID: ${categoryDoc.id})`);
    }
    
    // Step 7: Create sample services
    console.log('✂️ Creating sample services...');
    const servicesRef = collection(db, 'services');
    
    for (const service of sampleServices) {
      // Update categoryId with actual category ID
      const serviceData = {
        ...service,
        categoryId: categoryIds[service.categoryId] || service.categoryId
      };
      
      const serviceDoc = await addDoc(servicesRef, serviceData);
      console.log(`✅ Created service: ${service.name} (ID: ${serviceDoc.id})`);
    }
    
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('📋 Summary:');
    console.log(`   • Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   • Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`   • User ID: ${user.uid}`);
    console.log(`   • Email Verification: Sent to ${ADMIN_EMAIL}`);
    console.log(`   • Firestore Documents: Created`);
    console.log(`   • Service Categories: ${serviceCategories.length} created`);
    console.log(`   • Sample Services: ${sampleServices.length} created`);
    
    console.log('\n🔐 You can now login to the app using:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Admin user already exists. You can:');
      console.log('   1. Use the existing credentials to login');
      console.log('   2. Delete the existing user and run this script again');
      console.log('   3. Update the email in this script to use a different email');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n⚠️  Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n⚠️  Invalid email format. Please check the email address.');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check your Firebase configuration');
      console.log('   2. Ensure you have the correct Firebase project ID');
      console.log('   3. Verify your Firebase project has Authentication enabled');
      console.log('   4. Check your internet connection');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupAdminUser();
