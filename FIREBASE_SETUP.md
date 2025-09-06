# Firebase Setup for Salon 16

## ✅ What's Already Configured

### 1. Dependencies Installed
- `firebase` - Main Firebase SDK
- `@react-native-firebase/app` - Firebase app initialization
- `@react-native-firebase/firestore` - Firestore database
- `@react-native-firebase/auth` - Authentication
- `@react-native-firebase/storage` - File storage
- `@react-native-firebase/messaging` - Push notifications
- `@react-native-async-storage/async-storage` - Auth persistence

### 2. Configuration Files
- `firebase.config.js` - Main Firebase configuration
- `utils/firebaseInit.js` - Firebase initialization with persistence
- `services/firebaseService.js` - Firebase service functions
- `contexts/AuthContext.js` - Authentication context provider
- `google-services.json` - Android configuration (already added)

### 3. App Configuration
- Updated `app.json` with Android package name and Google Services file
- Added AuthProvider to main app layout
- Created Firebase test component for verification

## 🔧 Firebase Console Setup Required

### 1. Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `salon16`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Optionally enable **Google** sign-in for better UX

### 2. Firestore Database Setup
1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Done**

### 3. Storage Setup
1. Go to **Storage** in Firebase Console
2. Click **Get started**
3. Choose **Start in test mode** (for development)
4. Select a location (same as Firestore)
5. Click **Done**

### 4. Security Rules (Important!)

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Services are readable by all authenticated users
    match /services/{serviceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Bookings are readable by customer and admin
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Reviews are readable by all, writable by customers
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.customerId == request.auth.uid;
    }
    
    // Notifications are readable by the user
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own profile images
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Review images are readable by all, writable by customers
    match /reviews/{reviewId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing Firebase Connection

### 1. Run the App
```bash
npm run android
# or
npm run ios
# or
npm run web
```

### 2. Test Connection
1. Open the app
2. Go to the Home tab
3. Scroll down to "Firebase Integration" section
4. Tap "Test Connection" button
5. You should see "Connected ✅" status

### 3. Test Firestore
1. Tap "Add Test Data to Firestore" button
2. Check Firebase Console → Firestore Database
3. You should see a new document in the "test" collection

## 📱 Next Steps

### 1. Create Initial Data
You'll need to create some initial data in Firestore:

#### Services Collection
```javascript
// Add some sample services
{
  name: "Haircut",
  description: "Professional haircut and styling",
  price: 25,
  duration: 60,
  category: "Hair",
  isActive: true
}
```

#### Settings Collection
```javascript
// Add salon settings
{
  salon: {
    name: "Salon 16",
    address: "123 Main St, City, State",
    phone: "+1234567890",
    email: "info@salon16.com",
    workingHours: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      // ... other days
    },
    timeSlotDuration: 30,
    advanceBookingDays: 90
  }
}
```

### 2. User Roles
- Create admin user with `role: 'admin'`
- Regular users will have `role: 'customer'`

### 3. Push Notifications
- Set up FCM for push notifications
- Configure notification channels for Android
- Test notification delivery

## 🔍 Troubleshooting

### Common Issues

1. **"Firebase connection failed"**
   - Check if `google-services.json` is in the root directory
   - Verify the package name in `app.json` matches Firebase project
   - Ensure Firestore is enabled in Firebase Console

2. **"Permission denied"**
   - Check Firestore security rules
   - Ensure user is authenticated
   - Verify user has proper role permissions

3. **"App not found"**
   - Make sure the app is registered in Firebase Console
   - Check the SHA-1 fingerprint for Android
   - Verify the bundle ID for iOS

### Debug Mode
Enable debug logging by adding this to your app:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

if (__DEV__) {
  // Enable debug mode
  console.log('Firebase debug mode enabled');
}
```

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Security rules configured
- [ ] App builds and runs successfully
- [ ] Firebase test component shows "Connected ✅"
- [ ] Test data can be added to Firestore
- [ ] User authentication works
- [ ] Admin user created with proper role

---

*Firebase is now fully configured for Salon 16! You can start building the booking features.*
