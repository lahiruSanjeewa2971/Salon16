# Rate Limiting Implementation Plan

## Overview

This document outlines a comprehensive rate limiting strategy for the Salon16 React Native application to protect against abuse and DoS attacks. The implementation covers both client-side and server-side rate limiting mechanisms.

## Current Database Call Patterns Analysis

### 1. Database Operations Identified

**Authentication Operations:**
- `createUserWithEmailAndPassword()` - User registration
- `signInWithEmailAndPassword()` - User login
- `signOut()` - User logout
- `updateProfile()` - Profile updates

**Firestore CRUD Operations:**
- `addDoc()` - Document creation
- `getDoc()` - Single document reads
- `getDocs()` - Collection queries
- `updateDoc()` - Document updates
- `deleteDoc()` - Document deletion

**Real-time Operations:**
- `onSnapshot()` - Real-time listeners
- `onAuthStateChanged()` - Auth state monitoring

**Business Logic Operations:**
- Customer management (pagination, search)
- Service management (CRUD operations)
- Category management (CRUD operations)
- Booking management (CRUD operations)
- Review management (CRUD operations)

### 2. Call Frequency Patterns

**High Frequency Operations:**
- Real-time listeners (`onSnapshot`)
- Search operations (customer search with debouncing)
- Pagination requests (infinite scroll)
- Auth state changes

**Medium Frequency Operations:**
- CRUD operations (create, update, delete)
- Data fetching on screen focus

**Low Frequency Operations:**
- User registration/login
- Profile updates
- Admin operations

## Rate Limiting Strategy

### Phase 1: Client-Side Rate Limiting

#### 1.1 Request Throttling Service

**Purpose:** Prevent excessive API calls from the client application.

**Implementation:**
```javascript
// services/rateLimitingService.js
class RateLimitingService {
  constructor() {
    this.requestQueues = new Map();
    this.requestCounts = new Map();
    this.requestTimestamps = new Map();
  }

  // Rate limiting configuration
  static RATE_LIMITS = {
    // Authentication operations
    AUTH_LOGIN: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
    AUTH_REGISTER: { maxRequests: 3, windowMs: 60000 }, // 3 requests per minute
    AUTH_LOGOUT: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    
    // CRUD operations
    CRUD_CREATE: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
    CRUD_READ: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    CRUD_UPDATE: { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
    CRUD_DELETE: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    
    // Search operations
    SEARCH: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
    
    // Real-time operations
    REALTIME_LISTEN: { maxRequests: 5, windowMs: 60000 }, // 5 listeners per minute
    
    // Admin operations
    ADMIN_OPERATIONS: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    
    // Customer operations
    CUSTOMER_OPERATIONS: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
  };

  /**
   * Check if request is allowed based on rate limits
   * @param {string} operationType - Type of operation
   * @param {string} userId - User ID for user-specific limits
   * @returns {boolean} - Whether request is allowed
   */
  isRequestAllowed(operationType, userId = 'anonymous') {
    const limit = RateLimitingService.RATE_LIMITS[operationType];
    if (!limit) return true; // No limit defined, allow request

    const key = `${operationType}_${userId}`;
    const now = Date.now();
    const windowStart = now - limit.windowMs;

    // Get or initialize request timestamps
    if (!this.requestTimestamps.has(key)) {
      this.requestTimestamps.set(key, []);
    }

    const timestamps = this.requestTimestamps.get(key);
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (validTimestamps.length >= limit.maxRequests) {
      console.warn(`Rate limit exceeded for ${operationType}: ${validTimestamps.length}/${limit.maxRequests}`);
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requestTimestamps.set(key, validTimestamps);
    
    return true;
  }

  /**
   * Get remaining requests for an operation
   * @param {string} operationType - Type of operation
   * @param {string} userId - User ID
   * @returns {number} - Remaining requests
   */
  getRemainingRequests(operationType, userId = 'anonymous') {
    const limit = RateLimitingService.RATE_LIMITS[operationType];
    if (!limit) return Infinity;

    const key = `${operationType}_${userId}`;
    const now = Date.now();
    const windowStart = now - limit.windowMs;

    if (!this.requestTimestamps.has(key)) {
      return limit.maxRequests;
    }

    const timestamps = this.requestTimestamps.get(key);
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, limit.maxRequests - validTimestamps.length);
  }

  /**
   * Get time until rate limit resets
   * @param {string} operationType - Type of operation
   * @param {string} userId - User ID
   * @returns {number} - Milliseconds until reset
   */
  getTimeUntilReset(operationType, userId = 'anonymous') {
    const limit = RateLimitingService.RATE_LIMITS[operationType];
    if (!limit) return 0;

    const key = `${operationType}_${userId}`;
    if (!this.requestTimestamps.has(key)) {
      return 0;
    }

    const timestamps = this.requestTimestamps.get(key);
    if (timestamps.length === 0) return 0;

    const oldestTimestamp = Math.min(...timestamps);
    const resetTime = oldestTimestamp + limit.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Clear rate limit data for a user
   * @param {string} userId - User ID
   */
  clearUserLimits(userId) {
    for (const [key] of this.requestTimestamps) {
      if (key.endsWith(`_${userId}`)) {
        this.requestTimestamps.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data
   */
  clearAllLimits() {
    this.requestTimestamps.clear();
    this.requestCounts.clear();
    this.requestQueues.clear();
  }
}

export const rateLimitingService = new RateLimitingService();
```

