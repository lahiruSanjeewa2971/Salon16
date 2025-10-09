import { roleValidationService } from './roleValidationService';
import { 
  serviceService, 
  categoryService, 
  customerService, 
  bookingService, 
  reviewService,
  firestoreService 
} from './firebaseService';

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
        console.log('🔒 SecureService: Validating admin role for createService');
        await roleValidationService.validateAdminOperation('createService');
        
        console.log('✅ SecureService: Admin role validated, creating service');
        const result = await serviceService.createService(serviceData);
        
        console.log('✅ SecureService: Service created successfully:', result.id);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createService:', error);
        throw error;
      }
    },

    updateService: async (serviceId, updateData) => {
      try {
        console.log('🔒 SecureService: Validating admin role for updateService');
        await roleValidationService.validateAdminOperation('updateService');
        
        console.log('✅ SecureService: Admin role validated, updating service');
        const result = await serviceService.updateService(serviceId, updateData);
        
        console.log('✅ SecureService: Service updated successfully:', serviceId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateService:', error);
        throw error;
      }
    },

    deleteService: async (serviceId) => {
      try {
        console.log('🔒 SecureService: Validating admin role for deleteService');
        await roleValidationService.validateAdminOperation('deleteService');
        
        console.log('✅ SecureService: Admin role validated, deleting service');
        const result = await serviceService.deleteService(serviceId);
        
        console.log('✅ SecureService: Service deleted successfully:', serviceId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in deleteService:', error);
        throw error;
      }
    },

    toggleServiceStatus: async (serviceId, isActive) => {
      try {
        console.log('🔒 SecureService: Validating admin role for toggleServiceStatus');
        await roleValidationService.validateAdminOperation('toggleServiceStatus');
        
        console.log('✅ SecureService: Admin role validated, toggling service status');
        const result = await serviceService.toggleServiceStatus(serviceId, isActive);
        
        console.log('✅ SecureService: Service status toggled successfully:', serviceId, 'to', isActive);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in toggleServiceStatus:', error);
        throw error;
      }
    },

    // Category Operations
    createCategory: async (categoryData) => {
      try {
        console.log('🔒 SecureService: Validating admin role for createCategory');
        await roleValidationService.validateAdminOperation('createCategory');
        
        console.log('✅ SecureService: Admin role validated, creating category');
        const result = await categoryService.createCategory(categoryData);
        
        console.log('✅ SecureService: Category created successfully:', result.id);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createCategory:', error);
        throw error;
      }
    },

    updateCategory: async (categoryId, updateData) => {
      try {
        console.log('🔒 SecureService: Validating admin role for updateCategory');
        await roleValidationService.validateAdminOperation('updateCategory');
        
        console.log('✅ SecureService: Admin role validated, updating category');
        const result = await categoryService.updateCategory(categoryId, updateData);
        
        console.log('✅ SecureService: Category updated successfully:', categoryId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateCategory:', error);
        throw error;
      }
    },

    deleteCategory: async (categoryId) => {
      try {
        console.log('🔒 SecureService: Validating admin role for deleteCategory');
        await roleValidationService.validateAdminOperation('deleteCategory');
        
        console.log('✅ SecureService: Admin role validated, deleting category');
        const result = await categoryService.deleteCategory(categoryId);
        
        console.log('✅ SecureService: Category deleted successfully:', categoryId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in deleteCategory:', error);
        throw error;
      }
    },

    toggleCategoryStatus: async (categoryId, isActive) => {
      try {
        console.log('🔒 SecureService: Validating admin role for toggleCategoryStatus');
        await roleValidationService.validateAdminOperation('toggleCategoryStatus');
        
        console.log('✅ SecureService: Admin role validated, toggling category status');
        const result = await categoryService.toggleCategoryStatus(categoryId, isActive);
        
        console.log('✅ SecureService: Category status toggled successfully:', categoryId, 'to', isActive);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in toggleCategoryStatus:', error);
        throw error;
      }
    },

    // Customer Operations
    getAllCustomers: async (lastDoc = null, limitCount = 20) => {
      try {
        console.log('🔒 SecureService: Validating admin role for getAllCustomers');
        await roleValidationService.validateAdminOperation('getAllCustomers');
        
        console.log('✅ SecureService: Admin role validated, fetching customers');
        const result = await customerService.getCustomers(lastDoc, limitCount);
        
        console.log('✅ SecureService: Customers fetched successfully:', result.customers.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getAllCustomers:', error);
        throw error;
      }
    },

    searchCustomers: async (searchQuery, lastDoc = null, limitCount = 20) => {
      try {
        console.log('🔒 SecureService: Validating admin role for searchCustomers');
        await roleValidationService.validateAdminOperation('searchCustomers');
        
        console.log('✅ SecureService: Admin role validated, searching customers');
        const result = await customerService.searchCustomers(searchQuery, lastDoc, limitCount);
        
        console.log('✅ SecureService: Customer search completed:', result.customers.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in searchCustomers:', error);
        throw error;
      }
    },

    updateCustomer: async (customerId, updateData) => {
      try {
        console.log('🔒 SecureService: Validating admin role for updateCustomer');
        await roleValidationService.validateAdminOperation('updateCustomer');
        
        console.log('✅ SecureService: Admin role validated, updating customer');
        const result = await customerService.updateCustomer(customerId, updateData);
        
        console.log('✅ SecureService: Customer updated successfully:', customerId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateCustomer:', error);
        throw error;
      }
    },

    deleteCustomer: async (customerId) => {
      try {
        console.log('🔒 SecureService: Validating admin role for deleteCustomer');
        await roleValidationService.validateAdminOperation('deleteCustomer');
        
        console.log('✅ SecureService: Admin role validated, deleting customer');
        const result = await customerService.deleteCustomer(customerId);
        
        console.log('✅ SecureService: Customer deleted successfully:', customerId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in deleteCustomer:', error);
        throw error;
      }
    },

    // Booking Operations
    updateBookingStatus: async (bookingId, status, adminNotes = '') => {
      try {
        console.log('🔒 SecureService: Validating admin role for updateBookingStatus');
        await roleValidationService.validateAdminOperation('updateBookingStatus');
        
        console.log('✅ SecureService: Admin role validated, updating booking status');
        const result = await bookingService.updateBookingStatus(bookingId, status, adminNotes);
        
        console.log('✅ SecureService: Booking status updated successfully:', bookingId, 'to', status);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in updateBookingStatus:', error);
        throw error;
      }
    },

    // Service Relationship Operations
    getServicesByCategory: async (categoryId) => {
      try {
        console.log('🔒 SecureService: Validating admin role for getServicesByCategory');
        await roleValidationService.validateAdminOperation('getServicesByCategory');
        
        console.log('✅ SecureService: Admin role validated, fetching services by category');
        const result = await serviceService.getServicesByCategory(categoryId);
        
        console.log('✅ SecureService: Services by category fetched successfully:', result.length);
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
        console.log('🔒 SecureService: Validating customer role for createBooking');
        const user = await roleValidationService.validateCustomerOperation('createBooking');
        
        // Ensure customer can only create bookings for themselves
        if (bookingData.customerId !== user.uid) {
          throw new Error('You can only create bookings for yourself.');
        }
        
        console.log('✅ SecureService: Customer role validated, creating booking');
        const result = await bookingService.createBooking(bookingData);
        
        console.log('✅ SecureService: Booking created successfully:', result.id);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createBooking:', error);
        throw error;
      }
    },

    getUserBookings: async (userId) => {
      try {
        console.log('🔒 SecureService: Validating ownership for getUserBookings');
        await roleValidationService.validateOwnership(userId);
        
        console.log('✅ SecureService: Ownership validated, fetching user bookings');
        const result = await bookingService.getUserBookings(userId);
        
        console.log('✅ SecureService: User bookings fetched successfully:', result.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getUserBookings:', error);
        throw error;
      }
    },

    createReview: async (reviewData) => {
      try {
        console.log('🔒 SecureService: Validating customer role for createReview');
        const user = await roleValidationService.validateCustomerOperation('createReview');
        
        // Ensure customer can only create reviews for themselves
        if (reviewData.userId !== user.uid) {
          throw new Error('You can only create reviews for yourself.');
        }
        
        console.log('✅ SecureService: Customer role validated, creating review');
        const result = await reviewService.createReview(reviewData);
        
        console.log('✅ SecureService: Review created successfully:', result.id);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in createReview:', error);
        throw error;
      }
    },

    updateUserProfile: async (userId, updateData) => {
      try {
        console.log('🔒 SecureService: Validating ownership for updateUserProfile');
        await roleValidationService.validateOwnership(userId);
        
        console.log('✅ SecureService: Ownership validated, updating user profile');
        const result = await firestoreService.update('users', userId, updateData);
        
        console.log('✅ SecureService: User profile updated successfully:', userId);
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
        console.log('🔒 SecureService: Validating authentication for getActiveServices');
        await roleValidationService.validateAuthentication();
        
        console.log('✅ SecureService: Authentication validated, fetching active services');
        const result = await serviceService.getActiveServices();
        
        console.log('✅ SecureService: Active services fetched successfully:', result.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getActiveServices:', error);
        throw error;
      }
    },

    getActiveCategories: async () => {
      try {
        console.log('🔒 SecureService: Validating authentication for getActiveCategories');
        await roleValidationService.validateAuthentication();
        
        console.log('✅ SecureService: Authentication validated, fetching active categories');
        const result = await categoryService.getActiveCategories();
        
        console.log('✅ SecureService: Active categories fetched successfully:', result.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getActiveCategories:', error);
        throw error;
      }
    },

    getServiceReviews: async (serviceId) => {
      try {
        console.log('🔒 SecureService: Validating authentication for getServiceReviews');
        await roleValidationService.validateAuthentication();
        
        console.log('✅ SecureService: Authentication validated, fetching service reviews');
        const result = await reviewService.getServiceReviews(serviceId);
        
        console.log('✅ SecureService: Service reviews fetched successfully:', result.length);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getServiceReviews:', error);
        throw error;
      }
    },

    getCustomerWithStats: async (customerId) => {
      try {
        console.log('🔒 SecureService: Validating authentication for getCustomerWithStats');
        const user = await roleValidationService.validateAuthentication();
        
        // Admin can access any customer, customers can only access themselves
        if (user.role !== 'admin' && user.uid !== customerId) {
          throw new Error('You can only access your own customer information.');
        }
        
        console.log('✅ SecureService: Authentication validated, fetching customer with stats');
        const result = await customerService.getCustomerWithStats(customerId);
        
        console.log('✅ SecureService: Customer with stats fetched successfully:', customerId);
        return result;
      } catch (error) {
        console.error('❌ SecureService: Error in getCustomerWithStats:', error);
        throw error;
      }
    }
  }
};

export default secureFirestoreService;
