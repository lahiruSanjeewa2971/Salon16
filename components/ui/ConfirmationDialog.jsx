import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Platform, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
// import { ThemedText } from '../../ThemedText';
// import {} from '../../contexts/ThemeContext'
import { ThemedText } from '../../components/ThemedText';

export default function ConfirmationDialog({
  visible,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'destructive', // 'primary', 'destructive', 'success'
  onConfirm,
  onCancel,
  onClose,
}) {
  const { colors, spacing, borderRadius } = useTheme();
  const isWeb = Platform.OS === 'web';

  // Animation
  const modalAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      modalAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [visible, modalAnim]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [
      {
        scale: interpolate(modalAnim.value, [0, 1], [0.8, 1], 'clamp'),
      },
      {
        translateY: interpolate(modalAnim.value, [0, 1], [50, 0], 'clamp'),
      },
    ],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
  }));

  // Web-compatible color helpers
  const getTextColor = () => {
    if (isWeb) {
      return colors?.text || '#FFFFFF';
    }
    return colors?.text || '#000000';
  };

  const getBorderColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.3)';
    }
    return colors?.border || '#E5E5E5';
  };

  const getPrimaryColor = () => {
    return colors?.primary || '#6C2A52';
  };

  const getPrimaryDarkColor = () => {
    return colors?.primaryDark || '#8E3B60';
  };

  const getAccentColor = () => {
    return colors?.accent || '#EC4899';
  };

  const getConfirmButtonColor = () => {
    switch (confirmButtonStyle) {
      case 'destructive':
        return colors?.error || '#EF4444';
      case 'success':
        return colors?.success || '#10B981';
      case 'primary':
      default:
        return getAccentColor();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const styles = {
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      borderRadius: borderRadius.xl,
      width: '90%',
      maxWidth: 400,
      overflow: 'hidden',
      ...Platform.select({
        web: {
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10,
        },
      }),
    },
    gradientBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    modalContentWrapper: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: getBorderColor(),
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: getTextColor(),
      flex: 1,
    },
    modalCloseButton: {
      padding: spacing.sm,
      marginLeft: spacing.md,
    },
    modalBody: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    message: {
      fontSize: 16,
      color: getTextColor(),
      lineHeight: 24,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: spacing.lg,
      paddingTop: 0,
      gap: spacing.md,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.large,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        default: {
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
    cancelButton: {
      backgroundColor: isWeb ? 'rgba(255, 255, 255, 0.15)' : (colors?.background || '#FFFFFF'),
      borderWidth: 1,
      borderColor: getBorderColor(),
    },
    confirmButton: {
      backgroundColor: getConfirmButtonColor(),
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View style={[styles.modalOverlay, backdropAnimatedStyle]}>
        <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
          {/* Gradient Background */}
          <LinearGradient
            colors={[
              getPrimaryColor(),
              getPrimaryDarkColor(),
              getAccentColor()
            ]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Content Wrapper */}
          <View style={styles.modalContentWrapper}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {title}
              </ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color={getTextColor()} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <ThemedText style={styles.message}>
                {message}
              </ThemedText>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <ThemedText style={[styles.modalButtonText, { color: getTextColor() }]}>
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <ThemedText style={[styles.modalButtonText, { color: 'white' }]}>
                  {confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}