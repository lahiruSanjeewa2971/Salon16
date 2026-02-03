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
 * Secure Firestore Service
 * Provides role-based access control for all Firestore operations
 */
export const secureFirestoreService = {
  /**
   * Admin-only operations
   * All operations require admin role validation
   */
  adminOperations: {
    // Service Operations
    createService: async (serviceData) => {
      try {
        await roleValidationService.validateAdminOperation('createService');
        
        const result = await serviceService.createService(serviceData);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createService:', error);
        throw error;
      }
    },

    updateService: async (serviceId, updateData) => {
      try {
        await roleValidationService.validateAdminOperation('updateService');
        
        const result = await serviceService.updateService(serviceId, updateData);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateService:', error);
        throw error;
      }
    },

    deleteService: async (serviceId) => {
      try {
        await roleValidationService.validateAdminOperation('deleteService');
        
        const result = await serviceService.deleteService(serviceId);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in deleteService:', error);
        throw error;
      }
    },

    toggleServiceStatus: async (serviceId, isActive) => {
      try {
        await roleValidationService.validateAdminOperation('toggleServiceStatus');
        
        const result = await serviceService.toggleServiceStatus(serviceId, isActive);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in toggleServiceStatus:', error);
        throw error;
      }
    },

    // Category Operations
    createCategory: async (categoryData) => {
      try {
        await roleValidationService.validateAdminOperation('createCategory');
        
        const result = await categoryService.createCategory(categoryData);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createCategory:', error);
        throw error;
      }
    },

    updateCategory: async (categoryId, updateData) => {
      try {
        await roleValidationService.validateAdminOperation('updateCategory');
        
        const result = await categoryService.updateCategory(categoryId, updateData);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateCategory:', error);
        throw error;
      }
    },

    deleteCategory: async (categoryId) => {
      try {
        await roleValidationService.validateAdminOperation('deleteCategory');
        
        const result = await categoryService.deleteCategory(categoryId);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in deleteCategory:', error);
        throw error;
      }
    },

    toggleCategoryStatus: async (categoryId, isActive) => {
      try {
        await roleValidationService.validateAdminOperation('toggleCategoryStatus');
        
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
        await roleValidationService.validateAdminOperation('getAllCustomers');
        
        const result = await customerService.getCustomers(lastDoc, limitCount);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getAllCustomers:', error);
        throw error;
      }
    },

    searchCustomers: async (searchQuery, lastDoc = null, limitCount = 20) => {
      try {
        await roleValidationService.validateAdminOperation('searchCustomers');
        
        const result = await customerService.searchCustomers(searchQuery, lastDoc, limitCount);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in searchCustomers:', error);
        throw error;
      }
    },

    updateCustomer: async (customerId, updateData) => {
      try {
        await roleValidationService.validateAdminOperation('updateCustomer');
        
        const result = await customerService.updateCustomer(customerId, updateData);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateCustomer:', error);
        throw error;
      }
    },

    deleteCustomer: async (customerId) => {
      try {
        await roleValidationService.validateAdminOperation('deleteCustomer');
        
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
        await roleValidationService.validateAdminOperation('updateBookingStatus');
        
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
        await roleValidationService.validateAdminOperation('getServicesByCategory');
        
        const result = await serviceService.getServicesByCategory(categoryId);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getServicesByCategory:', error);
        throw error;
      }
    }
  },

  /**
   * Customer-only operations
   * All operations require customer role validation
   */
  customerOperations: {
    createBooking: async (bookingData) => {
      try {
        const user = await roleValidationService.validateCustomerOperation('createBooking');
        
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
        await roleValidationService.validateOwnership(userId);
        
        const result = await bookingService.getUserBookings(userId);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getUserBookings:', error);
        throw error;
      }
    },

    createReview: async (reviewData) => {
      try {
        const user = await roleValidationService.validateCustomerOperation('createReview');
        
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
        await roleValidationService.validateOwnership(userId);
        
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
        await roleValidationService.validateAuthentication();
        
        const result = await serviceService.getActiveServices();
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getActiveServices:', error);
        throw error;
      }
    },

    getActiveCategories: async () => {
      try {
        await roleValidationService.validateAuthentication();
        
        const result = await categoryService.getActiveCategories();
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getActiveCategories:', error);
        throw error;
      }
    },

    getServiceReviews: async (serviceId) => {
      try {
        await roleValidationService.validateAuthentication();
        
        const result = await reviewService.getServiceReviews(serviceId);
        
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getServiceReviews:', error);
        throw error;
      }
    },

    getCustomerWithStats: async (customerId) => {
      try {
        const user = await roleValidationService.validateAuthentication();
        
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

export default secureFirestoreService;
