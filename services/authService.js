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
    this._redirectResultChecked = false; // Flag to prevent multiple getRedirectResult calls
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
          let currentUrl = '';
          let currentOrigin = '';
          let currentPath = '';
          
          if (typeof window !== 'undefined') {
            currentUrl = window.location.href;
            currentOrigin = window.location.origin;
            currentPath = window.location.pathname;
            console.log('AuthService: Current URL:', currentUrl);
            console.log('AuthService: Current origin:', currentOrigin);
            console.log('AuthService: Current pathname:', currentPath);
            console.log('AuthService: Auth domain:', this.auth.config.authDomain);
            console.log('AuthService: Expected redirect URI:', `https://${this.auth.config.authDomain}/__/auth/handler`);
            
            // CRITICAL: Firebase redirects to the current page URL
            // We need to ensure Firebase redirects to root (/) not WelcomeScreen
            // This should be handled by WelcomeScreen navigating to root before calling this function
            const isRootPage = currentPath === '/' || currentPath === '';
            
            if (!isRootPage) {
              console.log('AuthService: ⚠️  WARNING: NOT on root page when calling signInWithRedirect()!');
              console.log('AuthService: ⚠️  Firebase will redirect back to:', currentPath);
              console.log('AuthService: ⚠️  This will cause getRedirectResult() to fail on root!');
              console.log('AuthService: ⚠️  WelcomeScreen should navigate to root before calling this function!');
              // Don't navigate here - let WelcomeScreen handle it
            } else {
              // For localhost, Firebase will redirect back to the same origin
              console.log('AuthService: ✅ On root page - Firebase will redirect back to:', currentOrigin + '/');
              console.log('AuthService: Make sure this origin is in Firebase Authorized Domains!');
            }
            
            // Store the current URL so we can check it after redirect
            if (window.sessionStorage) {
              sessionStorage.setItem('googleSignIn_redirectFrom', currentUrl);
              sessionStorage.setItem('googleSignIn_redirectOrigin', currentOrigin);
              console.log('AuthService: Stored redirect from URL:', currentUrl);
              console.log('AuthService: Stored redirect origin:', currentOrigin);
            }
          }
          
          // Reset the redirect check flag when starting a new redirect
          this._redirectResultChecked = false;
          console.log('AuthService: Reset redirect check flag - ready for new redirect');
          
          console.log('AuthService: Calling signInWithRedirect...');
          console.log('AuthService: Provider configured:', {
            providerId: provider.providerId,
            scopes: provider.scopes
          });
          
          // CRITICAL: Log the OAuth configuration that Firebase will use
          console.log('AuthService: ===== OAUTH CONFIGURATION DIAGNOSTICS =====');
          console.log('AuthService: Firebase Auth Domain:', this.auth.config.authDomain);
          console.log('AuthService: Firebase Project ID:', this.auth.config.projectId);
          const expectedHandlerUrl = `https://${this.auth.config.authDomain}/__/auth/handler`;
          console.log('AuthService: Expected Firebase Auth Handler URL:', expectedHandlerUrl);
          console.log('AuthService: Current Origin (where Firebase will redirect back):', currentOrigin || 'N/A (not on web)');
          console.log('AuthService: ===== CRITICAL CONFIGURATION CHECK =====');
          console.log('AuthService: ⚠️  If Google redirects directly to localhost (bypassing Firebase),');
          console.log('AuthService:    it means Google Cloud Console has localhost URLs in redirect URIs!');
          console.log('AuthService:');
          console.log('AuthService: ✅ Google Cloud Console MUST have this redirect URI:');
          console.log('AuthService:    ' + expectedHandlerUrl);
          console.log('AuthService:');
          console.log('AuthService: ❌ Google Cloud Console MUST NOT have these (without /__/auth/handler):');
          console.log('AuthService:    http://localhost:8081/');
          console.log('AuthService:    http://localhost:8081/WelcomeScreen');
          console.log('AuthService:    http://localhost:3000/');
          console.log('AuthService:');
          console.log('AuthService: 📋 To fix:');
          console.log('AuthService:    1. Go to Google Cloud Console → APIs & Services → Credentials');
          console.log('AuthService:    2. Find OAuth 2.0 Client ID (check Firebase Console for the exact ID)');
          console.log('AuthService:    3. Edit → Authorized redirect URIs');
          console.log('AuthService:    4. Keep ONLY: ' + expectedHandlerUrl);
          console.log('AuthService:    5. Remove ALL localhost URLs (except ones with /__/auth/handler)');
          console.log('AuthService:    6. Save and wait 2-3 minutes');
          console.log('AuthService: ===== END DIAGNOSTICS =====');
          
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
      // Prevent multiple calls to getRedirectResult - it can only be called once per redirect
      if (this._redirectResultChecked) {
        console.log('AuthService: Redirect result already checked, skipping...');
        return null;
      }
      
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
        const currentPath = window.location.pathname;
        const searchParams = window.location.search;
        const hash = window.location.hash;
        const isRootPage = currentPath === '/' || currentPath === '';
        
        console.log('AuthService: Current page:', currentPath);
        console.log('AuthService: Is root page:', isRootPage);
        
        if (!isRootPage) {
          console.log('AuthService: ⚠️  NOT on root page - getRedirectResult() may return null');
          console.log('AuthService: ⚠️  Firebase redirects to root, so checking from', currentPath, 'may fail');
          console.log('AuthService: ⚠️  Will check currentUser as fallback if getRedirectResult returns null');
        } else {
          console.log('AuthService: ✅ On root page - this is correct for getRedirectResult()');
        }
        
        // Parse search params to check for OAuth parameters
        const urlParams = new URLSearchParams(searchParams);
        const hasCode = urlParams.has('code');
        const hasState = urlParams.has('state');
        const hasError = urlParams.has('error');
        const errorParam = urlParams.get('error');
        
        // Also check hash for OAuth parameters (Firebase sometimes uses hash)
        const hashParams = hash ? new URLSearchParams(hash.substring(1)) : new URLSearchParams();
        const hasHashCode = hashParams.has('code');
        const hasHashState = hashParams.has('state');
        const hasHashError = hashParams.has('error');
        
        console.log('AuthService: URL parameter analysis:', {
          hasCode,
          hasState,
          hasError,
          error: errorParam,
          hasHashCode,
          hasHashState,
          hasHashError,
          allParams: Object.fromEntries(urlParams.entries()),
          hashParams: hash ? Object.fromEntries(hashParams.entries()) : {}
        });
        
        if (hasError || hasHashError) {
          const error = errorParam || hashParams.get('error');
          console.error('AuthService: OAuth error in URL:', error);
          console.error('AuthService: This indicates the redirect failed with an error');
        }
        
        // Check if we have a stored redirect from URL
        // Note: redirectFrom will be declared later before getRedirectResult call
        const redirectFromLocal = typeof window !== 'undefined' && window.sessionStorage ?
          sessionStorage.getItem('googleSignIn_redirectFrom') : null;
        if (redirectFromLocal) {
          const currentUrl = window.location.href;
          console.log('AuthService: Stored redirect from URL:', redirectFromLocal);
          console.log('AuthService: Current URL matches stored:', currentUrl === redirectFromLocal || currentUrl.startsWith(redirectFromLocal.split('?')[0]));
        }
        
        // Check if URL has any OAuth-related parameters
        const hasOAuthParams = hasCode || hasState || hasHashCode || hasHashState || hash.includes('access_token') || hash.includes('id_token');
        if (hasOAuthParams) {
          console.log('AuthService: URL contains OAuth parameters - redirect may have occurred');
          console.log('AuthService: This suggests a redirect happened, but Firebase may not have processed it yet');
          console.log('AuthService: Will wait a bit longer for Firebase to process the redirect');
        }
        
        // Check if we're on root page - Firebase typically redirects back to root
        // Note: isRootPage is already declared above, reusing it here
        if (isRootPage) {
          console.log('AuthService: On root page - this is where Firebase should redirect back to');
        } else {
          console.log('AuthService: NOT on root page (current path:', currentPath, ')');
          console.log('AuthService: Firebase typically redirects to root (/), but we can still check for redirect result');
          console.log('AuthService: If redirect result is null, Firebase may have redirected to root but we\'re checking from a different page');
          
          // If we have OAuth parameters but we're not on root, this might indicate
          // that Firebase redirected to root but the app navigated away before checking
          if (hasOAuthParams) {
            console.log('AuthService: WARNING - OAuth parameters detected but not on root page!');
            console.log('AuthService: This might mean Firebase redirected to root but app navigated before checking');
            console.log('AuthService: Will still try to get redirect result, but it may fail');
          }
        }
      }
      
      // Get the redirect result
      // Note: getRedirectResult must be called on the same page that the redirect returns to
      // It can only be called ONCE per redirect
      // Firebase typically redirects back to the ROOT page (/), not the page that initiated
      console.log('AuthService: About to call getRedirectResult - this can only be called once per redirect');
      console.log('AuthService: Important - getRedirectResult must be called on the page Firebase redirects to (usually root /)');
      
      // Check if redirect was initiated (need to check this before using it)
      const redirectFrom = typeof window !== 'undefined' && window.sessionStorage ?
        sessionStorage.getItem('googleSignIn_redirectFrom') : null;
      
      // Check if we detected OAuth parameters - if so, wait longer for Firebase to process
      // Firebase needs time to exchange the OAuth code for tokens
      const hasOAuthParams = typeof window !== 'undefined' && (
        window.location.search.includes('code=') ||
        window.location.search.includes('state=') ||
        window.location.hash.includes('code=') ||
        window.location.hash.includes('state=') ||
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('id_token')
      );
      
      if (hasOAuthParams) {
        console.log('AuthService: OAuth parameters detected in URL - waiting 1000ms for Firebase to process...');
        console.log('AuthService: Firebase needs time to exchange OAuth code for tokens');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (redirectFrom) {
        // If redirect was initiated but no OAuth params, still wait a bit
        // Firebase might have already processed and cleaned the URL
        console.log('AuthService: Redirect was initiated - waiting 500ms for Firebase to process...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Mark that we're checking to prevent duplicate calls
      this._redirectResultChecked = true;
      
      console.log('AuthService: Calling getRedirectResult() now...');
      const result = await getRedirectResult(this.auth);
      
      console.log('AuthService: ===== getRedirectResult RESPONSE =====');
      if (result) {
        console.log('AuthService: ✅ RESULT FOUND!');
        console.log('AuthService: Result details:', {
          hasUser: !!result.user,
          userUid: result.user?.uid,
          userEmail: result.user?.email,
          providerId: result.providerId,
          operationType: result.operationType
        });
      } else {
        console.log('AuthService: ❌ NO RESULT - getRedirectResult returned null');
        console.log('AuthService: ===== DIAGNOSTICS =====');
        console.log('AuthService: Current page:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
        console.log('AuthService: Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
        console.log('AuthService: URL has OAuth params:', typeof window !== 'undefined' && (
          window.location.search.includes('code=') || 
          window.location.search.includes('state=') ||
          window.location.hash.includes('code=') ||
          window.location.hash.includes('state=')
        ));
        
        // redirectFrom already declared above before getRedirectResult call
        console.log('AuthService: Redirect was initiated from:', redirectFrom || 'N/A');
        
        console.log('AuthService:');
        console.log('AuthService: Possible reasons for null:');
        console.log('AuthService:   1. ❌ Redirect NOT completed (user cancelled or didn\'t finish)');
        console.log('AuthService:   2. ❌ Redirect result already consumed (checked before)');
        console.log('AuthService:   3. ❌ Stale sessionStorage flag (from previous attempt)');
        console.log('AuthService:   4. ❌ Google didn\'t redirect through Firebase handler');
        console.log('AuthService:');
        console.log('AuthService: 🔍 TO DEBUG:');
        console.log('AuthService:   1. Open Browser Network tab');
        console.log('AuthService:   2. Click "Continue with Google" again');
        console.log('AuthService:   3. Look for request to: salon16.firebaseapp.com/__/auth/handler');
        console.log('AuthService:   4. If you DON\'T see that request, Google is bypassing Firebase!');
        console.log('AuthService:   5. If you DO see it, Firebase processed it but result is null');
        console.log('AuthService: ===== END DIAGNOSTICS =====');
        console.log('AuthService: Will check currentUser as fallback...');
      }
      console.log('AuthService: ===== END getRedirectResult RESPONSE =====');
      
      // If we got a result, clear the flag so we can check again on next redirect
      if (result) {
        this._redirectResultChecked = false;
      }
      
      if (!result) {
        console.log('AuthService: No redirect result found - user did not return from OAuth redirect');
        console.log('AuthService: This could mean:');
        console.log('  1. User did not complete the OAuth flow');
        console.log('  2. Redirect URL does not match Firebase configuration');
        console.log('  3. getRedirectResult was called on wrong page');
        console.log('  4. Firebase Auth state was cleared before redirect completed');
        console.log('  5. Firebase is still processing the redirect (will check currentUser as fallback)');
        
        // Check if there's a current user (might have been authenticated but redirect result not captured)
        // Use onAuthStateChanged to wait for Firebase to update auth state
        // This is more reliable than polling currentUser
        console.log('AuthService: Setting up onAuthStateChanged listener to wait for auth state...');
        
        let currentUser = null;
        let authStateResolved = false;
        
        // Set up a promise that resolves when auth state changes or timeout
        const authStatePromise = new Promise((resolve) => {
          let unsubscribe = null;
          let timeoutId = null;
          
          // Set up listener
          unsubscribe = onAuthStateChanged(this.auth, (user) => {
            console.log('AuthService: onAuthStateChanged fired, user:', user ? 'Found' : 'Not found');
            if (user && !authStateResolved) {
              currentUser = user;
              authStateResolved = true;
              if (unsubscribe) unsubscribe();
              if (timeoutId) clearTimeout(timeoutId);
              console.log('AuthService: ✅ User found via onAuthStateChanged!');
              resolve(user);
            }
          });
          
          // Also check currentUser immediately (might already be set)
          const immediateUser = this.auth.currentUser;
          if (immediateUser && !authStateResolved) {
            currentUser = immediateUser;
            authStateResolved = true;
            if (unsubscribe) unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
            console.log('AuthService: ✅ User found immediately!');
            resolve(immediateUser);
            return;
          }
          
          // Timeout after 3 seconds if no user found
          timeoutId = setTimeout(() => {
            if (!authStateResolved) {
              authStateResolved = true;
              if (unsubscribe) unsubscribe();
              currentUser = this.auth.currentUser;
              console.log('AuthService: Auth state timeout - checking currentUser:', currentUser ? 'Found' : 'Not found');
              resolve(currentUser);
            }
          }, 3000);
        });
        
        // Wait for auth state to update
        await authStatePromise;
        
        console.log('AuthService: Final currentUser check:', currentUser ? 'Found' : 'Not found');
        
        if (currentUser) {
          const providerId = currentUser.providerData[0]?.providerId;
          const isGoogleUser = providerId === 'google.com';
          
          console.log('AuthService: ===== FALLBACK: currentUser FOUND =====');
          console.log('AuthService: However, there IS a current user!', {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            providerId: providerId,
            isGoogleUser: isGoogleUser,
            providerData: currentUser.providerData
          });
          
          if (isGoogleUser) {
            console.log('AuthService: ✅ User authenticated via Google!');
            console.log('AuthService: This suggests redirect worked but getRedirectResult was called too late or on wrong page');
            console.log('AuthService: Will process user via fallback method...');
          } else {
            console.log('AuthService: ⚠️  User exists but not via Google provider');
            console.log('AuthService: Provider:', providerId);
            console.log('AuthService: This might be a different auth method, skipping Google OAuth processing');
            return null;
          }
          console.log('AuthService: ===== END FALLBACK CHECK =====');
          
          // Clear redirect flags since we found a user (redirect likely succeeded)
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('googleSignIn_redirectFrom');
            sessionStorage.removeItem('googleSignIn_redirectOrigin');
            console.log('AuthService: Cleared redirect flags - user found via fallback');
          }
          
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
            // Check if we should create document based on createDocumentIfNotExists option
            // Get it from options or sessionStorage
            let shouldCreateDoc = createDocumentIfNotExists;
            if (shouldCreateDoc === undefined && typeof window !== 'undefined' && window.sessionStorage) {
              const stored = sessionStorage.getItem('googleSignIn_createDocument');
              if (stored !== null) {
                shouldCreateDoc = JSON.parse(stored);
              } else {
                // Default to true for fallback case
                shouldCreateDoc = true;
              }
            } else if (shouldCreateDoc === undefined) {
              // Default to true for fallback case
              shouldCreateDoc = true;
            }
            
            if (shouldCreateDoc) {
              // Create document for authenticated user
              console.log('AuthService: Creating user document for authenticated user (fallback)...');
              userDocument = await this.createUserDocument(user, {
                firstName: firstName,
                lastName: lastName,
                phone: null,
                profileImage: user.photoURL || '',
              });
              console.log('AuthService: User document created');
            } else {
              console.log('AuthService: User document does not exist and createDocumentIfNotExists is false');
              console.log('AuthService: Cannot complete sign-in without user document');
              return null;
            }
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
      
      // Clear redirect flags from sessionStorage since we successfully got the result
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('googleSignIn_redirectFrom');
        sessionStorage.removeItem('googleSignIn_redirectOrigin');
        console.log('AuthService: Cleared redirect flags from sessionStorage');
      }

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
