import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { authService } from './authService';

/**
 * Role Validation Service
 * Provides centralized role validation and permission checking
 */
export const roleValidationService = {
  /**
   * Get current user with complete role information
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object|null>} User object with role information or null
   */
  getCurrentUser: async (userFromContext = null) => {
    try {
      // If user data is provided from context, use it
      if (userFromContext && userFromContext.uid) {
        console.log('🔍 RoleValidation: Using user data from context:', {
          uid: userFromContext.uid,
          email: userFromContext.email,
          role: userFromContext.role
        });
        
        // If role is already available, return the user
        if (userFromContext.role) {
          return userFromContext;
        }
        
        // If no role, fetch from Firestore
        try {
          const userDocRef = doc(db, 'users', userFromContext.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            return {
              ...userFromContext,
              role: userData.role || 'customer',
              name: userData.name || userFromContext.name || 'Unknown User',
              phone: userData.phone || '',
              profileImage: userData.profileImage || '',
              createdAt: userData.createdAt,
              lastLogin: userData.lastLogin
            };
          }
        } catch (firestoreError) {
          console.log('⚠️ RoleValidation: Error fetching from Firestore, using default role:', firestoreError.message);
        }
        
        // Return user with default role if Firestore document not found or error
        return {
          ...userFromContext,
          role: 'customer'
        };
      }

      // Fallback to Firebase auth only if no context data
      const firebaseUser = authService.getCurrentUser();
      if (!firebaseUser || !firebaseUser.uid) {
        console.log('🔍 RoleValidation: No authenticated user found');
        return null;
      }

      console.log('🔍 RoleValidation: Firebase user found:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });

      // Get user document from Firestore to get role information
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          console.log('⚠️ RoleValidation: User document not found in Firestore');
          return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'customer', // Default role if document not found
            name: firebaseUser.displayName || 'Unknown User'
          };
        }

        const userData = userDocSnap.data();
        const currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name || firebaseUser.displayName || 'Unknown User',
          role: userData.role || 'customer',
          phone: userData.phone || '',
          profileImage: userData.profileImage || '',
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        };

        console.log('✅ RoleValidation: Current user retrieved:', {
          uid: currentUser.uid,
          email: currentUser.email,
          role: currentUser.role,
          name: currentUser.name
        });

        return currentUser;
      } catch (firestoreError) {
        console.error('❌ RoleValidation: Error fetching user from Firestore:', firestoreError);
        // Return basic user info with default role
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'customer',
          name: firebaseUser.displayName || 'Unknown User'
        };
      }
    } catch (error) {
      console.error('❌ RoleValidation: Error getting current user:', error);
      throw new Error('Failed to get current user information');
    }
  },

  /**
   * Validate that current user is authenticated
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user is not authenticated
   */
  validateAuthentication: async (userFromContext = null) => {
    try {
      const user = await roleValidationService.getCurrentUser(userFromContext);
      if (!user) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      return user;
    } catch (error) {
      console.error('❌ RoleValidation: Authentication validation failed:', error);
      throw error;
    }
  },

  /**
   * Validate that current user has admin role
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user is not admin
   */
  validateAdminRole: async (userFromContext = null) => {
    try {
      const user = await roleValidationService.validateAuthentication(userFromContext);
      
      if (user.role !== 'admin') {
        console.log('🚫 RoleValidation: Admin role required, current role:', user.role);
        throw new Error('Insufficient permissions: Admin role required for this operation.');
      }

      console.log('✅ RoleValidation: Admin role validated for user:', user.email);
      return user;
    } catch (error) {
      console.error('❌ RoleValidation: Admin role validation failed:', error);
      throw error;
    }
  },

  /**
   * Validate that current user has customer role
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user is not customer
   */
  validateCustomerRole: async (userFromContext = null) => {
    try {
      const user = await roleValidationService.validateAuthentication(userFromContext);
      
      if (user.role !== 'customer') {
        console.log('🚫 RoleValidation: Customer role required, current role:', user.role);
        throw new Error('Insufficient permissions: Customer role required for this operation.');
      }

      console.log('✅ RoleValidation: Customer role validated for user:', user.email);
      return user;
    } catch (error) {
      console.error('❌ RoleValidation: Customer role validation failed:', error);
      throw error;
    }
  },

  /**
   * Validate that current user owns the resource or is admin
   * @param {string} resourceUserId - The user ID of the resource owner
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user doesn't own resource and is not admin
   */
  validateOwnership: async (resourceUserId, userFromContext = null) => {
    try {
      const user = await roleValidationService.validateAuthentication(userFromContext);
      
      // Admin can access any resource
      if (user.role === 'admin') {
        console.log('✅ RoleValidation: Admin ownership validated for resource:', resourceUserId);
        return user;
      }

      // Check if user owns the resource
      if (user.uid !== resourceUserId) {
        console.log('🚫 RoleValidation: Ownership validation failed. User:', user.uid, 'Resource:', resourceUserId);
        throw new Error('Insufficient permissions: You can only access your own resources.');
      }

      console.log('✅ RoleValidation: Ownership validated for user:', user.email);
      return user;
    } catch (error) {
      console.error('❌ RoleValidation: Ownership validation failed:', error);
      throw error;
    }
  },

  /**
   * Validate that current user can perform admin operations
   * @param {string} operation - The operation being performed
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user cannot perform admin operations
   */
  validateAdminOperation: async (operation, userFromContext = null) => {
    try {
      const user = await roleValidationService.validateAdminRole(userFromContext);
      
      console.log(`✅ RoleValidation: Admin operation "${operation}" validated for user:`, user.email);
      return user;
    } catch (error) {
      console.error(`❌ RoleValidation: Admin operation "${operation}" validation failed:`, error);
      throw error;
    }
  },

  /**
   * Validate that current user can perform customer operations
   * @param {string} operation - The operation being performed
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<Object>} Current user object
   * @throws {Error} If user cannot perform customer operations
   */
  validateCustomerOperation: async (operation, userFromContext = null) => {
    try {
      const user = await roleValidationService.validateCustomerRole(userFromContext);
      
      console.log(`✅ RoleValidation: Customer operation "${operation}" validated for user:`, user.email);
      return user;
    } catch (error) {
      console.error(`❌ RoleValidation: Customer operation "${operation}" validation failed:`, error);
      throw error;
    }
  },

  /**
   * Check if current user has admin role (non-throwing)
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<boolean>} True if user is admin, false otherwise
   */
  isAdmin: async (userFromContext = null) => {
    try {
      const user = await roleValidationService.getCurrentUser(userFromContext);
      return user && user.role === 'admin';
    } catch (error) {
      console.error('❌ RoleValidation: Error checking admin status:', error);
      return false;
    }
  },

  /**
   * Check if current user has customer role (non-throwing)
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<boolean>} True if user is customer, false otherwise
   */
  isCustomer: async (userFromContext = null) => {
    try {
      const user = await roleValidationService.getCurrentUser(userFromContext);
      return user && user.role === 'customer';
    } catch (error) {
      console.error('❌ RoleValidation: Error checking customer status:', error);
      return false;
    }
  },

  /**
   * Check if current user owns the resource (non-throwing)
   * @param {string} resourceUserId - The user ID of the resource owner
   * @param {Object} userFromContext - Optional user data from AuthContext
   * @returns {Promise<boolean>} True if user owns resource or is admin, false otherwise
   */
  ownsResource: async (resourceUserId, userFromContext = null) => {
    try {
      const user = await roleValidationService.getCurrentUser(userFromContext);
      if (!user) return false;
      
      // Admin owns everything
      if (user.role === 'admin') return true;
      
      // Check ownership
      return user.uid === resourceUserId;
    } catch (error) {
      console.error('❌ RoleValidation: Error checking ownership:', error);
      return false;
    }
  }
};

export default roleValidationService;