#### 1.2 Request Queue Management

**Purpose:** Queue requests when rate limits are exceeded instead of rejecting them.

**Implementation:**
```javascript
// services/requestQueueService.js
class RequestQueueService {
  constructor() {
    this.queues = new Map();
    this.processing = new Map();
  }

  /**
   * Add request to queue
   * @param {string} operationType - Type of operation
   * @param {Function} requestFunction - Function to execute
   * @param {string} userId - User ID
   * @returns {Promise} - Promise that resolves when request is processed
   */
  async queueRequest(operationType, requestFunction, userId = 'anonymous') {
    const queueKey = `${operationType}_${userId}`;
    
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
      this.processing.set(queueKey, false);
    }

    return new Promise((resolve, reject) => {
      this.queues.get(queueKey).push({
        requestFunction,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue(queueKey);
    });
  }

  /**
   * Process queued requests
   * @param {string} queueKey - Queue identifier
   */
  async processQueue(queueKey) {
    if (this.processing.get(queueKey)) {
      return; // Already processing
    }

    this.processing.set(queueKey, true);

    while (this.queues.get(queueKey).length > 0) {
      const request = this.queues.get(queueKey).shift();
      
      try {
        const result = await request.requestFunction();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing.set(queueKey, false);
  }

  /**
   * Clear queue for a user
   * @param {string} userId - User ID
   */
  clearUserQueue(userId) {
    for (const [key] of this.queues) {
      if (key.endsWith(`_${userId}`)) {
        this.queues.delete(key);
        this.processing.delete(key);
      }
    }
  }
}

export const requestQueueService = new RequestQueueService();
```

#### 1.3 Secure Service Integration

**Purpose:** Integrate rate limiting into the existing secure service layer.

