import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// Alert types
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CONFIRM: 'confirm',
};

// Alert context
const AlertContext = createContext();

// Alert provider
export const AlertProvider = ({ children }) => {
  const { colors, spacing } = useTheme();
  const [alert, setAlert] = useState(null);
  const [animation] = useState(new Animated.Value(0));

  const showAlert = useCallback((config) => {
    const defaultConfig = {
      type: ALERT_TYPES.INFO,
      title: '',
      message: '',
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null,
      showCancel: false,
      autoHide: true,
      duration: 3000,
    };

    const alertConfig = { ...defaultConfig, ...config };
    setAlert(alertConfig);

    // Animate in
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Auto hide if enabled
    if (alertConfig.autoHide && alertConfig.duration > 0) {
      setTimeout(() => {
        hideAlert();
      }, alertConfig.duration);
    }
  }, [animation]);

  const hideAlert = useCallback(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setAlert(null);
    });
  }, [animation]);

  const contextValue = {
    showAlert,
    hideAlert,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alert && (
        <AlertModal
          alert={alert}
          animation={animation}
          onHide={hideAlert}
          colors={colors}
          spacing={spacing}
        />
      )}
    </AlertContext.Provider>
  );
};

// Alert modal component
const AlertModal = ({ alert, animation, onHide, colors, spacing }) => {
  const getAlertConfig = () => {
    switch (alert.type) {
      case ALERT_TYPES.SUCCESS:
        return {
          icon: 'checkmark-circle',
          iconColor: colors.success,
          backgroundColor: colors.background,
          borderColor: colors.success,
        };
      case ALERT_TYPES.ERROR:
        return {
          icon: 'close-circle',
          iconColor: colors.error,
          backgroundColor: colors.background,
          borderColor: colors.error,
        };
      case ALERT_TYPES.WARNING:
        return {
          icon: 'warning',
          iconColor: colors.warning,
          backgroundColor: colors.background,
          borderColor: colors.warning,
        };
      case ALERT_TYPES.INFO:
        return {
          icon: 'information-circle',
          iconColor: colors.info,
          backgroundColor: colors.background,
          borderColor: colors.info,
        };
      case ALERT_TYPES.CONFIRM:
        return {
          icon: 'help-circle',
          iconColor: colors.primary,
          backgroundColor: colors.background,
          borderColor: colors.primary,
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: colors.primary,
          backgroundColor: colors.background,
          borderColor: colors.primary,
        };
    }
  };

  const alertConfig = getAlertConfig();

  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    onHide();
  };

  const handleCancel = () => {
    if (alert.onCancel) {
      alert.onCancel();
    }
    onHide();
  };

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: animation,
  };

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={onHide}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertContainer, animatedStyle]}>
          <View
            style={[
              styles.alert,
              {
                backgroundColor: alertConfig.backgroundColor,
                borderColor: alertConfig.borderColor,
                borderWidth: 2,
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={alertConfig.icon}
                size={48}
                color={alertConfig.iconColor}
              />
            </View>

            {/* Title */}
            {alert.title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    marginBottom: alert.message ? spacing.sm : spacing.md,
                  },
                ]}
              >
                {alert.title}
              </Text>
            )}

            {/* Message */}
            {alert.message && (
              <Text
                style={[
                  styles.message,
                  {
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                  },
                ]}
              >
                {alert.message}
              </Text>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {alert.showCancel && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      marginRight: spacing.sm,
                    },
                  ]}
                  onPress={handleCancel}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {alert.cancelText}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: alertConfig.iconColor,
                    flex: alert.showCancel ? 0 : 1,
                  },
                ]}
                onPress={handleConfirm}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.confirmButtonText,
                    { color: 'white' },
                  ]}
                >
                  {alert.confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Custom hook for using alerts
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Predefined alert functions
export const useAlertHelpers = () => {
  const { showAlert } = useAlert();

  const showSuccess = useCallback(
    (title, message, options = {}) => {
      showAlert({
        type: ALERT_TYPES.SUCCESS,
        title,
        message,
        ...options,
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title, message, options = {}) => {
      showAlert({
        type: ALERT_TYPES.ERROR,
        title,
        message,
        ...options,
      });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title, message, options = {}) => {
      showAlert({
        type: ALERT_TYPES.WARNING,
        title,
        message,
        ...options,
      });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title, message, options = {}) => {
      showAlert({
        type: ALERT_TYPES.INFO,
        title,
        message,
        ...options,
      });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (title, message, onConfirm, onCancel, options = {}) => {
      showAlert({
        type: ALERT_TYPES.CONFIRM,
        title,
        message,
        onConfirm,
        onCancel,
        showCancel: true,
        autoHide: false,
        ...options,
      });
    },
    [showAlert]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  alert: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    // Color is set dynamically
  },
});

export default AlertContext;
