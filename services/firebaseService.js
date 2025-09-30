import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import cloudinaryService from './cloudinaryService';

// Authentication Services
export const authService = {
  // Create new user account
  createUser: async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: userData.name
      });
      
      // Create user document in Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        profileImage: userData.profileImage || '',
        role: userData.role || 'customer',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign out current user
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore Services
export const firestoreService = {
  // Generic CRUD operations
  create: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return {
        id: docRef.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      throw error;
    }
  },

  read: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      throw error;
    }
  },

  update: async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  delete: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  },

  // Query operations
  query: async (collectionName, conditions = [], orderByField = null, limitCount = null) => {
    try {
      let q = collection(db, collectionName);
      
      // Add where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Add order by
      if (orderByField) {
        q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
      }
      
      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Real-time listener
  listen: (collectionName, conditions = [], callback) => {
    try {
      let q = collection(db, collectionName);
      
      // Add where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      return onSnapshot(q, (querySnapshot) => {
        const results = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        callback(results);
      });
    } catch (error) {
      throw error;
    }
  }
};

// Image Storage Services (using Cloudinary)
export const imageService = {
  // Upload profile image
  uploadProfileImage: async (imageUri, userId) => {
    try {
      return await cloudinaryService.uploadProfileImage(imageUri, userId);
    } catch (error) {
      throw error;
    }
  },

  // Upload review image
  uploadReviewImage: async (imageUri, reviewId, index = 0) => {
    try {
      return await cloudinaryService.uploadReviewImage(imageUri, reviewId, index);
    } catch (error) {
      throw error;
    }
  },

  // Pick image from gallery
  pickImage: async (options = {}) => {
    try {
      return await cloudinaryService.pickImageFromGallery(options);
    } catch (error) {
      throw error;
    }
  },

  // Take photo with camera
  takePhoto: async (options = {}) => {
    try {
      return await cloudinaryService.takePhoto(options);
    } catch (error) {
      throw error;
    }
  },

  // Delete image
  deleteImage: async (publicId) => {
    try {
      return await cloudinaryService.deleteImage(publicId);
    } catch (error) {
      throw error;
    }
  },

  // Get optimized image URL
  getOptimizedImageUrl: (publicId, width, height, quality = 'auto') => {
    return cloudinaryService.getOptimizedImageUrl(publicId, width, height, quality);
  }
};

// Specific business logic services
export const bookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      return await firestoreService.create('bookings', {
        ...bookingData,
        status: 'pending',
        rescheduleCount: 0
      });
    } catch (error) {
      throw error;
    }
  },

  // Get user bookings
  getUserBookings: async (userId) => {
    try {
      return await firestoreService.query('bookings', [
        { field: 'customerId', operator: '==', value: userId }
      ], { field: 'createdAt', direction: 'desc' });
    } catch (error) {
      throw error;
    }
  },

  // Get bookings by date
  getBookingsByDate: async (date) => {
    try {
      return await firestoreService.query('bookings', [
        { field: 'date', operator: '==', value: date }
      ]);
    } catch (error) {
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, adminNotes = '') => {
    try {
      await firestoreService.update('bookings', bookingId, {
        status,
        adminNotes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }
};

export const serviceService = {
  // Get all active services
  getActiveServices: async () => {
    try {
      return await firestoreService.query('services', [
        { field: 'isActive', operator: '==', value: true }
      ], { field: 'name', direction: 'asc' });
    } catch (error) {
      throw error;
    }
  },

  // Create new service
  createService: async (serviceData) => {
    try {
      return await firestoreService.create('services', {
        ...serviceData,
        isActive: true
      });
    } catch (error) {
      throw error;
    }
  }
};

export const reviewService = {
  // Create new review
  createReview: async (reviewData) => {
    try {
      return await firestoreService.create('reviews', {
        ...reviewData,
        isModerated: false
      });
    } catch (error) {
      throw error;
    }
  },

  // Get reviews for a service
  getServiceReviews: async (serviceId) => {
    try {
      return await firestoreService.query('reviews', [
        { field: 'serviceId', operator: '==', value: serviceId }
      ], { field: 'createdAt', direction: 'desc' });
    } catch (error) {
      throw error;
    }
  }
};
