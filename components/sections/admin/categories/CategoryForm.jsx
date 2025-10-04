import React, { useState, useCallback } from 'react';
import { View, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { ThemedButton } from '../../../themed/ThemedButton';
import { ThemedInput } from '../../../themed/ThemedInput';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useToastHelpers } from '../../../ui/ToastSystem';
import { categoryService } from '../../../../services/firebaseService';

const { width } = Dimensions.get('window');

export default function CategoryForm({ 
  showModal, 
  editingCategory, 
  onClose, 
  onSave 
}) {
  const theme = useTheme();
  
  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};
  const { showError, showSuccess } = useToastHelpers();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation
  const modalAnim = useSharedValue(0);

  // Effect for modal visibility
  React.useEffect(() => {
    if (showModal) {
      modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      
      // Initialize form data
      if (editingCategory) {
        setFormData({
          name: editingCategory.name || '',
        });
      } else {
        setFormData({
          name: '',
        });
      }
      setErrors({});
    } else {
      modalAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [showModal, editingCategory]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Category Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const categoryData = {
        name: formData.name.trim(),
        slug: formData.name.trim().toLowerCase().replace(/\s+/g, '-'),
        isActive: editingCategory ? editingCategory.isActive : true,
      };
      
      let savedCategory;
      if (editingCategory) {
        savedCategory = await categoryService.updateCategory(editingCategory.id, categoryData);
        showSuccess('Category Updated Successfully!', `"${categoryData.name}" has been updated.`, { duration: 4000 });
      } else {
        savedCategory = await categoryService.createCategory(categoryData);
        showSuccess('Category Created Successfully!', `"${categoryData.name}" has been added to your categories.`, { duration: 4000 });
      }
      
      onClose();
      onSave(savedCategory);
    } catch (error) {
      console.error('Error saving category:', error);
      let errorMessage = editingCategory 
        ? 'Failed to update category. Please try again.'
        : 'Failed to create category. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showError(editingCategory ? 'Update Failed' : 'Creation Failed', errorMessage, { duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  }, [formData, errors, editingCategory, showError, showSuccess, onClose, onSave, validateForm]);

  const handleClose = useCallback(() => {
    setFormData({ name: '' });
    setErrors({});
    onClose();
  }, [onClose]);

  // Animated styles
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

  const styles = {
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: width * 0.9,
      maxWidth: 400,
      backgroundColor: colors?.surface || '#FFFFFF',
      borderRadius: borderRadius?.xl || 16,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing?.lg || 16,
      borderBottomWidth: 1,
      borderBottomColor: colors?.border || '#E5E5E5',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors?.text || '#000000',
    },
    closeButton: {
      padding: spacing?.sm || 8,
    },
    modalContent: {
      padding: spacing?.lg || 16,
    },
    modalScrollContent: {
      paddingBottom: spacing?.xl || 24,
    },
    formGroup: {
      marginBottom: spacing?.lg || 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors?.text || '#000000',
      marginBottom: spacing?.sm || 8,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: spacing?.lg || 16,
      borderTopWidth: 1,
      borderTopColor: colors?.border || '#E5E5E5',
      backgroundColor: colors?.surfaceSecondary || '#F8F8F8',
    },
    modalButton: {
      flex: 1,
      marginHorizontal: spacing?.xs || 4,
      paddingVertical: spacing?.md || 12,
      borderRadius: borderRadius?.medium || 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cancelButton: {
      backgroundColor: colors?.neutral?.[200] || '#E5E5E5',
    },
    saveButton: {
      backgroundColor: colors?.primary || '#8B5CF6',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors?.text || '#000000',
    },
    saveButtonText: {
      color: 'white',
    },
    disabledButton: {
      backgroundColor: colors?.neutral?.[300] || '#CCCCCC',
    },
    disabledButtonText: {
      color: colors?.textSecondary || '#666666',
    },
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalOverlay, backdropAnimatedStyle]}>
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Ionicons name="close" size={24} color={colors?.text || '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category Name */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Category Name *</ThemedText>
              <ThemedInput
                placeholder="Enter category name (e.g., Hair, Nail, Facial)"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                error={errors.name}
                maxLength={50}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                isSaving && styles.disabledButton,
              ]}
              onPress={handleClose}
              disabled={isSaving}
            >
              <ThemedText style={[
                styles.buttonText,
                styles.cancelButtonText,
                isSaving && styles.disabledButtonText,
              ]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                isSaving && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <ThemedText style={[
                styles.buttonText,
                styles.saveButtonText,
                isSaving && styles.disabledButtonText,
              ]}>
                {isSaving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
