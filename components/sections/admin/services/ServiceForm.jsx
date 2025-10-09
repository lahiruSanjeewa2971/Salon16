import React, { useState, useCallback } from 'react';
import { View, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';

import { ThemedText } from '../../../ThemedText';
import { ThemedButton } from '../../../themed/ThemedButton';
import { ThemedInput } from '../../../themed/ThemedInput';
import CloudinaryImageUploader from '../../../ui/CloudinaryImageUploader';
import CategoryDropdown from '../../../ui/CategoryDropdown';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useToastHelpers } from '../../../ui/ToastSystem';
import { createSecureFirestoreService } from '../../../../services/createSecureFirestoreService';
import { useAuth } from '../../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ServiceForm({ 
  showAddModal, 
  showEditModal, 
  editingService, 
  onClose, 
  onSave 
}) {
  const { colors, spacing, borderRadius } = useTheme();
  const { showError, showSuccess } = useToastHelpers();
  const { user } = useAuth();
  
  // Create secure service with user context
  const secureService = createSecureFirestoreService(user);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    image: null, // Changed from string to object
    category: null, // Added category field
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Animation
  const modalAnim = useSharedValue(0);

  // Fetch active categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const activeCategories = await secureService.sharedOperations.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Error', 'Failed to load categories. Please try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [showError]);

  // Fetch categories when modal opens
  React.useEffect(() => {
    if (showAddModal || showEditModal) {
      fetchCategories();
    }
  }, [showAddModal, showEditModal, fetchCategories]);

  // Separate effects for Add and Edit modals
  React.useEffect(() => {
    if (showAddModal) {
      modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      
      // Initialize form data for Add modal
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        image: null,
        category: null,
      });
      setErrors({});
    } else if (showEditModal && editingService) {
      modalAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      
       // Initialize form data for Edit modal
       let matchingCategory = null;
       
       if (editingService.category) {
         if (typeof editingService.category === 'string') {
           // Handle old format (string) - find matching category object
           matchingCategory = categories.find(cat => cat.name === editingService.category) || null;
         } else if (editingService.category.id && editingService.category.name) {
           // Handle new format (object) - find matching category object
           matchingCategory = categories.find(cat => cat.id === editingService.category.id) || null;
         }
       }
      
      setFormData({
        name: editingService.name || '',
        description: editingService.description || '',
        price: editingService.price?.toString() || '',
        duration: editingService.duration?.toString() || '',
        image: editingService.image ? {
          url: editingService.image,
          publicId: editingService.publicId || null,
        } : null,
        category: matchingCategory,
      });
      setErrors({});
    } else {
      modalAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [showAddModal, showEditModal, editingService, categories]);

  const validateForm = useCallback(() => {
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
    if (!formData.image || !formData.image.url) {
      newErrors.image = 'Image is required';
    }
    
    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
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
  }, [formData, showError]);

  const handleSaveService = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      const serviceData = {
        name: formData.name?.trim() || '',
        description: formData.description?.trim() || '',
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 0,
        image: formData.image?.url || (editingService ? editingService.image : ''),
        publicId: formData.image?.publicId || (editingService ? editingService.publicId : null),
         category: formData.category ? {
           id: formData.category.id,
           name: formData.category.name
         } : { id: 'default', name: 'Hair' }, // Save as object with id and name
        isActive: true, // Default to active
        icon: editingService ? editingService.icon : 'star-outline',
        color: editingService ? editingService.color : colors.primary,
        popular: editingService ? editingService.popular : false,
      };

      // Save to Firebase
      let savedService;
      if (editingService) {
        // Update existing service
        savedService = await secureService.adminOperations.updateService(editingService.id, serviceData);
        
        // Show success message
        showSuccess(
          'Service Updated Successfully!',
          `"${serviceData.name}" has been updated.`,
          { duration: 4000 }
        );
      } else {
        // Create new service
        savedService = await secureService.adminOperations.createService(serviceData);
        
        // Show success message
        showSuccess(
          'Service Created Successfully!',
          `"${serviceData.name}" has been added to your services.`,
          { duration: 4000 }
        );
      }
      
      // Close the modal
      onClose();
      
      // Call the onSave callback with the saved service
      onSave(savedService);
      
    } catch (error) {
      console.error('Error saving service:', error); // Keep for development debugging
      
      // Handle different types of errors
      let errorMessage = editingService 
        ? 'Failed to update service. Please try again.'
        : 'Failed to create service. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = editingService 
          ? 'You do not have permission to update services.'
          : 'You do not have permission to create services.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service is temporarily unavailable. Please check your internet connection.';
      } else if (error.code === 'invalid-argument') {
        errorMessage = 'Invalid service data. Please check all fields.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(
        editingService ? 'Update Failed' : 'Creation Failed',
        errorMessage,
        { duration: 5000 }
      );
    } finally {
      setIsSaving(false);
    }
  }, [formData, errors, editingService, colors.primary, showError, showSuccess, onClose, onSave]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

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
      maxHeight: '90%',
      flex: 1,
    },
    modalScrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.xl,
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
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: 'rgba(248, 249, 250, 0.8)',
      marginHorizontal: -spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    modalButton: {
      flex: 1,
      marginHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.large,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.6,
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

            <ScrollView 
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                <CategoryDropdown
                  label="Category *"
                  categories={categories}
                  selectedCategory={formData.category}
                  onSelectCategory={(category) => handleInputChange('category', category)}
                  error={errors.category}
                  placeholder="Select Category"
                />
              </View>

              <CloudinaryImageUploader
                label="Service Image *"
                value={formData.image}
                onChange={(imageData) => handleInputChange('image', imageData)}
                error={errors.image}
                required={true}
                aspectRatio={[16, 9]}
                maxWidth={1200}
                quality={0.8}
                folder="services"
                preset="salon16_images"
              />

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
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton, isSaving && styles.disabledButton]}
                onPress={handleSaveService}
                disabled={isSaving}
              >
                <ThemedText style={[styles.modalButtonText, { color: 'white' }]}>
                  {isSaving ? 'Creating...' : 'Add Service'}
                </ThemedText>
              </TouchableOpacity>
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

            <ScrollView 
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                <CategoryDropdown
                  label="Category *"
                  categories={categories}
                  selectedCategory={formData.category}
                  onSelectCategory={(category) => handleInputChange('category', category)}
                  error={errors.category}
                  placeholder="Select Category"
                />
              </View>

              <CloudinaryImageUploader
                label="Service Image *"
                value={formData.image}
                onChange={(imageData) => handleInputChange('image', imageData)}
                error={errors.image}
                required={true}
                aspectRatio={[16, 9]}
                maxWidth={1200}
                quality={0.8}
                folder="services"
                preset="salon16_images"
              />

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
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton, isSaving && styles.disabledButton]}
                onPress={handleSaveService}
                disabled={isSaving}
              >
                <ThemedText style={[styles.modalButtonText, { color: 'white' }]}>
                  {isSaving ? 'Updating...' : 'Update Service'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
