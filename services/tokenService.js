import { auth } from '../firebase.config';
import { storageService } from './storageService';

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  REFRESH_BUFFER: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Error messages
const TOKEN_ERRORS = {
  INVALID_TOKEN: 'Invalid token provided',
  EXPIRED_TOKEN: 'Token has expired',
  REFRESH_FAILED: 'Failed to refresh token',
  STORAGE_ERROR: 'Storage operation failed',
  NETWORK_ERROR: 'Network error during token refresh',
  UNKNOWN_ERROR: 'Unknown error occurred',
};

class TokenService {
  constructor() {
    this.refreshPromise = null; // Prevent multiple simultaneous refresh attempts
  }

  /**
   * Generate token expiry timestamp
   * @param {number} duration - Duration in milliseconds
   * @returns {number} - Expiry timestamp
   */
  generateExpiryTime(duration = TOKEN_CONFIG.ACCESS_TOKEN_DURATION) {
    return Date.now() + duration;
  }

  /**
   * Check if token is expired
   * @param {number} expiresAt - Token expiry timestamp
   * @returns {boolean} - True if expired
   */
  isTokenExpired(expiresAt) {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  }

  /**
   * Check if token needs refresh (within refresh buffer)
   * @param {number} expiresAt - Token expiry timestamp
   * @returns {boolean} - True if needs refresh
   */
  needsRefresh(expiresAt) {
    if (!expiresAt) return true;
    const refreshThreshold = expiresAt - TOKEN_CONFIG.REFRESH_BUFFER;
    return Date.now() >= refreshThreshold;
  }

  /**
   * Validate token format and expiry
   * @param {string} token - Token to validate
   * @param {number} expiresAt - Token expiry timestamp
   * @returns {Object} - Validation result
   */
  validateToken(token, expiresAt) {
    try {
      if (!token || typeof token !== 'string') {
        return {
          isValid: false,
          error: TOKEN_ERRORS.INVALID_TOKEN,
        };
      }

      if (this.isTokenExpired(expiresAt)) {
        return {
          isValid: false,
          error: TOKEN_ERRORS.EXPIRED_TOKEN,
        };
      }

      return {
        isValid: true,
        error: null,
      };
    } catch (error) {
      console.error('TokenService: Token validation error', error);
      return {
        isValid: false,
        error: TOKEN_ERRORS.UNKNOWN_ERROR,
      };
    }
  }

  /**
   * Save tokens to storage
   * @param {Object} tokens - Token data
   * @param {string} tokens.accessToken - Access token
   * @param {string} tokens.refreshToken - Refresh token
   * @returns {Promise<Object>} - Saved token data with expiry
   */
  async saveTokens(tokens) {
    try {
      if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Invalid token data provided');
      }

      const tokenData = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: this.generateExpiryTime(),
      };

      await storageService.saveTokens(tokenData);
      console.log('TokenService: Successfully saved tokens with 8-hour expiry');
      