**Implementation:**
```javascript
// services/createSecureFirestoreService.js (modifications)
import { rateLimitingService } from './rateLimitingService';
import { requestQueueService } from './requestQueueService';

export const createSecureFirestoreService = (userFromContext) => {
  const userId = userFromContext?.uid || 'anonymous';

  // Rate limiting wrapper
  const withRateLimit = (operationType, operationFunction) => {
    return async (...args) => {
      // Check if request is allowed
      if (!rateLimitingService.isRequestAllowed(operationType, userId)) {
        const remainingRequests = rateLimitingService.getRemainingRequests(operationType, userId);
        const timeUntilReset = rateLimitingService.getTimeUntilReset(operationType, userId);
        
        throw new Error(
          `Rate limit exceeded for ${operationType}. ` +
          `Try again in ${Math.ceil(timeUntilReset / 1000)} seconds. ` +
          `Remaining requests: ${remainingRequests}`
        );
      }

      // Execute operation
      try {
        return await operationFunction(...args);
      } catch (error) {
        // Log rate limiting errors
        if (error.message.includes('Rate limit exceeded')) {
          console.warn(`Rate limit exceeded for ${operationType}:`, error.message);
        }
        throw error;
      }
    };
  };

  return {
    adminOperations: {
      // Wrap all admin operations with rate limiting
      createService: withRateLimit('ADMIN_OPERATIONS', async (serviceData) => {
        await roleValidationService.validateAdminOperation('createService', userFromContext);
        return await serviceService.createService(serviceData);
      }),

      getAllCustomers: withRateLimit('ADMIN_OPERATIONS', async (lastDoc = null, limitCount = 20) => {
        await roleValidationService.validateAdminOperation('getAllCustomers', userFromContext);
        return await customerService.getCustomers(lastDoc, limitCount);
      }),

      searchCustomers: withRateLimit('SEARCH', async (searchQuery, lastDoc = null, limitCount = 20) => {
        await roleValidationService.validateAdminOperation('searchCustomers', userFromContext);
        return await customerService.searchCustomers(searchQuery, lastDoc, limitCount);
      }),

      // ... other admin operations
    },

    customerOperations: {
      // Wrap all customer operations with rate limiting
      createBooking: withRateLimit('CUSTOMER_OPERATIONS', async (bookingData) => {
        const user = await roleValidationService.validateCustomerOperation('createBooking', userFromContext);
        if (bookingData.customerId !== user.uid) {
          throw new Error('You can only create bookings for yourself.');
        }
        return await bookingService.createBooking(bookingData);
      }),

      // ... other customer operations
    },

    sharedOperations: {
      // Wrap shared operations with rate limiting
      getActiveServices: withRateLimit('CRUD_READ', async () => {
        await roleValidationService.validateAuthentication(userFromContext);
        return await serviceService.getActiveServices();
      }),

      getActiveCategories: withRateLimit('CRUD_READ', async () => {
        await roleValidationService.validateAuthentication(userFromContext);
        return await categoryService.getActiveCategories();
      }),

      // ... other shared operations
    }
  };
};
```

#### 1.4 Authentication Service Integration

**Purpose:** Add rate limiting to authentication operations.

