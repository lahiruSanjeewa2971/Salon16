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
  setDoc,
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
  setupAuthStateListener: (callback) => {
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
        const data = doc.data();
        results.push({ id: doc.id, ...data });
      });

      return results;
    } catch (error) {
      console.error('❌ FirestoreService: Query error:', error);
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
        try {
          const results = [];
          querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
          });
          callback(results);
        } catch (error) {
          console.error('Error processing real-time listener data:', error);
          // Call callback with empty array to prevent crashes
          callback([]);
        }
      }, (error) => {
        console.error('Real-time listener error:', error);
        // Call callback with empty array on error
        callback([]);
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
      const bookings = await firestoreService.query('bookings', [
        { field: 'date', operator: '==', value: date }
      ]);
      
      // Return empty array if no bookings found (normal case)
      return bookings || [];
    } catch (error) {
      // Log the full error for debugging
      console.error('❌ BookingService: Error querying bookings by date:', error);      
      // If error is due to permissions or empty collection, return empty array
      // This allows the booking flow to continue even if query fails
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.warn('⚠️ BookingService: Permission denied when querying bookings, returning empty array');
        return [];
      }
      // For other errors, log and return empty array to prevent blocking booking creation
      console.warn('⚠️ BookingService: Error querying bookings by date, returning empty array');
      return [];
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status, adminNotes = '') => {
    try {
      // Update the booking document
      await firestoreService.update('bookings', bookingId, {
        status,
        adminNotes,
        updatedAt: serverTimestamp()
      });

      // Also update the corresponding bookingSummary document
      // Using the same bookingId as the summary document ID
      try {
        await firestoreService.update('bookingSummaries', bookingId, {
          status,
          updatedAt: serverTimestamp()
        });
      } catch (summaryError) {
        // If summary doesn't exist, log warning but don't fail the booking update
        console.warn('⚠️ BookingService: Could not update bookingSummary for booking', bookingId, summaryError.message);
      }
    } catch (error) {
      throw error;
    }
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    try {
      return await firestoreService.delete('bookings', bookingId);
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to user bookings (real-time)
  subscribeToUserBookings: (userId, callback) => {
    try {
      return firestoreService.listen('bookings', 
        [{ field: 'customerId', operator: '==', value: userId }],
        callback
      );
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to bookings by date (real-time) - for admin use
  subscribeToBookingsByDate: (date, callback) => {
    try {
      return firestoreService.listen('bookings', 
        [{ field: 'date', operator: '==', value: date }],
        callback
      );
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

  // Get all services (active and inactive) - for admin use
  getAllServices: async () => {
    try {
      // Simple query without any filters to get all services
      return await firestoreService.query('services', []);
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
      
      // Calculate booking stats for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          try {
            // Get accepted bookings for this customer
            const acceptedBookings = await firestoreService.query('bookings', [
              { field: 'customerId', operator: '==', value: customer.uid },
              { field: 'status', operator: '==', value: 'accepted' }
            ]);
            
            // Calculate total spent by summing servicePrice from accepted bookings
            const totalSpent = acceptedBookings.reduce((sum, booking) => {
              return sum + (booking.servicePrice || 0);
            }, 0);
            
            return {
              ...customer,
              totalBookings: acceptedBookings.length,
              totalSpent: totalSpent
            };
          } catch (error) {
            console.warn(`⚠️ CustomerService: Error calculating stats for customer ${customer.uid}:`, error);
            // Return customer with default stats on error
            return {
              ...customer,
              totalBookings: 0,
              totalSpent: 0
            };
          }
        })
      );
      
      // Sort customers by createdAt on client side (newest first)
      customersWithStats.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log(`📊 CustomerService: Fetched ${customersWithStats.length} customers with booking stats`);
      console.log('📋 CustomerService: Full customer list:', customersWithStats);
      
      return {
        customers: customersWithStats,
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
      
      // Calculate booking stats for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          try {
            // Get accepted bookings for this customer
            const acceptedBookings = await firestoreService.query('bookings', [
              { field: 'customerId', operator: '==', value: customer.uid },
              { field: 'status', operator: '==', value: 'accepted' }
            ]);
            
            // Calculate total spent by summing servicePrice from accepted bookings
            const totalSpent = acceptedBookings.reduce((sum, booking) => {
              return sum + (booking.servicePrice || 0);
            }, 0);
            
            return {
              ...customer,
              totalBookings: acceptedBookings.length,
              totalSpent: totalSpent
            };
          } catch (error) {
            console.warn(`⚠️ CustomerService: Error calculating stats for customer ${customer.uid}:`, error);
            // Return customer with default stats on error
            return {
              ...customer,
              totalBookings: 0,
              totalSpent: 0
            };
          }
        })
      );
      
      // Sort customers by name on client side (A-Z)
      customersWithStats.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
      
      console.log(`📊 CustomerService: Found ${customersWithStats.length} customers matching search`);
      
      return {
        customers: customersWithStats,
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

// Salon Hours Service
export const salonHoursService = {
  // Get salon hours for a specific date
  async getSalonHours(date) {
    try {
      const docRef = doc(db, 'salonHours', date);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      // Get default schedule and apply day-specific logic
      const defaultSchedule = await this.getDefaultSchedule();
      const dayOfWeek = new Date(date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const daySchedule = defaultSchedule.weeklySchedule[dayNames[dayOfWeek]];
      
      // Return default hours with day-specific logic
      return {
        id: date,
        date: date,
        dayOfWeek: dayOfWeek,
        openTime: daySchedule.openTime,
        closeTime: daySchedule.closeTime,
        isClosed: daySchedule.isClosed,
        disableBookings: false,
        isHoliday: false,
        isTuesdayOverride: false,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting salon hours:', error);
      throw error;
    }
  },

  // Save salon hours for a specific date
  async saveSalonHours(hoursData) {
    try {
      const { date, ...data } = hoursData;
      const docRef = doc(db, 'salonHours', date);
      
      // Calculate day of week
      const dayOfWeek = new Date(date).getDay();
      
      const salonHoursData = {
        ...data,
        date: date,
        dayOfWeek: dayOfWeek,
        updatedAt: new Date(),
        createdAt: data.createdAt || new Date()
      };
      
      await setDoc(docRef, salonHoursData, { merge: true });
      
      console.log('Salon hours saved successfully:', salonHoursData);
      return salonHoursData;
    } catch (error) {
      console.error('Error saving salon hours:', error);
      throw error;
    }
  },

  // Get salon hours for a date range (for calendar display)
  async getSalonHoursRange(startDate, endDate) {
    try {
      console.log(`🔍 SalonHoursService: Fetching salon hours from ${startDate} to ${endDate}`);
      
      const q = query(
        collection(db, 'salonHours'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const hoursData = [];
      
      querySnapshot.forEach((doc) => {
        hoursData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📊 SalonHoursService: Found ${hoursData.length} salon hours records in range`);
      return hoursData;
    } catch (error) {
      console.error('❌ SalonHoursService: Error getting salon hours range:', error);
      throw error;
    }
  },

  // Get salon status for calendar display (with fallback to defaults)
  async getSalonStatusForCalendar(startDate, endDate) {
    try {
      console.log(`🔍 SalonHoursService: Getting salon status for calendar from ${startDate} to ${endDate}`);
      
      // Get specific salon hours for the date range
      const specificHours = await this.getSalonHoursRange(startDate, endDate);
      
      // Get default schedule for fallback
      const defaultSchedule = await this.getDefaultSchedule();
      
      // Create a map of specific hours for quick lookup
      const specificHoursMap = {};
      specificHours.forEach(hours => {
        specificHoursMap[hours.date] = hours;
      });
      
      // Generate status for each day in the range
      const calendarStatus = {};
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        // Check if we have specific hours for this date
        if (specificHoursMap[dateString]) {
          const specificHours = specificHoursMap[dateString];
          calendarStatus[dateString] = {
            date: dateString,
            dayOfWeek: dayOfWeek,
            dayName: dayName,
            openTime: specificHours.openTime,
            closeTime: specificHours.closeTime,
            isClosed: specificHours.isClosed,
            disableBookings: specificHours.disableBookings,
            isHoliday: specificHours.isHoliday,
            isTuesdayOverride: specificHours.isTuesdayOverride,
            notes: specificHours.notes,
            isSpecific: true // Flag to indicate this is specific data, not default
          };
        } else {
          // Use default schedule with day-specific logic
          const defaultDaySchedule = defaultSchedule.weeklySchedule[dayName];
          const isTuesday = dayOfWeek === 2;
          
          calendarStatus[dateString] = {
            date: dateString,
            dayOfWeek: dayOfWeek,
            dayName: dayName,
            openTime: defaultDaySchedule.openTime,
            closeTime: defaultDaySchedule.closeTime,
            isClosed: defaultDaySchedule.isClosed || isTuesday, // Tuesday is closed by default
            disableBookings: false,
            isHoliday: false,
            isTuesdayOverride: false,
            notes: '',
            isSpecific: false // Flag to indicate this is default data
          };
        }
      }
      
      console.log(`📊 SalonHoursService: Generated calendar status for ${Object.keys(calendarStatus).length} days`);
      return calendarStatus;
    } catch (error) {
      console.error('❌ SalonHoursService: Error getting salon status for calendar:', error);
      throw error;
    }
  },

  // Get default weekly schedule
  async getDefaultSchedule() {
    try {
      const docRef = doc(db, 'salonSettings', 'default');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Return default weekly schedule if no settings exist
      return {
        weeklySchedule: {
          monday: { openTime: '08:30', closeTime: '21:00', isClosed: false },
          tuesday: { openTime: '08:30', closeTime: '21:00', isClosed: true }, // Weekly closure
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
    } catch (error) {
      console.error('Error getting default schedule:', error);
      throw error;
    }
  },

  // Update default weekly schedule
  async updateDefaultSchedule(scheduleData) {
    try {
      const docRef = doc(db, 'salonSettings', 'default');
      await setDoc(docRef, {
        ...scheduleData,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('Default schedule updated successfully');
      return scheduleData;
    } catch (error) {
      console.error('Error updating default schedule:', error);
      throw error;
    }
  },

  // Check if salon is open on a specific date and time
  async isSalonOpen(date, time = null) {
    try {
      const hoursData = await this.getSalonHours(date);
      
      // Check if salon is closed
      if (hoursData.isClosed || hoursData.isHoliday) {
        return { isOpen: false, reason: 'Salon is closed' };
      }
      
      // Check if it's Tuesday (weekly closure)
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 2) { // Tuesday
        return { isOpen: false, reason: 'Tuesday is our weekly closure day' };
      }
      
      // If no specific time provided, just check if salon is open
      if (!time) {
        return { isOpen: true, reason: 'Salon is open' };
      }
      
      // Check if time is within operating hours
      const openTime = hoursData.openTime;
      const closeTime = hoursData.closeTime;
      
      if (time >= openTime && time <= closeTime) {
        return { isOpen: true, reason: 'Salon is open' };
      } else {
        return { isOpen: false, reason: `Salon is closed. Hours: ${openTime} - ${closeTime}` };
      }
    } catch (error) {
      console.error('Error checking salon hours:', error);
      throw error;
    }
  },

  // Get upcoming closures
  async getUpcomingClosures(days = 30) {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const hoursData = await this.getSalonHoursRange(startDate, endDate);
      const closures = [];
      
      hoursData.forEach(hours => {
        if (hours.isClosed || hours.isHoliday) {
          closures.push({
            date: hours.date,
            reason: hours.isHoliday ? 'Holiday' : 'Salon Closed',
            notes: hours.notes
          });
        }
      });
      
      // Add Tuesdays as closures
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        if (currentDate.getDay() === 2) { // Tuesday
          const dateStr = currentDate.toISOString().split('T')[0];
          if (!closures.find(c => c.date === dateStr)) {
            closures.push({
              date: dateStr,
              reason: 'Weekly Closure',
              notes: 'Tuesday is our weekly closure day'
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return closures.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting upcoming closures:', error);
      throw error;
    }
  }
};

// Salon Settings Service
export const salonSettingsService = {
  // Get salon settings
  async getSalonSettings() {
    try {
      const docRef = doc(db, 'salonSettings', 'default');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      // Return default settings if none exist
      return {
        id: 'default',
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
    } catch (error) {
      console.error('Error getting salon settings:', error);
      throw error;
    }
  },

  // Update salon settings
  async updateSalonSettings(settingsData) {
    try {
      const docRef = doc(db, 'salonSettings', 'default');
      await setDoc(docRef, {
        ...settingsData,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('Salon settings updated successfully');
      return settingsData;
    } catch (error) {
      console.error('Error updating salon settings:', error);
      throw error;
    }
  },

  // Initialize default salon settings
  async initializeDefaultSettings() {
    try {
      const docRef = doc(db, 'salonSettings', 'default');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
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
        
        await setDoc(docRef, defaultSettings);
        console.log('Default salon settings initialized');
        return defaultSettings;
      }
      
      return docSnap.data();
    } catch (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  }
};
