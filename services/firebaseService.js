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
    startAfter,
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
  },

  // Update document
  update: async (collectionName, docId, updateData) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { id: docId, ...updateData };
    } catch (error) {
      throw error;
    }
  },

  // Delete document
  delete: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return { id: docId };
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
      // Simple query without ordering to avoid index requirement
      return await firestoreService.query('services', [
        { field: 'isActive', operator: '==', value: true }
      ]);
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
  },

  // Update service
  updateService: async (serviceId, updateData) => {
    try {
      return await firestoreService.update('services', serviceId, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete service
  deleteService: async (serviceId) => {
    try {
      return await firestoreService.delete('services', serviceId);
    } catch (error) {
      throw error;
    }
  },

  // Toggle service status
  toggleServiceStatus: async (serviceId, isActive) => {
    try {
      return await firestoreService.update('services', serviceId, {
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  },

  // Get services by category
  getServicesByCategory: async (categoryId) => {
    try {
      return await firestoreService.query('services', [
        { field: 'category.id', operator: '==', value: categoryId }
      ]);
    } catch (error) {
      throw error;
    }
  },

  // Get active services by category
  getActiveServicesByCategory: async (categoryId) => {
    try {
      console.log(`🔍 ServiceService: Searching for active services with category.id = ${categoryId}`);
      const services = await firestoreService.query('services', [
        { field: 'category.id', operator: '==', value: categoryId },
        { field: 'isActive', operator: '==', value: true }
      ]);
      console.log(`📊 ServiceService: Found ${services.length} active services for category ${categoryId}`);
      return services;
    } catch (error) {
      console.error('❌ ServiceService: Error getting active services by category:', error);
      throw error;
    }
  },

  // Cascade deactivate services in category
  cascadeDeactivateServicesInCategory: async (categoryId) => {
    try {
      console.log(`🔄 ServiceService: Starting cascade deactivation for category ${categoryId}`);
      
      // Get all active services in this category
      const activeServices = await serviceService.getActiveServicesByCategory(categoryId);
      console.log(`📊 ServiceService: Found ${activeServices.length} active services in category`);
      
      if (activeServices.length === 0) {
        console.log('✅ ServiceService: No active services found, skipping cascade deactivation');
        return { deactivatedCount: 0, services: [] };
      }

      // Deactivate all services in the category
      const deactivationPromises = activeServices.map(service => 
        serviceService.toggleServiceStatus(service.id, false)
      );

      await Promise.all(deactivationPromises);
      
      console.log(`✅ ServiceService: Successfully deactivated ${activeServices.length} services`);
      
      return {
        deactivatedCount: activeServices.length,
        services: activeServices.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price
        }))
      };
    } catch (error) {
      console.error('❌ ServiceService: Error in cascade deactivation:', error);
      throw error;
    }
  },

  // Cascade reactivate services in category
  cascadeReactivateServicesInCategory: async (categoryId) => {
    try {
      console.log(`🔄 ServiceService: Starting cascade reactivation for category ${categoryId}`);
      
      // Get all inactive services in this category
      const inactiveServices = await firestoreService.query('services', [
        { field: 'category.id', operator: '==', value: categoryId },
        { field: 'isActive', operator: '==', value: false }
      ]);
      
      console.log(`📊 ServiceService: Found ${inactiveServices.length} inactive services in category`);
      
      if (inactiveServices.length === 0) {
        console.log('✅ ServiceService: No inactive services found, skipping cascade reactivation');
        return { reactivatedCount: 0, services: [] };
      }

      // Reactivate all services in the category
      const reactivationPromises = inactiveServices.map(service => 
        serviceService.toggleServiceStatus(service.id, true)
      );

      await Promise.all(reactivationPromises);
      
      console.log(`✅ ServiceService: Successfully reactivated ${inactiveServices.length} services`);
      
      return {
        reactivatedCount: inactiveServices.length,
        services: inactiveServices.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price
        }))
      };
    } catch (error) {
      console.error('❌ ServiceService: Error in cascade reactivation:', error);
      throw error;
    }
  }
};