**Implementation:**
```javascript
// services/authService.js (modifications)
import { rateLimitingService } from './rateLimitingService';

class AuthService {
  // ... existing code ...

  /**
   * Sign in with rate limiting
   */
  async signIn(email, password) {
    const clientId = this.getClientId();
    
    if (!rateLimitingService.isRequestAllowed('AUTH_LOGIN', clientId)) {
      const timeUntilReset = rateLimitingService.getTimeUntilReset('AUTH_LOGIN', clientId);
      throw new Error(
        `Too many login attempts. Please try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Clear rate limits on successful login
      rateLimitingService.clearUserLimits(clientId);
      
      return userCredential.user;
    } catch (error) {
      // Don't clear rate limits on failed login
      throw error;
    }
  }

  /**
   * Register with rate limiting
   */
  async createUser(email, password, userData) {
    const clientId = this.getClientId();
    
    if (!rateLimitingService.isRequestAllowed('AUTH_REGISTER', clientId)) {
      const timeUntilReset = rateLimitingService.getTimeUntilReset('AUTH_REGISTER', clientId);
      throw new Error(
        `Too many registration attempts. Please try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: userData.name
      });
      
      // Create user document in Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        profileImage: userData.profileImage || '',
        role: userData.role || 'customer',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      // Clear rate limits on successful registration
      rateLimitingService.clearUserLimits(clientId);
      
      return user;
    } catch (error) {
      // Don't clear rate limits on failed registration
      throw error;
    }
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientId() {
    // Use device ID or user ID for rate limiting
    return this.auth.currentUser?.uid || 'anonymous';
  }
}
```

### Phase 2: Server-Side Rate Limiting (Firestore Rules)

#### 2.1 Firestore Security Rules Enhancement

**Purpose:** Add server-side rate limiting using Firestore security rules.

**Implementation:**
```javascript
// firestore.rules (enhanced)
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Rate limiting helper functions
    function getRateLimitKey(operation, userId) {
      return 'rate_limit_' + operation + '_' + userId;
    }

    function isRateLimited(operation, userId, maxRequests, windowMs) {
      let rateLimitKey = getRateLimitKey(operation, userId);
      let rateLimitDoc = get(/databases/$(database)/documents/rate_limits/$(rateLimitKey));
      
      if (!rateLimitDoc.exists) {
        return false;
      }
      
      let data = rateLimitDoc.data;
      let now = request.time;
      let windowStart = now - duration.value(windowMs, 'milliseconds');
      
      // Filter requests within the window
      let recentRequests = data.requests.filter(r => r.timestamp > windowStart);
      
      return recentRequests.size() >= maxRequests;
    }

    function updateRateLimit(operation, userId, maxRequests, windowMs) {
      let rateLimitKey = getRateLimitKey(operation, userId);
      let rateLimitDoc = get(/databases/$(database)/documents/rate_limits/$(rateLimitKey));
      
      if (!rateLimitDoc.exists) {
        // Create new rate limit document
        return create(/databases/$(database)/documents/rate_limits/$(rateLimitKey), {
          operation: operation,
          userId: userId,
          requests: [{
            timestamp: request.time,
            requestId: request.requestId
          }],
          createdAt: request.time,
          updatedAt: request.time
        });
      } else {
        // Update existing rate limit document
        let data = rateLimitDoc.data;
        let now = request.time;
        let windowStart = now - duration.value(windowMs, 'milliseconds');
        
        // Filter requests within the window
        let recentRequests = data.requests.filter(r => r.timestamp > windowStart);
        
        // Add new request
        let updatedRequests = recentRequests + [{
          timestamp: request.time,
          requestId: request.requestId
        }];
        
        return update(/databases/$(database)/documents/rate_limits/$(rateLimitKey), {
          requests: updatedRequests,
          updatedAt: request.time
        });
      }
    }

    // Rate limiting configuration
    function getRateLimitConfig(operation) {
      return {
        'auth_login': { maxRequests: 5, windowMs: 60000 },
        'auth_register': { maxRequests: 3, windowMs: 60000 },
        'crud_create': { maxRequests: 20, windowMs: 60000 },
        'crud_read': { maxRequests: 100, windowMs: 60000 },
        'crud_update': { maxRequests: 30, windowMs: 60000 },
        'crud_delete': { maxRequests: 10, windowMs: 60000 },
        'search': { maxRequests: 50, windowMs: 60000 },
        'admin_operations': { maxRequests: 100, windowMs: 60000 },
        'customer_operations': { maxRequests: 50, windowMs: 60000 }
      }[operation];
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isCustomer() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'customer';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Rate limiting collection
    match /rate_limits/{rateLimitId} {
      allow read, write: if false; // Only system can access
    }

    // Users collection with rate limiting
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && 
        request.auth.uid == userId &&
        !isRateLimited('crud_create', request.auth.uid, 20, 60000);
    }
    
    // Services collection with rate limiting
    match /services/{serviceId} {
      allow read: if isAuthenticated() &&
        !isRateLimited('crud_read', request.auth.uid, 100, 60000);
      allow write: if isAdmin() &&
        !isRateLimited('crud_update', request.auth.uid, 30, 60000);
      allow create: if isAdmin() &&
        !isRateLimited('crud_create', request.auth.uid, 20, 60000);
      allow delete: if isAdmin() &&
        !isRateLimited('crud_delete', request.auth.uid, 10, 60000);
    }
    
    // Categories collection with rate limiting
    match /categories/{categoryId} {
      allow read: if isAuthenticated() &&
        !isRateLimited('crud_read', request.auth.uid, 100, 60000);
      allow write: if isAdmin() &&
        !isRateLimited('crud_update', request.auth.uid, 30, 60000);
      allow create: if isAdmin() &&
        !isRateLimited('crud_create', request.auth.uid, 20, 60000);
      allow delete: if isAdmin() &&
        !isRateLimited('crud_delete', request.auth.uid, 10, 60000);
    }
    
    // Bookings collection with rate limiting
    match /bookings/{bookingId} {
      allow read: if isOwner(resource.data.customerId) || isAdmin();
      allow write: if isOwner(resource.data.customerId) || isAdmin();
      allow create: if isCustomer() && 
        request.auth.uid == request.resource.data.customerId &&
        !isRateLimited('customer_operations', request.auth.uid, 50, 60000);
    }
    
    // Reviews collection with rate limiting
    match /reviews/{reviewId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isCustomer() && 
        request.auth.uid == request.resource.data.userId &&
        !isRateLimited('customer_operations', request.auth.uid, 50, 60000);
    }
  }
}
```

### Phase 3: Advanced Rate Limiting Features

#### 3.1 Adaptive Rate Limiting

**Purpose:** Adjust rate limits based on user behavior and system load.

**Implementation:**
```javascript
// services/adaptiveRateLimitingService.js
class AdaptiveRateLimitingService {
  constructor() {
    this.userBehavior = new Map();
    this.systemLoad = {
      cpu: 0,
      memory: 0,
      network: 0
    };
  }

  /**
   * Adjust rate limits based on user behavior
   * @param {string} userId - User ID
   * @param {string} operationType - Operation type
   * @returns {Object} - Adjusted rate limits
   */
  getAdjustedRateLimit(userId, operationType) {
    const baseLimit = RateLimitingService.RATE_LIMITS[operationType];
    const userBehavior = this.userBehavior.get(userId) || {
      totalRequests: 0,
      failedRequests: 0,
      lastActivity: Date.now(),
      trustScore: 1.0
    };

    // Calculate trust score based on behavior
    let trustScore = userBehavior.trustScore;
    
    // Reduce trust score for failed requests
    if (userBehavior.failedRequests > 0) {
      trustScore *= Math.max(0.1, 1 - (userBehavior.failedRequests / userBehavior.totalRequests));
    }

    // Adjust rate limits based on trust score
    const adjustedLimit = {
      maxRequests: Math.floor(baseLimit.maxRequests * trustScore),
      windowMs: baseLimit.windowMs
    };

    return adjustedLimit;
  }

  /**
   * Update user behavior
   * @param {string} userId - User ID
   * @param {boolean} success - Whether request was successful
   */
  updateUserBehavior(userId, success) {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        totalRequests: 0,
        failedRequests: 0,
        lastActivity: Date.now(),
        trustScore: 1.0
      });
    }

    const behavior = this.userBehavior.get(userId);
    behavior.totalRequests++;
    behavior.lastActivity = Date.now();

    if (!success) {
      behavior.failedRequests++;
      behavior.trustScore = Math.max(0.1, behavior.trustScore - 0.1);
    } else {
      behavior.trustScore = Math.min(1.0, behavior.trustScore + 0.05);
    }

    this.userBehavior.set(userId, behavior);
  }
}

export const adaptiveRateLimitingService = new AdaptiveRateLimitingService();
```

#### 3.2 Real-time Monitoring

**Purpose:** Monitor rate limiting in real-time and provide analytics.

**Implementation:**
```javascript
// services/rateLimitMonitoringService.js
class RateLimitMonitoringService {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitHits: new Map(),
      userActivity: new Map()
    };
  }

  /**
   * Record request metrics
   * @param {string} operationType - Operation type
   * @param {string} userId - User ID
   * @param {boolean} blocked - Whether request was blocked
   */
  recordRequest(operationType, userId, blocked = false) {
    this.metrics.totalRequests++;
    
    if (blocked) {
      this.metrics.blockedRequests++;
      
      if (!this.metrics.rateLimitHits.has(operationType)) {
        this.metrics.rateLimitHits.set(operationType, 0);
      }
      this.metrics.rateLimitHits.set(operationType, this.metrics.rateLimitHits.get(operationType) + 1);
    }

    // Update user activity
    if (!this.metrics.userActivity.has(userId)) {
      this.metrics.userActivity.set(userId, {
        totalRequests: 0,
        blockedRequests: 0,
        lastActivity: Date.now()
      });
    }

    const userActivity = this.metrics.userActivity.get(userId);
    userActivity.totalRequests++;
    userActivity.lastActivity = Date.now();
    
    if (blocked) {
      userActivity.blockedRequests++;
    }

    this.metrics.userActivity.set(userId, userActivity);
  }

  /**
   * Get rate limiting statistics
   * @returns {Object} - Statistics
   */
  getStatistics() {
    const blockedPercentage = this.metrics.totalRequests > 0 
      ? (this.metrics.blockedRequests / this.metrics.totalRequests) * 100 
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      blockedRequests: this.metrics.blockedRequests,
      blockedPercentage: blockedPercentage.toFixed(2),
      rateLimitHits: Object.fromEntries(this.metrics.rateLimitHits),
      activeUsers: this.metrics.userActivity.size
    };
  }

  /**
   * Get user-specific statistics
   * @param {string} userId - User ID
   * @returns {Object} - User statistics
   */
  getUserStatistics(userId) {
    const userActivity = this.metrics.userActivity.get(userId);
    if (!userActivity) {
      return null;
    }

    const blockedPercentage = userActivity.totalRequests > 0
      ? (userActivity.blockedRequests / userActivity.totalRequests) * 100
      : 0;

    return {
      totalRequests: userActivity.totalRequests,
      blockedRequests: userActivity.blockedRequests,
      blockedPercentage: blockedPercentage.toFixed(2),
      lastActivity: new Date(userActivity.lastActivity)
    };
  }
}

export const rateLimitMonitoringService = new RateLimitMonitoringService();
```

### Phase 4: Implementation Strategy

#### 4.1 Implementation Phases

**Phase 1: Basic Client-Side Rate Limiting (Week 1)**
- Implement `RateLimitingService`
- Integrate with `createSecureFirestoreService`
- Add rate limiting to authentication operations
- Test with basic operations

**Phase 2: Server-Side Rate Limiting (Week 2)**
- Implement Firestore security rules with rate limiting
- Add rate limit collection structure
- Test server-side enforcement
- Deploy and monitor

**Phase 3: Advanced Features (Week 3)**
- Implement adaptive rate limiting
- Add request queuing
- Implement monitoring and analytics
- Add user behavior tracking

**Phase 4: Optimization and Tuning (Week 4)**
- Analyze rate limiting effectiveness
- Adjust rate limits based on usage patterns
- Optimize performance
- Add advanced monitoring

#### 4.2 Configuration Management

**Rate Limit Configuration:**
```javascript
// config/rateLimitingConfig.js
export const RATE_LIMITING_CONFIG = {
  // Development environment
  development: {
    AUTH_LOGIN: { maxRequests: 10, windowMs: 60000 },
    AUTH_REGISTER: { maxRequests: 5, windowMs: 60000 },
    CRUD_CREATE: { maxRequests: 50, windowMs: 60000 },
    CRUD_READ: { maxRequests: 200, windowMs: 60000 },
    CRUD_UPDATE: { maxRequests: 60, windowMs: 60000 },
    CRUD_DELETE: { maxRequests: 20, windowMs: 60000 },
    SEARCH: { maxRequests: 100, windowMs: 60000 },
    ADMIN_OPERATIONS: { maxRequests: 200, windowMs: 60000 },
    CUSTOMER_OPERATIONS: { maxRequests: 100, windowMs: 60000 }
  },

  // Production environment
  production: {
    AUTH_LOGIN: { maxRequests: 5, windowMs: 60000 },
    AUTH_REGISTER: { maxRequests: 3, windowMs: 60000 },
    CRUD_CREATE: { maxRequests: 20, windowMs: 60000 },
    CRUD_READ: { maxRequests: 100, windowMs: 60000 },
    CRUD_UPDATE: { maxRequests: 30, windowMs: 60000 },
    CRUD_DELETE: { maxRequests: 10, windowMs: 60000 },
    SEARCH: { maxRequests: 50, windowMs: 60000 },
    ADMIN_OPERATIONS: { maxRequests: 100, windowMs: 60000 },
    CUSTOMER_OPERATIONS: { maxRequests: 50, windowMs: 60000 }
  },

  // Staging environment
  staging: {
    AUTH_LOGIN: { maxRequests: 8, windowMs: 60000 },
    AUTH_REGISTER: { maxRequests: 4, windowMs: 60000 },
    CRUD_CREATE: { maxRequests: 35, windowMs: 60000 },
    CRUD_READ: { maxRequests: 150, windowMs: 60000 },
    CRUD_UPDATE: { maxRequests: 45, windowMs: 60000 },
    CRUD_DELETE: { maxRequests: 15, windowMs: 60000 },
    SEARCH: { maxRequests: 75, windowMs: 60000 },
    ADMIN_OPERATIONS: { maxRequests: 150, windowMs: 60000 },
    CUSTOMER_OPERATIONS: { maxRequests: 75, windowMs: 60000 }
  }
};
```

#### 4.3 Error Handling and User Experience

**Rate Limit Error Handling:**
```javascript
// utils/rateLimitErrorHandler.js
export const handleRateLimitError = (error, operationType, userId) => {
  if (error.message.includes('Rate limit exceeded')) {
    const remainingRequests = rateLimitingService.getRemainingRequests(operationType, userId);
    const timeUntilReset = rateLimitingService.getTimeUntilReset(operationType, userId);
    
    return {
      type: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
      remainingRequests,
      timeUntilReset,
      retryAfter: Math.ceil(timeUntilReset / 1000)
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: error.message
  };
};
```

**User-Friendly Rate Limit Messages:**
```javascript
// utils/rateLimitMessages.js
export const getRateLimitMessage = (operationType, timeUntilReset) => {
  const messages = {
    AUTH_LOGIN: `Too many login attempts. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    AUTH_REGISTER: `Too many registration attempts. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    CRUD_CREATE: `Too many create requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    CRUD_READ: `Too many read requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    CRUD_UPDATE: `Too many update requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    CRUD_DELETE: `Too many delete requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    SEARCH: `Too many search requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    ADMIN_OPERATIONS: `Too many admin operations. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`,
    CUSTOMER_OPERATIONS: `Too many customer operations. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`
  };
  
  return messages[operationType] || `Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`;
};
```

### Phase 5: Testing and Validation

#### 5.1 Testing Strategy

**Unit Tests:**
```javascript
// __tests__/services/rateLimitingService.test.js
import { rateLimitingService } from '../../services/rateLimitingService';

describe('RateLimitingService', () => {
  beforeEach(() => {
    rateLimitingService.clearAllLimits();
  });

  test('should allow requests within rate limit', () => {
    const operationType = 'CRUD_READ';
    const userId = 'test-user';
    
    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      expect(rateLimitingService.isRequestAllowed(operationType, userId)).toBe(true);
    }
  });

  test('should block requests exceeding rate limit', () => {
    const operationType = 'CRUD_READ';
    const userId = 'test-user';
    
    // Exceed rate limit
    for (let i = 0; i < 101; i++) {
      rateLimitingService.isRequestAllowed(operationType, userId);
    }
    
    // Next request should be blocked
    expect(rateLimitingService.isRequestAllowed(operationType, userId)).toBe(false);
  });

  test('should reset rate limit after window expires', async () => {
    const operationType = 'CRUD_READ';
    const userId = 'test-user';
    
    // Exceed rate limit
    for (let i = 0; i < 101; i++) {
      rateLimitingService.isRequestAllowed(operationType, userId);
    }
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 61000));
    
    // Request should be allowed again
    expect(rateLimitingService.isRequestAllowed(operationType, userId)).toBe(true);
  });
});
```

**Integration Tests:**
```javascript
// __tests__/integration/rateLimitingIntegration.test.js
import { createSecureFirestoreService } from '../../services/createSecureFirestoreService';

