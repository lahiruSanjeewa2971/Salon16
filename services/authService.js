import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'firebase/auth';
import { Platform } from 'react-native';
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
        phone: additionalData.phone || null, // Phone is optional
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
   * Sign in with Google OAuth
   * @param {Object} options - Sign-in options
   * @param {boolean} options.createDocumentIfNotExists - Create Firestore document if user doesn't exist (default: true)
   * @returns {Promise<Object>} - Sign-in result with user data and tokens
   */
  async signInWithGoogle(options = {}) {
    try {
      console.log('AuthService: Starting Google OAuth sign-in');
      const { createDocumentIfNotExists = true } = options;

      // Create Google Auth Provider
      const provider = new GoogleAuthProvider();
      
      // Set custom parameters for better compatibility
      provider.setCustomParameters({
        prompt: 'select_account', // Always show account picker
      });
      
      // Request additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log('AuthService: GoogleAuthProvider created with scopes:', provider.scopes);

      // Sign in with Google
      // Platform-specific implementation
      if (Platform.OS === 'web') {
        // Web platform - use signInWithRedirect for better PWA compatibility
        // Redirects work better than popups in PWAs, especially on mobile devices
        console.log('AuthService: Using web Google sign-in (redirect)');
        console.log('AuthService: Auth instance:', this.auth);
        console.log('AuthService: Provider:', provider);
        
        // Store the createDocumentIfNotExists option in sessionStorage
        // This will be used when handling the redirect result
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('googleSignIn_createDocument', JSON.stringify(createDocumentIfNotExists));
          console.log('AuthService: Stored createDocumentIfNotExists in sessionStorage:', createDocumentIfNotExists);
        } else {
          console.warn('AuthService: sessionStorage not available');
        }
        
        try {
          // Log current URL and auth domain for debugging
          if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            const currentOrigin = window.location.origin;
            console.log('AuthService: Current URL:', currentUrl);
            console.log('AuthService: Current origin:', currentOrigin);
            console.log('AuthService: Auth domain:', this.auth.config.authDomain);
            console.log('AuthService: Expected redirect URI:', `https://${this.auth.config.authDomain}/__/auth/handler`);
            
            // Store the current URL so we can check it after redirect
            if (window.sessionStorage) {
              sessionStorage.setItem('googleSignIn_redirectFrom', currentUrl);
              console.log('AuthService: Stored redirect from URL:', currentUrl);
            }
          }
          
          console.log('AuthService: Calling signInWithRedirect...');
          console.log('AuthService: Provider configured:', {
            providerId: provider.providerId,
            scopes: provider.scopes
          });
          
          // signInWithRedirect will redirect the page immediately if successful
          // The promise resolves/rejects, but the page navigation happens synchronously
          // If redirect fails, an error will be thrown
          await signInWithRedirect(this.auth, provider);
          
          // If we reach here without redirecting, it's unexpected
          // But we'll return pending state anyway as the redirect might be in progress
          console.warn('AuthService: signInWithRedirect completed but redirect may still be in progress');
          
          // Return pending state - the redirect should happen
          return {
            success: false,
            pending: true,
            message: 'Redirecting to Google sign-in...',
          };
        } catch (redirectError) {
          console.error('AuthService: signInWithRedirect error:', redirectError);
          console.error('AuthService: Error code:', redirectError.code);
          console.error('AuthService: Error message:', redirectError.message);
          console.error('AuthService: Full error:', redirectError);
          
          // Check for specific error codes
          if (redirectError.code === 'auth/operation-not-allowed') {
            throw new Error('Google sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
          } else if (redirectError.code === 'auth/unauthorized-domain') {
            throw new Error('This domain is not authorized for Google sign-in. Please add it to Firebase Console > Authentication > Settings > Authorized domains.');
          } else if (redirectError.code === 'auth/configuration-not-found') {
            throw new Error('Google sign-in is not properly configured. Please check Firebase Console settings.');
          }
          
          // Re-throw the error so it can be handled by the outer catch
          throw redirectError;
        }
      } else {
        // Native platforms (Android/iOS) - use credential-based sign-in
        // Note: For native, you'll need to use @react-native-google-signin/google-signin
        // For now, we'll throw an error for native platforms
        throw new Error('Google sign-in for native platforms requires additional setup with @react-native-google-signin/google-signin. Currently only web is supported.');
      }
    } catch (error) {
      console.error('AuthService: Google sign-in failed', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Google sign-in failed';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
          case 'auth/redirect-cancelled-by-user':
            errorMessage = 'Sign-in was cancelled. Please try again.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked by your browser. Please allow popups and try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'An account already exists with this email but using a different sign-in method.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Google sign-in is not enabled. Please contact support.';
            break;
          default:
            errorMessage = `Google sign-in error: ${error.message}`;
        }
      } else {
        errorMessage = error.message || 'An unknown error occurred during Google sign-in.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Handle Google OAuth redirect result
   * This should be called after the page loads to check if user returned from OAuth redirect
   * @param {Object} options - Options for handling redirect
   * @param {boolean} options.createDocumentIfNotExists - Create Firestore document if user doesn't exist (default: true)
   * @returns {Promise<Object|null>} - Sign-in result with user data and tokens, or null if no redirect
   */
  async handleGoogleRedirectResult(options = {}) {
    try {
      console.log('AuthService: Checking for Google OAuth redirect result...');
      console.log('AuthService: Options passed:', options);
      
      // Get createDocumentIfNotExists from options or sessionStorage
      let createDocumentIfNotExists = options.createDocumentIfNotExists;
      
      // If not provided in options, try to get from sessionStorage (set before redirect)
      if (createDocumentIfNotExists === undefined && typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem('googleSignIn_createDocument');
        console.log('AuthService: SessionStorage value:', stored);
        if (stored !== null) {
          createDocumentIfNotExists = JSON.parse(stored);
          console.log('AuthService: Using createDocumentIfNotExists from sessionStorage:', createDocumentIfNotExists);
          // Clear it after reading
          sessionStorage.removeItem('googleSignIn_createDocument');
        } else {
          // Default to true if not specified
          createDocumentIfNotExists = true;
          console.log('AuthService: No sessionStorage value, defaulting createDocumentIfNotExists to:', createDocumentIfNotExists);
        }
      } else if (createDocumentIfNotExists === undefined) {
        // Default to true if not specified
        createDocumentIfNotExists = true;
        console.log('AuthService: createDocumentIfNotExists not provided, defaulting to:', createDocumentIfNotExists);
      } else {
        console.log('AuthService: Using createDocumentIfNotExists from options:', createDocumentIfNotExists);
      }

      // Only check redirect results on web platform
      if (Platform.OS !== 'web') {
        console.log('AuthService: Redirect result check skipped (not web platform)');
        return null;
      }

      console.log('AuthService: Calling getRedirectResult...');
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        const currentOrigin = window.location.origin;
        const searchParams = window.location.search;
        const hash = window.location.hash;
        
        console.log('AuthService: Current URL before getRedirectResult:', currentUrl);
        console.log('AuthService: Current origin:', currentOrigin);
        console.log('AuthService: Current URL search params:', searchParams);
        console.log('AuthService: Current URL hash:', hash);
        
        // Check if we have a stored redirect from URL
        const redirectFrom = sessionStorage.getItem('googleSignIn_redirectFrom');
        if (redirectFrom) {
          console.log('AuthService: Stored redirect from URL:', redirectFrom);
          console.log('AuthService: Current URL matches stored:', currentUrl === redirectFrom || currentUrl.startsWith(redirectFrom.split('?')[0]));
        }
        
        // Check if URL has any OAuth-related parameters
        if (searchParams.includes('code=') || searchParams.includes('state=') || hash.includes('access_token')) {
          console.log('AuthService: URL contains OAuth parameters - redirect may have occurred');
        }
      }
      
      // Get the redirect result
      // Note: getRedirectResult must be called on the same page that the redirect returns to
      // It can only be called ONCE per redirect
      console.log('AuthService: About to call getRedirectResult - this can only be called once per redirect');
      const result = await getRedirectResult(this.auth);
      
      console.log('AuthService: getRedirectResult returned:', result ? 'Result found' : 'No result');
      
      if (!result) {
        console.log('AuthService: No redirect result found - user did not return from OAuth redirect');
        console.log('AuthService: This could mean:');
        console.log('  1. User did not complete the OAuth flow');
        console.log('  2. Redirect URL does not match Firebase configuration');
        console.log('  3. getRedirectResult was called on wrong page');
        console.log('  4. Firebase Auth state was cleared before redirect completed');
        
        // Check if there's a current user (might have been authenticated but redirect result not captured)
        // Wait a bit for Firebase to process the auth state
        console.log('AuthService: Waiting 100ms for Firebase auth state to settle...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentUser = this.auth.currentUser;
        console.log('AuthService: Checking currentUser after wait:', currentUser ? 'Found' : 'Not found');
        
        if (currentUser) {
          console.log('AuthService: However, there IS a current user!', {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            providerId: currentUser.providerData[0]?.providerId,
            providerData: currentUser.providerData
          });
          console.log('AuthService: This suggests redirect worked but getRedirectResult was called too late or on wrong page');
          
          // If user is authenticated but we don't have redirect result, try to process them anyway
          // This handles the case where redirect worked but getRedirectResult timing was off
          const user = currentUser;
          
          // Extract name from displayName or email
          const displayNameParts = user.displayName ? user.displayName.split(' ') : [];
          const firstName = displayNameParts[0] || user.email?.split('@')[0] || '';
          const lastName = displayNameParts.slice(1).join(' ') || '';
          
          // Check if user document exists
          console.log('AuthService: Checking for user document...');
          const existingUserDoc = await this.getUserDocument(user.uid);
          
          let userDocument;
          if (existingUserDoc) {
            userDocument = existingUserDoc;
            console.log('AuthService: Found existing user document');
          } else {
            // Create document for authenticated user
            console.log('AuthService: Creating user document for authenticated user...');
            userDocument = await this.createUserDocument(user, {
              firstName: firstName,
              lastName: lastName,
              phone: null,
              profileImage: user.photoURL || '',
            });
            console.log('AuthService: User document created');
          }
          
          // Generate and save tokens
          const accessToken = await user.getIdToken();
          const tokens = await tokenService.saveTokens({
            accessToken: accessToken,
            refreshToken: accessToken,
          });
          
          // Save user data to cache
          await storageService.saveUserData(userDocument);
          await storageService.saveUserCache({
            lastUpdated: Date.now(),
            data: userDocument,
          });
          
          console.log('AuthService: Processed authenticated user from currentUser (fallback)');
          
          return {
            success: true,
            user: userDocument,
            tokens: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            },
            isNewUser: !existingUserDoc,
            message: existingUserDoc ? 'Signed in successfully!' : 'Account created successfully!',
          };
        }
        
        return null;
      }
      
      console.log('AuthService: Redirect result found!', {
        hasUser: !!result.user,
        userUid: result.user?.uid,
        userEmail: result.user?.email,
        providerId: result.providerId
      });

      const user = result.user;
      
      if (!user) {
        console.error('AuthService: Redirect result has no user!');
        return null;
      }
      
      console.log('AuthService: Google OAuth redirect result found');
      console.log('AuthService: Google authentication successful');
      console.log('AuthService: User details:', { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName,
        photoURL: user.photoURL
      });

      // Extract name from displayName or email
      const displayNameParts = user.displayName ? user.displayName.split(' ') : [];
      const firstName = displayNameParts[0] || user.email?.split('@')[0] || '';
      const lastName = displayNameParts.slice(1).join(' ') || '';

      // Check if user document exists in Firestore
      console.log('AuthService: Checking if user document exists in Firestore...');
      const existingUserDoc = await this.getUserDocument(user.uid);
      console.log('AuthService: Existing user document:', existingUserDoc ? 'Found' : 'Not found');
      
      let userDocument;
      const isNewUser = !existingUserDoc;
      
      if (existingUserDoc) {
        // User exists - update last login
        console.log('AuthService: User document exists, updating last login');
        userDocument = await this.updateUserDocument(user.uid, {
          lastLogin: serverTimestamp(),
          profileImage: user.photoURL || existingUserDoc.profileImage,
          displayName: user.displayName || existingUserDoc.displayName,
        });
        console.log('AuthService: User document updated successfully');
      } else if (createDocumentIfNotExists) {
        // New user - create document
        console.log('AuthService: New Google user, creating Firestore document with createDocumentIfNotExists:', createDocumentIfNotExists);
        userDocument = await this.createUserDocument(user, {
          firstName: firstName,
          lastName: lastName,
          phone: null, // Google users don't provide phone initially
          profileImage: user.photoURL || '',
        });
        console.log('AuthService: User document created successfully');
      } else {
        // User doesn't exist and we shouldn't create document
        console.log('AuthService: User does not exist and createDocumentIfNotExists is false');
        console.log('AuthService: However, for redirect flow, we will create the document to complete the sign-in');
        // For redirect flow, even if createDocumentIfNotExists is false, we should create the document
        // because the user has already authenticated with Google
        console.log('AuthService: Creating user document for redirect flow...');
        userDocument = await this.createUserDocument(user, {
          firstName: firstName,
          lastName: lastName,
          phone: null,
          profileImage: user.photoURL || '',
        });
        console.log('AuthService: User document created for redirect flow');
      }
      
      if (!userDocument) {
        console.error('AuthService: Failed to get or create user document!');
        throw new Error('Failed to retrieve or create user document');
      }
      
      console.log('AuthService: User document ready:', {
        uid: userDocument.uid,
        email: userDocument.email,
        role: userDocument.role
      });

      // Generate and save tokens
      const accessToken = await user.getIdToken();
      const tokens = await tokenService.saveTokens({
        accessToken: accessToken,
        refreshToken: accessToken,
      });

      // Save user data to cache
      await storageService.saveUserData(userDocument);
      await storageService.saveUserCache({
        lastUpdated: Date.now(),
        data: userDocument,
      });

      console.log('AuthService: Google sign-in completed successfully', {
        isNewUser,
        userUid: userDocument.uid,
        userRole: userDocument.role
      });

      return {
        success: true,
        user: userDocument,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
        isNewUser,
        message: isNewUser ? 'Account created successfully!' : 'Signed in successfully!',
      };
    } catch (error) {
      console.error('AuthService: Google redirect result handling failed', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Google sign-in failed';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'An account already exists with this email but using a different sign-in method.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = `Google sign-in error: ${error.message}`;
        }
      } else {
        errorMessage = error.message || 'An unknown error occurred during Google sign-in.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Check if a user exists in Firestore by email
   * @param {string} email - User email
   * @returns {Promise<boolean>} - True if user exists
   */
  async checkUserExistsByEmail(email) {
    try {
      if (!email || !email.trim()) {
        return false;
      }

      // Query Firestore for user with this email
      // Note: This requires an index if email is not the document ID
      // For now, we'll check if Firebase Auth user exists and has a Firestore document
      const currentUser = this.auth.currentUser;
      
      if (currentUser && currentUser.email === email) {
        const userDoc = await this.getUserDocument(currentUser.uid);
        return !!userDoc;
      }

      return false;
    } catch (error) {
      console.error('AuthService: Error checking user existence by email', error);
      return false;
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
