// Auth Reducer for managing authentication state
export const AUTH_ACTIONS = {
  // Registration actions
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  
  // Login actions
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  
  // Token management actions
  TOKEN_REFRESH_START: 'TOKEN_REFRESH_START',
  TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE',
  
  // User management actions
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_USER: 'CLEAR_USER',
  
  // Error handling
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_ERROR: 'SET_ERROR',
  
  // Loading states
  SET_LOADING: 'SET_LOADING',
  CLEAR_LOADING: 'CLEAR_LOADING',
};

// Initial state
export const initialAuthState = {
  // User data
  user: null,
  isAuthenticated: false,
  
  // Loading states
  isLoading: false,
  isRegistering: false,
  isLoggingIn: false,
  isRefreshingToken: false,
  
  // Error handling
  error: null,
  registrationError: null,
  loginError: null,
  tokenError: null,
  
  // Token management
  tokens: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    refreshBuffer: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  
  // Cache
  userCache: {
    lastUpdated: null,
    data: null,
  },
};

// Auth reducer
export const authReducer = (state, action) => {
  switch (action.type) {
    // Registration actions
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isRegistering: true,
        registrationError: null,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isRegistering: false,
        user: action.payload.user,
        isAuthenticated: true,
        tokens: {
          ...state.tokens,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          expiresAt: action.payload.expiresAt,
        },
        userCache: {
          lastUpdated: Date.now(),
          data: action.payload.user,
        },
        registrationError: null,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        isRegistering: false,
        registrationError: action.payload.error,
        error: action.payload.error,
        user: null,
        isAuthenticated: false,
        tokens: {
          ...state.tokens,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      };

    // Login actions
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoggingIn: true,
        loginError: null,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoggingIn: false,
        user: action.payload.user,
        isAuthenticated: true,
        tokens: {
          ...state.tokens,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          expiresAt: action.payload.expiresAt,
        },
        userCache: {
          lastUpdated: Date.now(),
          data: action.payload.user,
        },
        loginError: null,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoggingIn: false,
        loginError: action.payload.error,
        error: action.payload.error,
        user: null,
        isAuthenticated: false,
        tokens: {
          ...state.tokens,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      };

    // Token management actions
    case AUTH_ACTIONS.TOKEN_REFRESH_START:
      return {
        ...state,
        isRefreshingToken: true,
        tokenError: null,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS:
      return {
        ...state,
        isRefreshingToken: false,
        tokens: {
          ...state.tokens,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          expiresAt: action.payload.expiresAt,
        },
        tokenError: null,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH_FAILURE:
      return {
        ...state,
        isRefreshingToken: false,
        tokenError: action.payload.error,
        error: action.payload.error,
        // Clear auth state on token refresh failure
        user: null,
        isAuthenticated: false,
        tokens: {
          ...state.tokens,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      };

    // User management actions
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user,
        userCache: {
          lastUpdated: Date.now(),
          data: action.payload.user,
        },
      };

    case AUTH_ACTIONS.CLEAR_USER:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        tokens: {
          ...state.tokens,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
        userCache: {
          lastUpdated: null,
          data: null,
        },
        error: null,
        registrationError: null,
        tokenError: null,
      };

    // Error handling
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        registrationError: null,
        tokenError: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };

    // Loading states
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    case AUTH_ACTIONS.CLEAR_LOADING:
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Action creators
export const authActions = {
  // Registration actions
  registerStart: () => ({
    type: AUTH_ACTIONS.REGISTER_START,
  }),

  registerSuccess: (user, tokens) => ({
    type: AUTH_ACTIONS.REGISTER_SUCCESS,
    payload: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
  }),

  registerFailure: (error) => ({
    type: AUTH_ACTIONS.REGISTER_FAILURE,
    payload: { error },
  }),

  // Login actions
  loginStart: () => ({
    type: AUTH_ACTIONS.LOGIN_START,
  }),

  loginSuccess: (user, tokens) => ({
    type: AUTH_ACTIONS.LOGIN_SUCCESS,
    payload: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
  }),

  loginFailure: (error) => ({
    type: AUTH_ACTIONS.LOGIN_FAILURE,
    payload: { error },
  }),

  // Token management actions
  tokenRefreshStart: () => ({
    type: AUTH_ACTIONS.TOKEN_REFRESH_START,
  }),

  tokenRefreshSuccess: (tokens) => ({
    type: AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS,
    payload: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
  }),

  tokenRefreshFailure: (error) => ({
    type: AUTH_ACTIONS.TOKEN_REFRESH_FAILURE,
    payload: { error },
  }),

  // User management actions
  updateUser: (user) => ({
    type: AUTH_ACTIONS.UPDATE_USER,
    payload: { user },
  }),

  clearUser: () => ({
    type: AUTH_ACTIONS.CLEAR_USER,
  }),

  // Error handling
  clearError: () => ({
    type: AUTH_ACTIONS.CLEAR_ERROR,
  }),

  setError: (error) => ({
    type: AUTH_ACTIONS.SET_ERROR,
    payload: { error },
  }),

  // Loading states
  setLoading: (isLoading) => ({
    type: AUTH_ACTIONS.SET_LOADING,
    payload: { isLoading },
  }),

  clearLoading: () => ({
    type: AUTH_ACTIONS.CLEAR_LOADING,
  }),
};