describe('Rate Limiting Integration', () => {
  test('should enforce rate limits in secure service', async () => {
    const mockUser = { uid: 'test-user', role: 'admin' };
    const secureService = createSecureFirestoreService(mockUser);
    
    // Make multiple requests to test rate limiting
    const promises = [];
    for (let i = 0; i < 101; i++) {
      promises.push(secureService.adminOperations.getAllCustomers());
    }
    
    const results = await Promise.allSettled(promises);
    const rejectedResults = results.filter(result => result.status === 'rejected');
    
    // Some requests should be rejected due to rate limiting
    expect(rejectedResults.length).toBeGreaterThan(0);
  });
});
```

#### 5.2 Performance Testing

**Load Testing:**
```javascript
// scripts/loadTest.js
const loadTest = async () => {
  const startTime = Date.now();
  const requests = [];
  
  // Simulate 1000 concurrent requests
  for (let i = 0; i < 1000; i++) {
    requests.push(
      fetch('/api/test-endpoint')
        .then(response => response.json())
        .catch(error => ({ error: error.message }))
    );
  }
  
  const results = await Promise.all(requests);
  const endTime = Date.now();
  
  const successfulRequests = results.filter(result => !result.error).length;
  const failedRequests = results.filter(result => result.error).length;
  const rateLimitedRequests = results.filter(result => 
    result.error && result.error.includes('Rate limit exceeded')
  ).length;
  
  console.log('Load Test Results:');
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successfulRequests}`);
  console.log(`Failed: ${failedRequests}`);
  console.log(`Rate Limited: ${rateLimitedRequests}`);
  console.log(`Duration: ${endTime - startTime}ms`);
  console.log(`Requests per second: ${results.length / ((endTime - startTime) / 1000)}`);
};
```

