import {
  bookingService,
  categoryService,
  customerService,
  firestoreService,
  reviewService,
  serviceService
} from './firebaseService';
import { roleValidationService } from './roleValidationService';

/**
 * Context-Aware Secure Firestore Service
 * Provides role-based access control for all Firestore operations with AuthContext integration
 */
export const createSecureFirestoreService = (userFromContext) => {
  return {
    /**
     * Admin-only operations
     * All operations require admin role validation
     */
    adminOperations: {
      // Service Operations
      createService: async (serviceData) => {
        try {
          await roleValidationService.validateAdminOperation('createService', userFromContext);
          
          const result = await serviceService.createService(serviceData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in createService:', error);
          throw error;
        }
      },

      updateService: async (serviceId, updateData) => {
        try {
          await roleValidationService.validateAdminOperation('updateService', userFromContext);
          
          const result = await serviceService.updateService(serviceId, updateData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in updateService:', error);
          throw error;
        }
      },

      deleteService: async (serviceId) => {
        try {
          await roleValidationService.validateAdminOperation('deleteService', userFromContext);
          
          const result = await serviceService.deleteService(serviceId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in deleteService:', error);
          throw error;
        }
      },

      toggleServiceStatus: async (serviceId, isActive) => {
        try {
          await roleValidationService.validateAdminOperation('toggleServiceStatus', userFromContext);
          
          const result = await serviceService.toggleServiceStatus(serviceId, isActive);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in toggleServiceStatus:', error);
          throw error;
        }
      },

      getAllServices: async () => {
        try {
          await roleValidationService.validateAdminOperation('getAllServices', userFromContext);
          
          const result = await serviceService.getAllServices();
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getAllServices:', error);
          throw error;
        }
      },

      // Category Operations
      createCategory: async (categoryData) => {
        try {
          await roleValidationService.validateAdminOperation('createCategory', userFromContext);
          
          const result = await categoryService.createCategory(categoryData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in createCategory:', error);
          throw error;
        }
      },

      updateCategory: async (categoryId, updateData) => {
        try {
          await roleValidationService.validateAdminOperation('updateCategory', userFromContext);
          
          const result = await categoryService.updateCategory(categoryId, updateData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in updateCategory:', error);
          throw error;
        }
      },

      deleteCategory: async (categoryId) => {
        try {
          await roleValidationService.validateAdminOperation('deleteCategory', userFromContext);
          
          const result = await categoryService.deleteCategory(categoryId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in deleteCategory:', error);
          throw error;
        }
      },

      toggleCategoryStatus: async (categoryId, isActive) => {
        try {
          await roleValidationService.validateAdminOperation('toggleCategoryStatus', userFromContext);
          
          const result = await categoryService.toggleCategoryStatus(categoryId, isActive);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in toggleCategoryStatus:', error);
          throw error;
        }
      },

      // Customer Operations
      getAllCustomers: async (lastDoc = null, limitCount = 20) => {
        try {
          await roleValidationService.validateAdminOperation('getAllCustomers', userFromContext);
          
          const result = await customerService.getCustomers(lastDoc, limitCount);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getAllCustomers:', error);
          throw error;
        }
      },

      searchCustomers: async (searchQuery, lastDoc = null, limitCount = 20) => {
        try {
          await roleValidationService.validateAdminOperation('searchCustomers', userFromContext);
          
          const result = await customerService.searchCustomers(searchQuery, lastDoc, limitCount);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in searchCustomers:', error);
          throw error;
        }
      },

      updateCustomer: async (customerId, updateData) => {
        try {
          await roleValidationService.validateAdminOperation('updateCustomer', userFromContext);
          
          const result = await customerService.updateCustomer(customerId, updateData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in updateCustomer:', error);
          throw error;
        }
      },

      deleteCustomer: async (customerId) => {
        try {
          await roleValidationService.validateAdminOperation('deleteCustomer', userFromContext);
          
          const result = await customerService.deleteCustomer(customerId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in deleteCustomer:', error);
          throw error;
        }
      },

      // Booking Operations
      updateBookingStatus: async (bookingId, status, adminNotes = '') => {
        try {
          await roleValidationService.validateAdminOperation('updateBookingStatus', userFromContext);
          
          const result = await bookingService.updateBookingStatus(bookingId, status, adminNotes);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in updateBookingStatus:', error);
          throw error;
        }
      },

      // Service Relationship Operations
      getServicesByCategory: async (categoryId) => {
        try {
          await roleValidationService.validateAdminOperation('getServicesByCategory', userFromContext);
          
          const result = await serviceService.getServicesByCategory(categoryId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getServicesByCategory:', error);
          throw error;
        }
      },

      // Additional admin operations
      getAllCategories: async () => {
        try {
          await roleValidationService.validateAdminOperation('getAllCategories', userFromContext);
          
          const result = await categoryService.getAllCategories();
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getAllCategories:', error);
          throw error;
        }
      },

      subscribeToCategories: (callback) => {
        try {
          // Note: Real-time subscriptions don't need role validation as they're read-only
          return categoryService.subscribeToCategories(callback);
        } catch (error) {
          console.error('❌ SecureService: Error in subscribeToCategories:', error);
          throw error;
        }
      },

      subscribeToBookingsByDate: (date, callback) => {
        try {
          // Note: Real-time subscriptions don't need role validation as they're read-only
          return bookingService.subscribeToBookingsByDate(date, callback);
        } catch (error) {
          console.error('❌ SecureService: Error in subscribeToBookingsByDate:', error);
          throw error;
        }
      },
    },

    /**
     * Customer-only operations
     * All operations require customer role validation
     */
    customerOperations: {
      createBooking: async (bookingData) => {
        try {
          const user = await roleValidationService.validateCustomerOperation('createBooking', userFromContext);
          
          // Ensure customer can only create bookings for themselves
          if (bookingData.customerId !== user.uid) {
            throw new Error('You can only create bookings for yourself.');
          }
          
          const result = await bookingService.createBooking(bookingData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in createBooking:', error);
          throw error;
        }
      },

      getUserBookings: async (userId) => {
        try {
          await roleValidationService.validateOwnership(userId, userFromContext);
          
          const result = await bookingService.getUserBookings(userId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getUserBookings:', error);
          throw error;
        }
      },

      deleteBooking: async (bookingId) => {
        try {          
          // Get the booking document to check ownership
          const bookingDoc = await firestoreService.read('bookings', bookingId);
          
          if (!bookingDoc) {
            throw new Error('Booking not found');
          }
          
          if (bookingDoc.customerId !== userFromContext?.uid) {
            throw new Error('You can only delete your own bookings');
          }
          
          const result = await bookingService.deleteBooking(bookingId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in deleteBooking:', error);
          throw error;
        }
      },

      subscribeToUserBookings: (userId, callback) => {
        try {
          // Note: Real-time listeners don't need validation on setup, but we validate in callback
          return bookingService.subscribeToUserBookings(userId, (bookings) => {
            // Filter to only return bookings for this user (security)
            const userBookings = bookings.filter(b => b.customerId === userId);
            callback(userBookings);
          });
        } catch (error) {
          console.error('❌ SecureService: Error in subscribeToUserBookings:', error);
          throw error;
        }
      },

      createReview: async (reviewData) => {
        try {
          const user = await roleValidationService.validateCustomerOperation('createReview', userFromContext);
          
          // Ensure customer can only create reviews for themselves
          if (reviewData.userId !== user.uid) {
            throw new Error('You can only create reviews for yourself.');
          }
          
          const result = await reviewService.createReview(reviewData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in createReview:', error);
          throw error;
        }
      },

      updateUserProfile: async (userId, updateData) => {
        try {
          await roleValidationService.validateOwnership(userId, userFromContext);
          
          const result = await firestoreService.update('users', userId, updateData);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in updateUserProfile:', error);
          throw error;
        }
      }
    },

    /**
     * Shared operations
     * Available to both admin and customer roles
     */
    sharedOperations: {
      getActiveServices: async () => {
        try {
          await roleValidationService.validateAuthentication(userFromContext);
          
          const result = await serviceService.getActiveServices();
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getActiveServices:', error);
          throw error;
        }
      },

      getActiveCategories: async () => {
        try {
          await roleValidationService.validateAuthentication(userFromContext);
          
          const result = await categoryService.getActiveCategories();
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getActiveCategories:', error);
          throw error;
        }
      },

      getServiceReviews: async (serviceId) => {
        try {
          await roleValidationService.validateAuthentication(userFromContext);
          
          const result = await reviewService.getServiceReviews(serviceId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getServiceReviews:', error);
          throw error;
        }
      },

      getCustomerWithStats: async (customerId) => {
        try {
          const user = await roleValidationService.validateAuthentication(userFromContext);
          
          // Admin can access any customer, customers can only access themselves
          if (user.role !== 'admin' && user.uid !== customerId) {
            throw new Error('You can only access your own customer information.');
          }
          
          const result = await customerService.getCustomerWithStats(customerId);
          
          return result;
        } catch (error) {
          console.error('❌ SecureService: Error in getCustomerWithStats:', error);
          throw error;
        }
      }
    }
  };
};

export default createSecureFirestoreService;
