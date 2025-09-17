import NetInfo from '@react-native-community/netinfo';

/**
 * Network connectivity service
 * Handles online/offline status detection
 */
class NetworkService {
  constructor() {
    this.isConnected = true;
    this.listeners = new Set();
    this.unsubscribe = null;
  }

  /**
   * Initialize network monitoring
   */
  init() {
    try {
      console.log('NetworkService: Initializing network monitoring...');
      
      // Subscribe to network state changes
      this.unsubscribe = NetInfo.addEventListener(state => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected && state.isInternetReachable;
        
        // Notify listeners if connection status changed
        if (wasConnected !== this.isConnected) {
          console.log('NetworkService: Connection status changed:', this.isConnected ? 'Online' : 'Offline');
          this.notifyListeners();
        }
      });

      // Get initial network state
      NetInfo.fetch().then(state => {
        this.isConnected = state.isConnected && state.isInternetReachable;
        console.log('NetworkService: Initial connection status:', this.isConnected ? 'Online' : 'Offline');
        this.notifyListeners();
      }).catch(error => {
        console.error('NetworkService: Failed to fetch initial network state', error);
        // Default to online if fetch fails
        this.isConnected = true;
        this.notifyListeners();
      });

      console.log('NetworkService: Initialized successfully');
    } catch (error) {
      console.error('NetworkService: Failed to initialize', error);
      // Default to online if initialization fails
      this.isConnected = true;
      this.notifyListeners();
    }
  }

  /**
   * Check if device is currently online
   * @returns {boolean} - Online status
   */
  isOnline() {
    return this.isConnected;
  }

  /**
   * Add network status change listener
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isConnected);
      } catch (error) {
        console.error('NetworkService: Error in listener callback', error);
      }
    });
  }

  /**
   * Get detailed network information
   * @returns {Promise<Object>} - Network details
   */
  async getNetworkInfo() {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details
      };
    } catch (error) {
      console.error('NetworkService: Failed to get network info', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
        details: null
      };
    }
  }

  /**
   * Cleanup network monitoring
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    console.log('NetworkService: Cleaned up');
  }
}

// Create singleton instance
export const networkService = new NetworkService();

// Initialize on import
networkService.init();

export default networkService;