### Phase 6: Monitoring and Analytics

#### 6.1 Real-time Monitoring Dashboard

**Monitoring Component:**
```javascript
// components/admin/RateLimitMonitoring.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { rateLimitMonitoringService } from '../../services/rateLimitMonitoringService';

export default function RateLimitMonitoring() {
  const [statistics, setStatistics] = useState(null);
  const [userStatistics, setUserStatistics] = useState(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatistics(rateLimitMonitoringService.getStatistics());
      
      // Get statistics for active users
      const activeUsers = Array.from(rateLimitMonitoringService.metrics.userActivity.keys());
      const userStats = new Map();
      
      activeUsers.forEach(userId => {
        const stats = rateLimitMonitoringService.getUserStatistics(userId);
        if (stats) {
          userStats.set(userId, stats);
        }
      });
      
      setUserStatistics(userStats);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!statistics) {
    return <Text>Loading monitoring data...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rate Limiting Statistics</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <Text>Total Requests: {statistics.totalRequests}</Text>
        <Text>Blocked Requests: {statistics.blockedRequests}</Text>
        <Text>Blocked Percentage: {statistics.blockedPercentage}%</Text>
        <Text>Active Users: {statistics.activeUsers}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate Limit Hits by Operation</Text>
        {Object.entries(statistics.rateLimitHits).map(([operation, hits]) => (
          <Text key={operation}>{operation}: {hits} hits</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Statistics</Text>
        {Array.from(userStatistics.entries()).map(([userId, stats]) => (
          <View key={userId} style={styles.userStats}>
            <Text style={styles.userId}>User: {userId}</Text>
            <Text>Total Requests: {stats.totalRequests}</Text>
            <Text>Blocked Requests: {stats.blockedRequests}</Text>
            <Text>Blocked Percentage: {stats.blockedPercentage}%</Text>
            <Text>Last Activity: {stats.lastActivity.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userStats: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  userId: {
    fontWeight: 'bold',
  },
});
```

