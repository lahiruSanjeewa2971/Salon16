import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { tokenService } from '../services/tokenService';
import { authActions, authReducer, initialAuthState } from './authReducer';

// Create AuthContext
const AuthContext = createContext({
  // State
  ...initialAuthState,
  
  // Actions
  register: () => Promise.resolve(),
  clearError: () => {},
  clearLoading: () => {},
  
  // Utilities
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
});

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Setup token auto-refresh
  useEffect(() => {
    if (state.isAuthenticated && state.tokens.refreshToken) {
      const cleanup = tokenService.setupAutoRefresh(
        (newTokens) => {
          console.log('AuthContext: Token refreshed automatically');
          dispatch(authActions.tokenRefreshSuccess(newTokens));
        },
        () => {
          console.log('AuthContext: Token expired, signing out');
          dispatch(authActions.clearUser());
        }
      );

      return cleanup;
    }
  }, [state.isAuthenticated, state.tokens.refreshToken, dispatch]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch(authActions.setLoading(true));
      
      // Check if user is authenticated
      const isAuth = await tokenService.isAuthenticated();
      
      if (isAuth) {
        // Load user data from cache
        const cachedUser = await storageService.loadUserData();
        
        if (cachedUser) {
          // Load tokens
          const tokens = await tokenService.loadTokens();
          
          if (tokens) {
            dispatch(authActions.registerSuccess(cachedUser, tokens));
            console.log('AuthContext: User authenticated from cache');
          } else {
            dispatch(authActions.clearUser());
          }
        } else {
          // Try to get user from Firebase
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            const tokens = await tokenService.loadTokens();
            if (tokens) {
              dispatch(authActions.registerSuccess(currentUser, tokens));
              console.log('AuthContext: User authenticated from Firebase');
            } else {
              dispatch(authActions.clearUser());
            }
          } else {
            dispatch(authActions.clearUser());
          }
        }
      } else {
        dispatch(authActions.clearUser());
        console.log('AuthContext: No authenticated user found');
      }
    } catch (error) {
      dispatch(authActions.setError(error.message));
      dispatch(authActions.clearUser());
    } finally {
      dispatch(authActions.clearLoading());
    }
  }, []);

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  const register = useCallback(async (userData) => {
    try {
      dispatch(authActions.registerStart());
      
      // Validate input data
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided');
      }

      // Call auth service to register user
      const result = await authService.registerUser(userData);
      
      if (result.success) {
        // Dispatch success action
        dispatch(authActions.registerSuccess(result.user, result.tokens));
        
        console.log('AuthContext: User registration successful');
        return {
          success: true,
          user: result.user,
          message: result.message,
        };
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      // Dispatch failure action
      dispatch(authActions.registerFailure(error.message));
      
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  /**
   * Login user with email and password
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Login result
   */
  const login = useCallback(async (credentials) => {
    try {
      dispatch(authActions.loginStart());
      
      // Validate input data
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('Login credentials are required');
      }

      // Call auth service to login user
      const result = await authService.loginUser(credentials);
      
      if (result.success) {
        // Dispatch success action
        dispatch(authActions.loginSuccess(result.user, result.tokens));
        
        console.log('AuthContext: User login successful');
        return {
          success: true,
          user: result.user,
          message: result.message,
        };
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      // Dispatch failure action
      dispatch(authActions.loginFailure(error.message));
      
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    dispatch(authActions.clearError());
  }, []);

  /**
   * Clear loading state
   */
  const clearLoading = useCallback(() => {
    dispatch(authActions.clearLoading());
  }, []);

  /**
   * Update user data
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    dispatch(authActions.updateUser(userData));
  }, []);

  /**
   * Sign out user
   * @returns {Promise<boolean>} - Success status
   */
  const signOut = useCallback(async () => {
    try {
      await authService.signOutUser();
      dispatch(authActions.clearUser());
      console.log('AuthContext: User signed out successfully');
      return true;
    } catch (error) {
      console.error('AuthContext: Sign out failed', error);
      dispatch(authActions.setError(error.message));
      return false;
    }
  }, []);

  /**
   * Refresh access token
   * @returns {Promise<boolean>} - Success status
   */
  const refreshToken = useCallback(async () => {
    try {
      if (!state.tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      dispatch(authActions.tokenRefreshStart());
      
      const newTokens = await tokenService.refreshAccessToken(state.tokens.refreshToken);
      
      dispatch(authActions.tokenRefreshSuccess(newTokens));
      console.log('AuthContext: Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('AuthContext: Token refresh failed', error);
      dispatch(authActions.tokenRefreshFailure(error.message));
      return false;
    }
  }, [state.tokens.refreshToken]);

  /**
   * Force refresh token
   * @returns {Promise<boolean>} - Success status
   */
  const forceRefreshToken = useCallback(async () => {
    try {
      dispatch(authActions.tokenRefreshStart());
      
      const newTokens = await tokenService.forceRefresh();
      
      dispatch(authActions.tokenRefreshSuccess(newTokens));
      console.log('AuthContext: Token force refreshed successfully');
      return true;
    } catch (error) {
      console.error('AuthContext: Force token refresh failed', error);
      dispatch(authActions.tokenRefreshFailure(error.message));
      return false;
    }
  }, []);

  /**
   * Get valid access token
   * @returns {Promise<string|null>} - Valid access token or null
   */
  const getValidAccessToken = useCallback(async () => {
    try {
      return await tokenService.getValidAccessToken();
    } catch (error) {
      console.error('AuthContext: Failed to get valid access token', error);
      return null;
    }
  }, []);

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  const isAuthenticated = useCallback(() => {
    return state.isAuthenticated && state.user !== null;
  }, [state.isAuthenticated, state.user]);

  /**
   * Get current user data
   * @returns {Object|null} - Current user data or null
   */
  const getCurrentUser = useCallback(() => {
    return state.user;
  }, [state.user]);

  /**
   * Get authentication error
   * @returns {string|null} - Error message or null
   */
  const getError = useCallback(() => {
    return state.error || state.registrationError || state.loginError || state.tokenError;
  }, [state.error, state.registrationError, state.loginError, state.tokenError]);

  /**
   * Check if currently loading
   * @returns {boolean} - Loading status
   */
  const isLoading = useCallback(() => {
    return state.isLoading || state.isRegistering || state.isLoggingIn || state.isRefreshingToken;
  }, [state.isLoading, state.isRegistering, state.isLoggingIn, state.isRefreshingToken]);

  /**
   * Get token information
   * @returns {Promise<Object|null>} - Token info or null
   */
  const getTokenInfo = useCallback(async () => {
    try {
      return await tokenService.getTokenInfo();
    } catch (error) {
      console.error('AuthContext: Failed to get token info', error);
      return null;
    }
  }, []);

  /**
   * Debug function to check authentication state
   * @returns {Object} - Debug information
   */
  const debugAuthState = useCallback(() => {
    const debugInfo = {
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      userUid: state.user?.uid,
      userEmail: state.user?.email,
      hasTokens: !!state.tokens.accessToken,
      tokenExpiry: state.tokens.expiresAt,
      isLoading: state.isLoading,
      isRegistering: state.isRegistering,
      isLoggingIn: state.isLoggingIn,
      errors: {
        general: state.error,
        registration: state.registrationError,
        login: state.loginError,
        token: state.tokenError,
      }
    };
    
    console.log('AuthContext: Debug - Current auth state:', debugInfo);
    return debugInfo;
  }, [state]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Computed values
    isAuthenticated: isAuthenticated(),
    isLoading: isLoading(),
    user: getCurrentUser(),
    error: getError(),
    
    // Actions
    register,
    login,
    signOut,
    updateUser,
    clearError,
    clearLoading,
    
    // Token management
    refreshToken,
    forceRefreshToken,
    getValidAccessToken,
    getTokenInfo,
    
    // Utilities
    getCurrentUser,
    getError,
    isLoading,
    debugAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export AuthContext for direct access if needed
export { AuthContext };
export default AuthContext;