      return tokenData;
    } catch (error) {
      console.error('TokenService: Failed to save tokens', error);
      throw new Error(`${TOKEN_ERRORS.STORAGE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Load tokens from storage
   * @returns {Promise<Object|null>} - Token data or null
   */
  async loadTokens() {
    try {
      const tokens = await storageService.loadTokens();
      
      if (!tokens) {
        console.log('TokenService: No tokens found in storage');
        return null;
      }

      // Validate loaded tokens
      const validation = this.validateToken(tokens.accessToken, tokens.expiresAt);
      if (!validation.isValid) {
        console.warn('TokenService: Loaded tokens are invalid or expired', validation.error);
        // Clear invalid tokens
        await this.clearTokens();
        return null;
      }

      console.log('TokenService: Successfully loaded valid tokens');
      return tokens;
    } catch (error) {
      console.error('TokenService: Failed to load tokens', error);
      throw new Error(`${TOKEN_ERRORS.STORAGE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Clear tokens from storage
   * @returns {Promise<boolean>} - Success status
   */
  async clearTokens() {
    try {
      await storageService.clearTokens();
      console.log('TokenService: Successfully cleared tokens');
      return true;
    } catch (error) {
      console.error('TokenService: Failed to clear tokens', error);
      throw new Error(`${TOKEN_ERRORS.STORAGE_ERROR}: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New token data
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      // Prevent multiple simultaneous refresh attempts
      if (this.refreshPromise) {
        console.log('TokenService: Refresh already in progress, waiting...');
        return await this.refreshPromise;
      }

      this.refreshPromise = this._performTokenRefresh(refreshToken);
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      
      return result;
    } catch (error) {
      this.refreshPromise = null;
      console.error('TokenService: Failed to refresh access token', error);
      throw new Error(`${TOKEN_ERRORS.REFRESH_FAILED}: ${error.message}`);
    }
  }

  /**
   * Internal method to perform token refresh
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New token data
   */
  async _performTokenRefresh(refreshToken) {
    try {
      console.log('TokenService: Refreshing access token...');
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get fresh ID token from Firebase
      const accessToken = await user.getIdToken(true); // Force refresh
      
      // Generate new tokens
      const newTokens = {
        accessToken: accessToken,
        refreshToken: accessToken, // In Firebase v9+, we use the same token
        expiresAt: this.generateExpiryTime(),
      };

      // Save new tokens
      await storageService.saveTokens(newTokens);
      
      console.log('TokenService: Successfully refreshed access token');
      return newTokens;
    } catch (error) {
      console.error('TokenService: Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   * @returns {Promise<string|null>} - Valid access token or null
   */
  async getValidAccessToken() {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens) {
        console.log('TokenService: No tokens available');
        return null;
      }

      // Check if token needs refresh
      if (this.needsRefresh(tokens.expiresAt)) {
        console.log('TokenService: Token needs refresh, refreshing...');
        
        try {
          const newTokens = await this.refreshAccessToken(tokens.refreshToken);
          return newTokens.accessToken;
        } catch (refreshError) {
          console.error('TokenService: Token refresh failed', refreshError);
          // Clear invalid tokens
          await this.clearTokens();
          return null;
        }
      }

      // Token is still valid
      return tokens.accessToken;
    } catch (error) {
      console.error('TokenService: Failed to get valid access token', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   * @returns {Promise<boolean>} - Authentication status
   */
  async isAuthenticated() {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens) {
        return false;
      }

      const validation = this.validateToken(tokens.accessToken, tokens.expiresAt);
      return validation.isValid;
    } catch (error) {
      console.error('TokenService: Failed to check authentication status', error);
      return false;
    }
  }

  /**
   * Get token expiry information
   * @returns {Promise<Object|null>} - Token expiry info or null
   */
  async getTokenInfo() {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens) {
        return null;
      }

      const now = Date.now();
      const timeUntilExpiry = tokens.expiresAt - now;
      const timeUntilRefresh = timeUntilExpiry - TOKEN_CONFIG.REFRESH_BUFFER;

      return {
        expiresAt: tokens.expiresAt,
        timeUntilExpiry: Math.max(0, timeUntilExpiry),
        timeUntilRefresh: Math.max(0, timeUntilRefresh),
        isExpired: this.isTokenExpired(tokens.expiresAt),
        needsRefresh: this.needsRefresh(tokens.expiresAt),
        expiresIn: Math.max(0, Math.floor(timeUntilExpiry / 1000 / 60)), // minutes
      };
    } catch (error) {
      console.error('TokenService: Failed to get token info', error);
      return null;
    }
  }

  /**
   * Setup automatic token refresh
   * @param {Function} onTokenRefresh - Callback for token refresh
   * @param {Function} onTokenExpired - Callback for token expiry
   * @returns {Function} - Cleanup function
   */
  setupAutoRefresh(onTokenRefresh, onTokenExpired) {
    let refreshInterval = null;
    let checkInterval = null;

    const checkTokens = async () => {
      try {
        const tokens = await this.loadTokens();
        
        if (!tokens) {
          if (onTokenExpired) onTokenExpired();
          return;
        }

        if (this.isTokenExpired(tokens.expiresAt)) {
          console.log('TokenService: Token expired, clearing...');
          await this.clearTokens();
          if (onTokenExpired) onTokenExpired();
          return;
        }

        if (this.needsRefresh(tokens.expiresAt)) {
          console.log('TokenService: Auto-refreshing token...');
          try {
            const newTokens = await this.refreshAccessToken(tokens.refreshToken);
            if (onTokenRefresh) onTokenRefresh(newTokens);
          } catch (error) {
            console.error('TokenService: Auto-refresh failed', error);
            await this.clearTokens();
            if (onTokenExpired) onTokenExpired();
          }
        }
      } catch (error) {
        console.error('TokenService: Token check failed', error);
      }
    };

    // Check tokens every 5 minutes
    checkInterval = setInterval(checkTokens, 5 * 60 * 1000);

    // Initial check
    checkTokens();

    // Return cleanup function
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (checkInterval) clearInterval(checkInterval);
    };
  }

  /**
   * Force token refresh
   * @returns {Promise<Object|null>} - New token data or null
   */
  async forceRefresh() {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await this.refreshAccessToken(tokens.refreshToken);
      console.log('TokenService: Successfully forced token refresh');
      return newTokens;
    } catch (error) {
      console.error('TokenService: Force refresh failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();
export default tokenService;
