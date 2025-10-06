import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { storageService } from './storageService';
import { tokenService } from './tokenService';

// Error messages
const AUTH_ERRORS = {
  // Registration errors
  REGISTRATION_FAILED: 'Registration failed',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password is too weak',
  INVALID_EMAIL: 'Invalid email address',
  NETWORK_ERROR: 'Network error occurred',
  
  // Validation errors
  INVALID_USER_DATA: 'Invalid user data provided',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  
  // Firebase errors
  FIREBASE_ERROR: 'Firebase authentication error',
  FIRESTORE_ERROR: 'Firestore database error',
  TOKEN_ERROR: 'Token management error',
  STORAGE_ERROR: 'Storage operation error',
  
  // General errors
  UNKNOWN_ERROR: 'An unknown error occurred',
  OPERATION_FAILED: 'Operation failed',
};

class AuthService {
  constructor() {
    this.auth = auth;
    this.db = db;
  }

  /**
   * Validate user registration data
   * @param {Object} userData - User registration data
   * @returns {Object} - Validation result
   */
  validateRegistrationData(userData) {
    const errors = {};

    // Required fields validation
    if (!userData.firstName || !userData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!userData.lastName || !userData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!userData.email || !userData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!userData.phone || !userData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (!userData.password || !userData.password.trim()) {
      errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!userData.confirmPassword || !userData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Create user document in Firestore
   * @param {Object} user - Firebase user object
   * @param {Object} additionalData - Additional user data
   * @returns {Promise<Object>} - Created user document
   */
  async createUserDocument(user, additionalData = {}) {
    try {
      if (!user || !user.uid) {
        throw new Error('Invalid user object provided');
      }

      const userRef = doc(this.db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || `${additionalData.firstName} ${additionalData.lastName}`,
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        phone: additionalData.phone || '',
        profileImage: user.photoURL || '',
        role: 'customer', // Default role for new registrations
        isEmailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          notifications: true,
          preferredServices: [],
        },
        // Admin-specific fields (empty for customers)
        adminSettings: {
          canManageServices: false,
          canManageCustomers: false,
          canViewAnalytics: false,
        },
        ...additionalData,
      };

      await setDoc(userRef, userData);
      console.log('AuthService: Successfully created user document in Firestore');
      
      return userData;
    } catch (error) {
      console.error('AuthService: Failed to create user document', error);
      throw new Error(`${AUTH_ERRORS.FIRESTORE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Register new user with email and password
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerUser(userData) {
    try {
      console.log('AuthService: Starting user registration process');

      // Validate input data
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Create Firebase user account
      console.log('AuthService: Creating Firebase user with email:', userData.email);
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;
      console.log('AuthService: Firebase user created successfully');
      console.log('AuthService: User details:', { 
        uid: user.uid, 
        email: user.email, 
        emailVerified: user.emailVerified,
        displayName: user.displayName 
      });

      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Send email verification
      try {
        console.log('AuthService: Sending email verification to:', user.email);
        await sendEmailVerification(user);
        console.log('AuthService: Email verification sent successfully');
      } catch (emailError) {
        console.warn('AuthService: Failed to send email verification', emailError);
        // Don't fail registration if email verification fails
      }

      // Create user document in Firestore
      console.log('AuthService: Creating user document in Firestore...');
      const userDocument = await this.createUserDocument(user, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      });
      console.log('AuthService: User document created successfully:', userDocument.uid);

      // Generate and save tokens
      console.log('AuthService: Generating access token...');
      const accessToken = await user.getIdToken();
      console.log('AuthService: Access token generated successfully');
      
      const tokens = await tokenService.saveTokens({
        accessToken: accessToken,
        refreshToken: accessToken, // Firebase v9+ doesn't expose refreshToken directly
      });
      console.log('AuthService: Tokens saved successfully');

      // Save user data to cache
      console.log('AuthService: Saving user data to cache...');
      await storageService.saveUserData(userDocument);
      await storageService.saveUserCache({
        lastUpdated: Date.now(),
        data: userDocument,
      });
      console.log('AuthService: User data cached successfully');

      console.log('AuthService: User registration completed successfully');
      console.log('AuthService: Registration result:', {
        success: true,
        userUid: userDocument.uid,
        userEmail: userDocument.email,
        emailVerified: userDocument.isEmailVerified,
        hasTokens: !!tokens.accessToken
      });

      return {
        success: true,
        user: userDocument,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
        message: 'Registration successful! Please check your email for verification.',
      };
    } catch (error) {
      console.error('AuthService: User registration failed', error);
      
      // Handle specific Firebase errors
      let errorMessage = AUTH_ERRORS.REGISTRATION_FAILED;
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
            break;
          case 'auth/weak-password':
            errorMessage = AUTH_ERRORS.WEAK_PASSWORD;
            break;
          case 'auth/invalid-email':
            errorMessage = AUTH_ERRORS.INVALID_EMAIL;
            break;
          case 'auth/network-request-failed':
            errorMessage = AUTH_ERRORS.NETWORK_ERROR;
            break;
          default:
            errorMessage = `${AUTH_ERRORS.FIREBASE_ERROR}: ${error.message}`;
        }
      } else if (error.message.includes('Validation failed')) {
        errorMessage = error.message;
      } else {
        errorMessage = `${AUTH_ERRORS.UNKNOWN_ERROR}: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get user document from Firestore
   * @param {string} uid - User ID
   * @returns {Promise<Object|null>} - User document or null
   */
  async getUserDocument(uid) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }

      const userRef = doc(this.db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('AuthService: Successfully retrieved user document');
        return userData;
      } else {
        console.log('AuthService: User document not found');
        return null;
      }
    } catch (error) {
      // Only log the error, don't throw it to prevent duplicate error handling
      console.error('AuthService: Failed to get user document', error);
      
      // Return null instead of throwing to allow graceful degradation
      return null;
    }
  }

  /**
   * Update user document in Firestore
   * @param {string} uid - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user document
   */
  async updateUserDocument(uid, updateData) {
    try {
      if (!uid) {
        throw new Error('User ID is required');
      }

      const userRef = doc(this.db, 'users', uid);
      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updatePayload);
      
      // Get updated document
      const updatedUser = await this.getUserDocument(uid);
      
      // Update cache
      await storageService.saveUserData(updatedUser);
      await storageService.saveUserCache({
        lastUpdated: Date.now(),
        data: updatedUser,
      });

      console.log('AuthService: Successfully updated user document');
      return updatedUser;
    } catch (error) {
      console.error('AuthService: Failed to update user document', error);
      throw new Error(`${AUTH_ERRORS.FIRESTORE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} - Authentication status
   */
  async isUserAuthenticated() {
    try {
      return await tokenService.isAuthenticated();
    } catch (error) {
      console.error('AuthService: Failed to check authentication status', error);
      return false;
    }
  }

  /**
   * Get current user data
   * @returns {Promise<Object|null>} - Current user data or null
   */
  async getCurrentUser() {
    try {
      // First try to get from cache
      const cachedUser = await storageService.loadUserData();
      if (cachedUser) {
        console.log('AuthService: Retrieved user data from cache');
        return cachedUser;
      }

      // If not in cache, get from Firestore
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const userData = await this.getUserDocument(currentUser.uid);
        if (userData) {
          // Update cache
          await storageService.saveUserData(userData);
          await storageService.saveUserCache({
            lastUpdated: Date.now(),
            data: userData,
          });
        }
        return userData;
      }

      return null;
    } catch (error) {
      console.error('AuthService: Failed to get current user', error);
      return null;
    }
  }

  /**
   * Sign out user
   * @returns {Promise<boolean>} - Success status
   */
  async signOutUser() {
    try {
      // Clear tokens
      await tokenService.clearTokens();
      
      // Clear user data
      await storageService.clearUserData();
      await storageService.clearUserCache();
      
      // Sign out from Firebase
      await signOut(this.auth);
      
      console.log('AuthService: User signed out successfully');
      return true;
    } catch (error) {
      console.error('AuthService: Failed to sign out user', error);
      throw new Error(`${AUTH_ERRORS.OPERATION_FAILED}: ${error.message}`);
    }
  }

  /**
   * Delete user account
   * @param {string} password - User password for reauthentication
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUserAccount(password) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore
      const userRef = doc(this.db, 'users', user.uid);
      await deleteDoc(userRef);

      // Clear local data
      await this.signOutUser();

      // Delete Firebase user
      await deleteUser(user);

      console.log('AuthService: User account deleted successfully');
      return true;
    } catch (error) {
      console.error('AuthService: Failed to delete user account', error);
      throw new Error(`${AUTH_ERRORS.OPERATION_FAILED}: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<boolean>} - Success status
   */
  async sendPasswordResetEmail(email) {
    try {
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      await sendPasswordResetEmail(this.auth, email);
      console.log('AuthService: Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('AuthService: Failed to send password reset email', error);
      throw new Error(`${AUTH_ERRORS.OPERATION_FAILED}: ${error.message}`);
    }
  }

  /**
   * Login user with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - Login result with user data and tokens
   */
  async loginUser(credentials) {
    try {
      console.log('AuthService: Starting user login process');
      console.log('AuthService: Login credentials:', { email: credentials.email, passwordLength: credentials.password?.length });
      
      // Validate input data
      this.validateLoginData(credentials);
      
      const { email, password } = credentials;
      
      // Debug: Check if user exists
      const userExists = await this.debugCheckUserExists(email);
      console.log('AuthService: Debug - User exists:', userExists);
      
      // Sign in with Firebase Auth
      console.log('AuthService: Attempting Firebase authentication...');
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      console.log('AuthService: Firebase authentication successful');
      console.log('AuthService: User details:', { 
        uid: user.uid, 
        email: user.email, 
        emailVerified: user.emailVerified,
        displayName: user.displayName 
      });
      
      // Check if email is verified
      if (!user.emailVerified) {
        console.log('AuthService: Email not verified, blocking login');
        await signOut(this.auth); // Sign out the user
        throw new Error('Please verify your email before logging in. Check your inbox for verification instructions.');
      }
      
      // Get user document from Firestore
      const userDocument = await this.getUserDocument(user.uid);
      if (!userDocument) {
        console.error('AuthService: User document not found in Firestore');
        await signOut(this.auth);
        throw new Error('User account not found. Please contact support.');
      }
      
      // Generate and save tokens
      const accessToken = await user.getIdToken();
      const tokens = await tokenService.saveTokens({
        accessToken: accessToken,
        refreshToken: accessToken, // Firebase v9+ doesn't expose refreshToken directly
      });
      
      // Update last login timestamp
      await this.updateUserDocument(user.uid, {
        lastLogin: serverTimestamp(),
      });
      
      // Save user data to cache
      await storageService.saveUserData(userDocument);
      await storageService.saveUserCache({
        lastUpdated: Date.now(),
        data: userDocument,
      });
      
      console.log('AuthService: User login completed successfully');
      console.log('AuthService: Login result:', {
        success: true,
        userUid: userDocument.uid,
        userEmail: userDocument.email,
        emailVerified: userDocument.isEmailVerified,
        hasTokens: !!tokens.accessToken
      });
      
      return {
        success: true,
        user: userDocument,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
        message: 'Login successful!',
      };
    } catch (error) {
      // Handle specific Firebase errors
      let errorMessage = 'Login failed';
      
      if (error.code) {
        
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address. Please check your email or register a new account.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please check your password and try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format. Please enter a valid email.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = `Authentication error: ${error.message}`;
        }
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Debug function to check if user exists in Firebase Auth
   * @param {string} email - User email
   * @returns {Promise<boolean>} - True if user exists
   */
  async debugCheckUserExists(email) {
    try {
      console.log('AuthService: Debug - Checking if user exists:', email);
      
      // Try to get current user
      const currentUser = this.auth.currentUser;
      console.log('AuthService: Debug - Current user:', currentUser ? currentUser.email : 'None');
      
      // Try to sign in with a dummy password to see if user exists
      try {
        await signInWithEmailAndPassword(this.auth, email, 'dummy_password');
      } catch (error) {
        if (error.code === 'auth/wrong-password') {
          console.log('AuthService: Debug - User exists but wrong password');
          return true;
        } else if (error.code === 'auth/user-not-found') {
          console.log('AuthService: Debug - User does not exist');
          return false;
        } else {
          console.log('AuthService: Debug - Other error:', error.code);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('AuthService: Debug - Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Validate login data
   * @param {Object} credentials - Login credentials
   * @throws {Error} - If validation fails
   */
  validateLoginData(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Login credentials are required');
    }
    
    const { email, password } = credentials;
    
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Email is required');
    }
    
    if (!password || typeof password !== 'string' || !password.trim()) {
      throw new Error('Password is required');
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }
    
    // Password length validation
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  /**
   * Setup authentication state listener
   * @param {Function} onAuthStateChange - Callback for auth state changes
   * @returns {Function} - Unsubscribe function
   */
  setupAuthStateListener(onAuthStateChange) {
    try {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        try {
          if (user) {
            // User is signed in
            console.log('AuthService: User signed in, fetching user document...');
            const userData = await this.getUserDocument(user.uid);
            
            if (userData) {
              // Update cache
              await storageService.saveUserData(userData);
              await storageService.saveUserCache({
                lastUpdated: Date.now(),
                data: userData,
              });
              console.log('AuthService: User data cached successfully');
            } else {
              console.log('AuthService: No user document found, using basic user info');
              // Use basic user info from Firebase Auth if no Firestore document
              const basicUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: 'customer' // Default role
              };
              await storageService.saveUserData(basicUserData);
            }
            
            onAuthStateChange({ user: userData || user, isAuthenticated: true });
          } else {
            // User is signed out
            console.log('AuthService: User signed out');
            onAuthStateChange({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('AuthService: Auth state listener error', error);
          // Don't pass error to callback to prevent duplicate error handling
          onAuthStateChange({ user: null, isAuthenticated: false });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('AuthService: Failed to setup auth state listener', error);
      throw new Error(`${AUTH_ERRORS.OPERATION_FAILED}: ${error.message}`);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