### Phase 7: Deployment and Maintenance

#### 7.1 Deployment Strategy

**Environment-Specific Configuration:**
```javascript
// config/environment.js
export const getEnvironmentConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return {
        rateLimiting: RATE_LIMITING_CONFIG.production,
        monitoring: {
          enabled: true,
          logLevel: 'warn'
        }
      };
    case 'staging':
      return {
        rateLimiting: RATE_LIMITING_CONFIG.staging,
        monitoring: {
          enabled: true,
          logLevel: 'info'
        }
      };
    default:
      return {
        rateLimiting: RATE_LIMITING_CONFIG.development,
        monitoring: {
          enabled: false,
          logLevel: 'debug'
        }
      };
  }
};
```

#### 7.2 Maintenance and Updates

**Rate Limit Adjustment Strategy:**
1. **Monitor Usage Patterns** - Track actual usage vs. configured limits
2. **Analyze Blocked Requests** - Identify legitimate users being blocked
3. **Adjust Limits Gradually** - Make small adjustments based on data
4. **A/B Testing** - Test different rate limits with user segments
5. **Seasonal Adjustments** - Account for peak usage periods

**Performance Optimization:**
1. **Cache Rate Limit Data** - Use Redis or similar for high-performance storage
2. **Batch Operations** - Group multiple operations to reduce rate limit hits
3. **Async Processing** - Use background jobs for non-critical operations
4. **CDN Integration** - Cache static content to reduce server load

## Conclusion

This comprehensive rate limiting implementation plan provides:

1. **Client-Side Protection** - Prevents excessive requests from the mobile app
2. **Server-Side Enforcement** - Firestore rules ensure server-side protection
3. **Adaptive Behavior** - Adjusts limits based on user behavior and system load
4. **Real-time Monitoring** - Provides visibility into rate limiting effectiveness
5. **User Experience** - Graceful handling of rate limit exceeded scenarios
6. **Performance Optimization** - Efficient implementation with minimal overhead

The implementation follows a phased approach, allowing for gradual rollout and testing at each stage. The system is designed to be configurable, monitorable, and maintainable for long-term success.

## Key Benefits

- **DoS Protection** - Prevents denial-of-service attacks
- **Resource Management** - Ensures fair usage of system resources
- **User Experience** - Maintains app responsiveness during high load
- **Cost Control** - Prevents excessive Firebase usage costs
- **Security** - Protects against automated attacks and abuse
- **Scalability** - Supports growth without performance degradation

This rate limiting strategy will significantly enhance the security and reliability of the Salon16 application while maintaining a positive user experience.
