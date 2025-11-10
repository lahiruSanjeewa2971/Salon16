import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication functionality
 * @returns {Object} - Auth context value
 */
export const useAuth = () => {
  return useAuthContext();
};

/**
 * Custom hook for authentication actions
 * @returns {Object} - Auth actions
 */
export const useAuthActions = () => {
  const auth = useAuthContext();
  
  return {
    register: auth.register,
    login: auth.login,
    googleSignIn: auth.googleSignIn,
    signOut: auth.signOut,
    updateUser: auth.updateUser,
    clearError: auth.clearError,
    clearLoading: auth.clearLoading,
    refreshToken: auth.refreshToken,
    forceRefreshToken: auth.forceRefreshToken,
    getValidAccessToken: auth.getValidAccessToken,
    getTokenInfo: auth.getTokenInfo,
  };
};

/**
 * Custom hook for authentication state
 * @returns {Object} - Auth state
 */
export const useAuthState = () => {
  const auth = useAuthContext();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isRegistering: auth.isRegistering,
    isLoggingIn: auth.isLoggingIn,
    isRefreshingToken: auth.isRefreshingToken,
    error: auth.error,
    registrationError: auth.registrationError,
    loginError: auth.loginError,
    tokenError: auth.tokenError,
    tokens: auth.tokens,
    userCache: auth.userCache,
  };
};

/**
 * Custom hook for user data
 * @returns {Object} - User data and utilities
 */
export const useUser = () => {
  const auth = useAuthContext();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    getCurrentUser: auth.getCurrentUser,
    updateUser: auth.updateUser,
  };
};

/**
 * Custom hook for token management
 * @returns {Object} - Token management utilities
 */
export const useTokens = () => {
  const auth = useAuthContext();
  
  return {
    tokens: auth.tokens,
    refreshToken: auth.refreshToken,
    forceRefreshToken: auth.forceRefreshToken,
    getValidAccessToken: auth.getValidAccessToken,
    getTokenInfo: auth.getTokenInfo,
    isRefreshingToken: auth.isRefreshingToken,
    tokenError: auth.tokenError,
  };
};

/**
 * Custom hook for error handling
 * @returns {Object} - Error handling utilities
 */
export const useAuthError = () => {
  const auth = useAuthContext();
  
  return {
    error: auth.error,
    registrationError: auth.registrationError,
    loginError: auth.loginError,
    tokenError: auth.tokenError,
    getError: auth.getError,
    clearError: auth.clearError,
  };
};

/**
 * Custom hook for loading states
 * @returns {Object} - Loading state utilities
 */
export const useAuthLoading = () => {
  const auth = useAuthContext();
  
  return {
    isLoading: auth.isLoading,
    isRegistering: auth.isRegistering,
    isLoggingIn: auth.isLoggingIn,
    isGoogleSigningIn: auth.isGoogleSigningIn,
    isRefreshingToken: auth.isRefreshingToken,
    clearLoading: auth.clearLoading,
  };
};

export default useAuth;
