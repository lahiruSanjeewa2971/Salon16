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
    console.log('AuthContext: Starting authentication initialization...');
    initializeAuth();
    
    // Set up Firebase auth state listener
    const unsubscribe = authService.setupAuthStateListener((authState) => {
      console.log('AuthContext: Auth state changed:', {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        userRole: authState.user?.role
      });
      
      if (authState.isAuthenticated && authState.user) {
        // Use existing tokens or create basic token structure
        const tokens = state.tokens.accessToken ? state.tokens : {
          accessToken: 'firebase-auth-token',
          refreshToken: 'firebase-refresh-token',
          expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
        };
        
        dispatch(authActions.registerSuccess(authState.user, tokens));
        console.log('AuthContext: User authenticated via Firebase auth state listener');
      } else {
        dispatch(authActions.clearUser());
        console.log('AuthContext: User cleared via Firebase auth state listener');
      }
    });
    
    return () => {
      console.log('AuthContext: Cleaning up auth state listener');
      unsubscribe();
    };
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
   * Initialize authentication state with session validation
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch(authActions.setLoading(true));
      
      // Check if user is authenticated with session validation
      const isAuth = await tokenService.isAuthenticated();
      
      if (isAuth) {
        // Load user data from cache
        const cachedUser = await storageService.loadUserData();
        
        if (cachedUser) {
          // Load tokens and validate session
          const tokens = await tokenService.loadTokens();
          
          if (tokens) {
            // Validate session expiry
            const sessionValid = await validateSession(tokens, cachedUser);
            
            if (sessionValid) {
              dispatch(authActions.registerSuccess(cachedUser, tokens));
              console.log('AuthContext: User authenticated from cache with valid session');
            } else {
              console.log('AuthContext: Session expired, clearing user data');
              await clearAllAuthData();
              dispatch(authActions.clearUser());
            }
          } else {
            dispatch(authActions.clearUser());
          }
        } else {
          // Try to get user from Firebase
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            const tokens = await tokenService.loadTokens();
            if (tokens) {
              // Validate session expiry
              const sessionValid = await validateSession(tokens, currentUser);
              
              if (sessionValid) {
                dispatch(authActions.registerSuccess(currentUser, tokens));
                console.log('AuthContext: User authenticated from Firebase with valid session');
              } else {
                console.log('AuthContext: Session expired, clearing user data');
                await clearAllAuthData();
                dispatch(authActions.clearUser());
              }
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
      console.error('AuthContext: Authentication initialization failed', error);
      dispatch(authActions.setError(error.message));
      dispatch(authActions.clearUser());
    } finally {
      dispatch(authActions.clearLoading());
      console.log('AuthContext: Authentication initialization completed, loading cleared');
    }
  }, []);

  /**
   * Validate session with expiry timestamp
   * @param {Object} tokens - Token data
   * @param {Object} user - User data
   * @returns {Promise<boolean>} - Session validity
   */
  const validateSession = useCallback(async (tokens, user) => {
    try {
      // Check if tokens exist
      if (!tokens || !tokens.accessToken || !tokens.expiresAt) {
        console.log('AuthContext: Invalid token data');
        return false;
      }

      // Check if session has expired
      const now = Date.now();
      const sessionExpiry = tokens.expiresAt;
      
      if (now >= sessionExpiry) {
        console.log('AuthContext: Session expired at', new Date(sessionExpiry).toISOString());
        return false;
      }

      // Check if user data is valid
      if (!user || !user.uid) {
        console.log('AuthContext: Invalid user data');
        return false;
      }

      // Additional validation: Check if user has been inactive for too long
      const maxInactivityTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const lastLogin = user.lastLogin;
      
      if (lastLogin) {
        const lastLoginTime = lastLogin.seconds ? lastLogin.seconds * 1000 : new Date(lastLogin).getTime();
        const timeSinceLogin = now - lastLoginTime;
        
        if (timeSinceLogin > maxInactivityTime) {
          console.log('AuthContext: User inactive for too long, session expired');
          return false;
        }
      }

      console.log('AuthContext: Session is valid');
      return true;
    } catch (error) {
      console.error('AuthContext: Session validation failed', error);
      return false;
    }
  }, []);

  /**
   * Clear all authentication data
   * @returns {Promise<void>}
   */
  const clearAllAuthData = useCallback(async () => {
    try {
      await Promise.all([
        storageService.clearAuthData(),
        tokenService.clearTokens(),
        authService.signOutUser()
      ]);
      console.log('AuthContext: All authentication data cleared');
    } catch (error) {
      console.error('AuthContext: Failed to clear auth data', error);
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
   * Clear all sessions and continue as guest
   * @returns {Promise<boolean>} - Success status
   */
  const continueAsGuest = useCallback(async () => {
    try {
      console.log('AuthContext: User chose to continue as guest, clearing all sessions');
      await clearAllAuthData();
      dispatch(authActions.clearUser());
      console.log('AuthContext: All sessions cleared, user is now a guest');
      return true;
    } catch (error) {
      console.error('AuthContext: Failed to clear sessions for guest mode', error);
      dispatch(authActions.setError(error.message));
      return false;
    }
  }, [clearAllAuthData]);

  /**
   * Force clear all sessions (for testing/debugging)
   * @returns {Promise<boolean>} - Success status
   */
  const forceClearSessions = useCallback(async () => {
    try {
      console.log('AuthContext: Force clearing all sessions');
      await clearAllAuthData();
      dispatch(authActions.clearUser());
      console.log('AuthContext: All sessions force cleared');
      return true;
    } catch (error) {
      console.error('AuthContext: Failed to force clear sessions', error);
      dispatch(authActions.setError(error.message));
      return false;
    }
  }, [clearAllAuthData]);

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
    continueAsGuest,
    forceClearSessions,
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