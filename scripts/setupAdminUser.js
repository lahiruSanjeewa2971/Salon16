/**
 * Admin User Setup Script for Salon 16
 * 
 * This script creates an admin user in Firebase Authentication and Firestore
 * with the credentials: salon16admin@gmail.com / Abcd@1234
 * 
 * Run this script using: node scripts/setupAdminUser.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  collection,
  addDoc 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin user credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Admin User';

// Admin user data for Firestore
const adminUserData = {
  email: ADMIN_EMAIL,
  displayName: ADMIN_DISPLAY_NAME,
  firstName: 'Rathne',
  lastName: 'Admin',
  phone: '+1234567890',
  profileImage: '',
  role: 'admin', // Using 'role' field to match existing codebase
  isEmailVerified: false,
  createdAt: new Date(),
  lastLogin: null,
  preferences: {
    notifications: true,
    preferredServices: [],
    theme: 'light'
  }
};

// Only admin user data - no additional services or settings

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
    
    // Admin user setup complete - no additional data creation needed
    
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('📋 Summary:');
    console.log(`   • Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   • Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`   • User ID: ${user.uid}`);
    console.log(`   • Email Verification: Sent to ${ADMIN_EMAIL}`);
    console.log(`   • Firestore User Document: Created`);
    
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