export const categoryService = {
  // Create new category
  createCategory: async (categoryData) => {
    try {
      return await firestoreService.create('categories', {
        ...categoryData,
        isActive: true
      });
    } catch (error) {
      throw error;
    }
  },

  // Get all active categories
  getActiveCategories: async () => {
    try {
      return await firestoreService.query('categories', [
        { field: 'isActive', operator: '==', value: true }
      ]);
    } catch (error) {
      throw error;
    }
  },

  // Get all categories for admin (active and inactive)
  getAllCategoriesForAdmin: async () => {
    try {
      return await firestoreService.query('categories', []);
    } catch (error) {
      throw error;
    }
  },

  // Get all categories (active and inactive)
  getAllCategories: async () => {
    try {
      return await firestoreService.query('categories', []);
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to all categories changes (real-time updates for admin)
  subscribeToCategories: (callback) => {
    try {
      return firestoreService.listen('categories', [], callback);
    } catch (error) {
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    try {
      return await firestoreService.delete('categories', categoryId);
    } catch (error) {
      throw error;
    }
  },

  // Toggle category status
  toggleCategoryStatus: async (categoryId, isActive) => {
    try {
      console.log(`🔄 CategoryService: Toggling category ${categoryId} to ${isActive ? 'active' : 'inactive'}`);
      
      await firestoreService.update('categories', categoryId, {
        isActive,
        updatedAt: new Date()
      });
      
      console.log(`✅ CategoryService: Category ${isActive ? 'activated' : 'deactivated'} successfully`);
      return {
        success: true,
        message: `Category ${isActive ? 'activated' : 'deactivated'} successfully.`
      };
    } catch (error) {
      console.error('❌ CategoryService: Error toggling category status:', error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (categoryId, updateData) => {
    try {
      return await firestoreService.update('categories', categoryId, {
        ...updateData,
        updatedAt: new Date()
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

export const customerService = {
  // Get customers with pagination
  getCustomers: async (lastDoc = null, limitCount = 20) => {
    try {
      console.log('🔍 CustomerService: Fetching customers from Firestore...');
      
      let q = collection(db, 'users');
      
      // Add where condition for customers only (no orderBy to avoid index requirement)
      q = query(q, where('role', '==', 'customer'));
      
      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      // Add limit
      q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const customers = [];
      let lastVisible = null;
      
      querySnapshot.forEach((doc) => {
        const customerData = { id: doc.id, ...doc.data() };
        customers.push(customerData);
        lastVisible = doc;
      });
      
      // Sort customers by createdAt on client side (newest first)
      customers.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log(`📊 CustomerService: Fetched ${customers.length} customers`);
      console.log('📋 CustomerService: Full customer list:', customers);
      
      return {
        customers,
        lastDoc: lastVisible,
        hasMore: customers.length === limitCount
      };
    } catch (error) {
      console.error('❌ CustomerService: Error fetching customers:', error);
      throw error;
    }
  },

  // Get customer with stats (bookings, spending, etc.)
  getCustomerWithStats: async (customerId) => {
    try {
      // Get customer basic info
      const customer = await firestoreService.read('users', customerId);
      
      // Get customer bookings
      const bookings = await firestoreService.query('bookings', [
        { field: 'userId', operator: '==', value: customerId }
      ], { field: 'createdAt', direction: 'desc' });
      
      // Calculate stats
      const stats = {
        totalBookings: bookings.length,
        totalSpent: bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
        lastVisit: bookings.length > 0 ? bookings[0].createdAt : null,
        favoriteService: getFavoriteService(bookings),
        status: getCustomerStatus(bookings)
      };
      
      return {
        ...customer,
        ...stats
      };
    } catch (error) {
      console.error('❌ CustomerService: Error fetching customer stats:', error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (searchQuery, lastDoc = null, limitCount = 20) => {
    try {
      console.log(`🔍 CustomerService: Searching customers with query: "${searchQuery}"`);
      
      let q = collection(db, 'users');
      
      // Add where condition for customers only (no orderBy to avoid index requirement)
      q = query(q, where('role', '==', 'customer'));
      
      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      // Add limit
      q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const customers = [];
      let lastVisible = null;
      
      querySnapshot.forEach((doc) => {
        const customerData = { id: doc.id, ...doc.data() };
        
        // Client-side filtering for search (since Firestore doesn't support case-insensitive search)
        const matchesSearch = !searchQuery || 
          (customerData.name && customerData.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customerData.email && customerData.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customerData.phone && customerData.phone.includes(searchQuery));
        
        if (matchesSearch) {
          customers.push(customerData);
        }
        lastVisible = doc;
      });
      
      // Sort customers by name on client side (A-Z)
      customers.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
      
      console.log(`📊 CustomerService: Found ${customers.length} customers matching search`);
      
      return {
        customers,
        lastDoc: lastVisible,
        hasMore: customers.length === limitCount
      };
    } catch (error) {
      console.error('❌ CustomerService: Error searching customers:', error);
      throw error;
    }
  },

  // Real-time listener for customers
  listenToCustomers: (callback) => {
    try {
      return firestoreService.listen('users', [
        { field: 'role', operator: '==', value: 'customer' }
      ], callback);
    } catch (error) {
      console.error('❌ CustomerService: Error setting up customer listener:', error);
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (customerId, updateData) => {
    try {
      return await firestoreService.update('users', customerId, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('❌ CustomerService: Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer (soft delete by updating role)
  deleteCustomer: async (customerId) => {
    try {
      return await firestoreService.update('users', customerId, {
        role: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('❌ CustomerService: Error deleting customer:', error);
      throw error;
    }
  }
};

// Helper functions
const getFavoriteService = (bookings) => {
  if (!bookings || bookings.length === 0) return 'N/A';
  
  const serviceCounts = {};
  bookings.forEach(booking => {
    const serviceName = booking.serviceName || 'Unknown Service';
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });
  
  const favorite = Object.keys(serviceCounts).reduce((a, b) => 
    serviceCounts[a] > serviceCounts[b] ? a : b
  );
  
  return favorite;
};

const getCustomerStatus = (bookings) => {
  if (!bookings || bookings.length === 0) return 'new';
  
  const lastBooking = bookings[0];
  const lastVisitDate = lastBooking.createdAt?.toDate ? lastBooking.createdAt.toDate() : new Date(lastBooking.createdAt);
  const daysSinceLastVisit = (new Date() - lastVisitDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastVisit <= 90) return 'active';
  return 'inactive';
};
