import { Platform } from 'react-native';

// Enhanced error logging utility
export const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${context}: ${error.message || error}`;
  
  // Enhanced console logging with colors
  console.error('🚨 ERROR:', errorMessage);
  console.error('📍 Context:', context);
  console.error('📱 Platform:', Platform.OS);
  console.error('📊 Stack trace:', error.stack);
  
  // Log to file (in development)
  if (__DEV__) {
    // Create detailed error log
    const detailedLog = {
      timestamp,
      context,
      platform: Platform.OS,
      error: error.message || error,
      stack: error.stack,
      userAgent: Platform.select({
        web: navigator.userAgent,
        default: 'React Native'
      })
    };
    
    console.log('📝 Detailed Error Log:', JSON.stringify(detailedLog, null, 2));
  }
  
  // User-friendly error display removed - using toast notifications instead
};

// Global error handler
export const setupErrorHandling = () => {
  // Handle unhandled promise rejections
  const originalHandler = global.ErrorUtils?.getGlobalHandler();
  
  global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
    logError(error, 'Global Error Handler');
    
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
  
  // Handle unhandled promise rejections
  global.addEventListener?.('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
  });
};

// Component error boundary
export const withErrorBoundary = (Component) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      logError(error, `Error Boundary: ${errorInfo.componentStack}`);
    }

    render() {
      if (this.state.hasError) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Something went wrong.</Text>
          </View>
        );
      }

      return <Component {...this.props} />;
    }
  };
};
