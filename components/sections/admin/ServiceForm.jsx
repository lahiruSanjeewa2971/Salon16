import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../../ThemedText';
import { ThemedButton } from '../../themed/ThemedButton';
import { ThemedInput } from '../../themed/ThemedInput';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToastHelpers } from '../../ui/ToastSystem';

const { width } = Dimensions.get('window');

export default function ServiceForm({ 
  showAddModal, 
  showEditModal, 
  editingService, 
  onClose, 
  onSave 
}) {
  const { colors, spacing, borderRadius } = useTheme();
  const { showError } = useToastHelpers();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    image: '',
  });
  const [errors, setErrors] = useState({});
  
  // Animation
  const modalAnim = useSharedValue(0);

  React.useEffect(() => {
    if (showAddModal || showEditModal) {
      modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      
      // Initialize form data
      if (editingService) {
        setFormData({
          name: editingService.name || '',
          description: editingService.description || '',
          price: editingService.price?.toString() || '',
          duration: editingService.duration?.toString() || '',
          image: editingService.image || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          image: '',
        });
      }
      setErrors({});
    } else {
      modalAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [showAddModal, showEditModal, editingService]);

  const validateForm = () => {
    const newErrors = {};
    
    // Service Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Service name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Service name must be at least 2 characters';
    }
    
    // Description validation
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Service description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    // Price validation
    if (!formData.price || !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0';
    }
    
    // Duration validation
    if (!formData.duration || !formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration greater than 0';
    }
    
    // Image validation
    if (!formData.image || !formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else {
      // Basic URL validation
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.image.trim())) {
        newErrors.image = 'Please enter a valid image URL';
      }
    }
    
    setErrors(newErrors);
    
    // Show toast for validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      const errorFields = Object.keys(newErrors).join(', ');
      
      showError(
        'Please Check Your Input',
        `${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention: ${errorFields}`,
        { duration: 5000 }
      );
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveService = () => {
    if (!validateForm()) {
      return;
    }

    const newService = {
      id: editingService ? editingService.id : Date.now().toString(),
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      price: parseFloat(formData.price) || 0,
      duration: parseInt(formData.duration) || 0,
      image: formData.image?.trim() || '',
      category: 'Hair', // Default category
      isActive: true, // Default to active
      createdAt: editingService ? editingService.createdAt : new Date(),
      updatedAt: new Date(),
      icon: editingService ? editingService.icon : 'star-outline',
      color: editingService ? editingService.color : colors.primary,
      popular: editingService ? editingService.popular : false,
    };

    console.log('Creating new service:', newService);
    onSave(newService);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [{ scale: interpolate(modalAnim.value, [0, 1], [0.8, 1]) }],
  }));

  const styles = {
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      width: width * 0.9,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalCloseButton: {
      padding: spacing.sm,
    },
    formGroup: {
      marginBottom: spacing.lg,
    },
    formRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    formRowItem: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      marginHorizontal: spacing.sm,
    },
  };

  return (
    <>
      {/* Add Service Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add New Service</ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Service Name *"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter service name"
                error={errors.name}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Description *"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
                error={errors.description}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Image URL *"
                value={formData.image}
                onChangeText={(text) => handleInputChange('image', text)}
                placeholder="https://example.com/image.jpg"
                keyboardType="url"
                error={errors.image}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Price ($) *"
                  value={formData.price}
                  onChangeText={(text) => handleInputChange('price', text)}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.price}
                />
              </View>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Duration (min) *"
                  value={formData.duration}
                  onChangeText={(text) => handleInputChange('duration', text)}
                  placeholder="30"
                  keyboardType="numeric"
                  error={errors.duration}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <ThemedButton
                title="Cancel"
                onPress={onClose}
                style={styles.modalButton}
              />
              <ThemedButton
                title="Add Service"
                onPress={handleSaveService}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Service</ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Service Name *"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter service name"
                error={errors.name}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Description *"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
                error={errors.description}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedInput
                label="Image URL *"
                value={formData.image}
                onChangeText={(text) => handleInputChange('image', text)}
                placeholder="https://example.com/image.jpg"
                keyboardType="url"
                error={errors.image}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Price ($) *"
                  value={formData.price}
                  onChangeText={(text) => handleInputChange('price', text)}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.price}
                />
              </View>
              <View style={styles.formRowItem}>
                <ThemedInput
                  label="Duration (min) *"
                  value={formData.duration}
                  onChangeText={(text) => handleInputChange('duration', text)}
                  placeholder="30"
                  keyboardType="numeric"
                  error={errors.duration}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <ThemedButton
                title="Cancel"
                onPress={onClose}
                style={styles.modalButton}
              />
              <ThemedButton
                title="Update Service"
                onPress={handleSaveService}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
