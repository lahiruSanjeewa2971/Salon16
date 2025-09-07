import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'salon16_access_token',
  REFRESH_TOKEN: 'salon16_refresh_token',
  TOKEN_EXPIRY: 'salon16_token_expiry',
  USER_DATA: 'salon16_user_data',
  USER_CACHE: 'salon16_user_cache',
  AUTH_STATE: 'salon16_auth_state',
};

// Error messages
const STORAGE_ERRORS = {
  SAVE_FAILED: 'Failed to save data to storage',
  LOAD_FAILED: 'Failed to load data from storage',
  REMOVE_FAILED: 'Failed to remove data from storage',
  CLEAR_FAILED: 'Failed to clear storage',
  INVALID_DATA: 'Invalid data format',
};

class StorageService {
  /**
   * Save data to AsyncStorage with error handling
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveData(key, data) {
    try {
      if (data === null || data === undefined) {
        console.warn(`StorageService: Attempting to save null/undefined data for key: ${key}`);
        return false;
      }

      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
      console.log(`StorageService: Successfully saved data for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`StorageService: Failed to save data for key: ${key}`, error);
      throw new Error(`${STORAGE_ERRORS.SAVE_FAILED}: ${error.message}`);
    }
  }

  /**
   * Load data from AsyncStorage with error handling
   * @param {string} key - Storage key
   * @returns {Promise<any>} - Loaded data or null
   */
  async loadData(key) {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      
      if (jsonData === null) {
        console.log(`StorageService: No data found for key: ${key}`);
        return null;
      }

      const data = JSON.parse(jsonData);
      console.log(`StorageService: Successfully loaded data for key: ${key}`);
      return data;
    } catch (error) {
      console.error(`StorageService: Failed to load data for key: ${key}`, error);
      throw new Error(`${STORAGE_ERRORS.LOAD_FAILED}: ${error.message}`);
    }
  }

  /**
   * Remove data from AsyncStorage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} - Success status
   */
  async removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`StorageService: Successfully removed data for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`StorageService: Failed to remove data for key: ${key}`, error);
      throw new Error(`${STORAGE_ERRORS.REMOVE_FAILED}: ${error.message}`);
    }
  }

  /**
   * Clear all authentication data
   * @returns {Promise<boolean>} - Success status
   */
  async clearAuthData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('StorageService: Successfully cleared all auth data');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear auth data', error);
      throw new Error(`${STORAGE_ERRORS.CLEAR_FAILED}: ${error.message}`);
    }
  }

  // Token management methods
  /**
   * Save authentication tokens
   * @param {Object} tokens - Token data
   * @param {string} tokens.accessToken - Access token
   * @param {string} tokens.refreshToken - Refresh token
   * @param {number} tokens.expiresAt - Token expiry timestamp
   * @returns {Promise<boolean>} - Success status
   */
  async saveTokens(tokens) {
    try {
      if (!tokens || !tokens.accessToken || !tokens.refreshToken || !tokens.expiresAt) {
        throw new Error('Invalid token data provided');
      }

      // Save individual token components
      await Promise.all([
        this.saveData(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        this.saveData(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        this.saveData(STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt),
      ]);

      console.log('StorageService: Successfully saved authentication tokens');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to save tokens', error);
      throw error;
    }
  }

  /**
   * Load authentication tokens
   * @returns {Promise<Object|null>} - Token data or null
   */
  async loadTokens() {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        this.loadData(STORAGE_KEYS.ACCESS_TOKEN),
        this.loadData(STORAGE_KEYS.REFRESH_TOKEN),
        this.loadData(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      if (!accessToken || !refreshToken || !expiresAt) {
        console.log('StorageService: Incomplete token data found');
        return null;
      }

      const tokens = {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt, 10),
      };

      console.log('StorageService: Successfully loaded authentication tokens');
      return tokens;
    } catch (error) {
      console.error('StorageService: Failed to load tokens', error);
      throw error;
    }
  }

  /**
   * Clear authentication tokens
   * @returns {Promise<boolean>} - Success status
   */
  async clearTokens() {
    try {
      await Promise.all([
        this.removeData(STORAGE_KEYS.ACCESS_TOKEN),
        this.removeData(STORAGE_KEYS.REFRESH_TOKEN),
        this.removeData(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      console.log('StorageService: Successfully cleared authentication tokens');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear tokens', error);
      throw error;
    }
  }

  // User data management methods
  /**
   * Save user data
   * @param {Object} userData - User data object
   * @returns {Promise<boolean>} - Success status
   */
  async saveUserData(userData) {
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided');
      }

      await this.saveData(STORAGE_KEYS.USER_DATA, userData);
      console.log('StorageService: Successfully saved user data');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to save user data', error);
      throw error;
    }
  }

  /**
   * Load user data
   * @returns {Promise<Object|null>} - User data or null
   */
  async loadUserData() {
    try {
      const userData = await this.loadData(STORAGE_KEYS.USER_DATA);
      console.log('StorageService: Successfully loaded user data');
      return userData;
    } catch (error) {
      console.error('StorageService: Failed to load user data', error);
      throw error;
    }
  }

  /**
   * Clear user data
   * @returns {Promise<boolean>} - Success status
   */
  async clearUserData() {
    try {
      await this.removeData(STORAGE_KEYS.USER_DATA);
      console.log('StorageService: Successfully cleared user data');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear user data', error);
      throw error;
    }
  }

  // User cache management methods
  /**
   * Save user cache data
   * @param {Object} cacheData - Cache data object
   * @returns {Promise<boolean>} - Success status
   */
  async saveUserCache(cacheData) {
    try {
      if (!cacheData || typeof cacheData !== 'object') {
        throw new Error('Invalid cache data provided');
      }

      await this.saveData(STORAGE_KEYS.USER_CACHE, cacheData);
      console.log('StorageService: Successfully saved user cache');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to save user cache', error);
      throw error;
    }
  }

  /**
   * Load user cache data
   * @returns {Promise<Object|null>} - Cache data or null
   */
  async loadUserCache() {
    try {
      const cacheData = await this.loadData(STORAGE_KEYS.USER_CACHE);
      console.log('StorageService: Successfully loaded user cache');
      return cacheData;
    } catch (error) {
      console.error('StorageService: Failed to load user cache', error);
      throw error;
    }
  }

  /**
   * Clear user cache data
   * @returns {Promise<boolean>} - Success status
   */
  async clearUserCache() {
    try {
      await this.removeData(STORAGE_KEYS.USER_CACHE);
      console.log('StorageService: Successfully cleared user cache');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear user cache', error);
      throw error;
    }
  }

  // Complete auth state management
  /**
   * Save complete authentication state
   * @param {Object} authState - Complete auth state
   * @returns {Promise<boolean>} - Success status
   */
  async saveAuthState(authState) {
    try {
      if (!authState || typeof authState !== 'object') {
        throw new Error('Invalid auth state provided');
      }

      await this.saveData(STORAGE_KEYS.AUTH_STATE, authState);
      console.log('StorageService: Successfully saved auth state');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to save auth state', error);
      throw error;
    }
  }

  /**
   * Load complete authentication state
   * @returns {Promise<Object|null>} - Auth state or null
   */
  async loadAuthState() {
    try {
      const authState = await this.loadData(STORAGE_KEYS.AUTH_STATE);
      console.log('StorageService: Successfully loaded auth state');
      return authState;
    } catch (error) {
      console.error('StorageService: Failed to load auth state', error);
      throw error;
    }
  }

  /**
   * Clear complete authentication state
   * @returns {Promise<boolean>} - Success status
   */
  async clearAuthState() {
    try {
      await this.removeData(STORAGE_KEYS.AUTH_STATE);
      console.log('StorageService: Successfully cleared auth state');
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear auth state', error);
      throw error;
    }
  }

  // Utility methods
  /**
   * Check if storage is available
   * @returns {Promise<boolean>} - Storage availability
   */
  async isStorageAvailable() {
    try {
      await AsyncStorage.getItem('test');
      return true;
    } catch (error) {
      console.error('StorageService: Storage not available', error);
      return false;
    }
  }

  /**
   * Get storage size (approximate)
   * @returns {Promise<number>} - Storage size in bytes
   */
  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      data.forEach(([key, value]) => {
        if (value) {
          totalSize += key.length + value.length;
        }
      });

      return totalSize;
    } catch (error) {
      console.error('StorageService: Failed to get storage size', error);
      return 0;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
