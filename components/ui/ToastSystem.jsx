import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Toast context
const ToastContext = createContext();

// Toast provider
export const ToastProvider = ({ children }) => {
  const { colors, spacing } = useTheme();
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (config) => {
      const id = Date.now().toString();
      const defaultConfig = {
        type: TOAST_TYPES.INFO,
        title: '',
        message: '',
        duration: 3000,
        position: 'top',
        showIcon: true,
      };

      const toastConfig = { ...defaultConfig, ...config, id };
      setToasts((prev) => [...prev, toastConfig]);

      // Auto remove
      if (toastConfig.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, toastConfig.duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = {
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
          colors={colors}
          spacing={spacing}
        />
      ))}
    </ToastContext.Provider>
  );
};

// Toast item component
const ToastItem = ({ toast, onRemove, colors, spacing }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate in
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  const getToastConfig = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981', // Green color for success
          backgroundColor: '#FFFFFF', // White background
          borderColor: '#10B981',
        };
      case TOAST_TYPES.ERROR:
        return {
          icon: 'close-circle',
          iconColor: '#EF4444', // Red color for error
          backgroundColor: '#FFFFFF', // White background
          borderColor: '#EF4444',
        };
      case TOAST_TYPES.WARNING:
        return {
          icon: 'warning',
          iconColor: '#F59E0B', // Orange color for warning
          backgroundColor: '#FFFFFF', // White background
          borderColor: '#F59E0B',
        };
      case TOAST_TYPES.INFO:
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6', // Blue color for info
          backgroundColor: '#FFFFFF', // White background
          borderColor: '#3B82F6',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#6B7280', // Gray color for default
          backgroundColor: '#FFFFFF', // White background
          borderColor: '#6B7280',
        };
    }
  };

  const toastConfig = getToastConfig();

  const animatedStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: toast.position === 'top' ? [-100, 0] : [100, 0],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
    opacity: animation,
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: toast.position === 'top' ? 60 : undefined,
          bottom: toast.position === 'bottom' ? 60 : undefined,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: toastConfig.backgroundColor,
            borderColor: toastConfig.borderColor,
            borderWidth: 1,
          },
        ]}
        onPress={onRemove}
        activeOpacity={0.8}
      >
        {toast.showIcon && (
          <Ionicons
            name={toastConfig.icon}
            size={20}
            color={toastConfig.iconColor}
            style={styles.icon}
          />
        )}

        <View style={styles.content}>
          {toast.title && (
            <Text
              style={[
                styles.title,
                {
                  color: '#1F2937', // Dark gray for title on white background
                  marginBottom: toast.message ? 2 : 0,
                },
              ]}
            >
              {toast.title}
            </Text>
          )}

          {toast.message && (
            <Text
              style={[
                styles.message,
                { color: '#6B7280' }, // Medium gray for message on white background
              ]}
            >
              {toast.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={16}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Custom hook for using toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Predefined toast functions
export const useToastHelpers = () => {
  const { showToast } = useToast();

  const showSuccess = useCallback(
    (title, message, options = {}) => {
      return showToast({
        type: TOAST_TYPES.SUCCESS,
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (title, message, options = {}) => {
      return showToast({
        type: TOAST_TYPES.ERROR,
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title, message, options = {}) => {
      return showToast({
        type: TOAST_TYPES.WARNING,
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title, message, options = {}) => {
      return showToast({
        type: TOAST_TYPES.INFO,
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Styles
const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 50,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ToastContext;
