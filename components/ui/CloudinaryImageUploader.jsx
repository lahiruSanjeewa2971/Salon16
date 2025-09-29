import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Animatable from 'react-native-animatable';

import { ThemedText } from '../ThemedText';
import { useTheme } from '../../contexts/ThemeContext';
import { useToastHelpers } from '../ui/ToastSystem';
import cloudinaryService from '../../services/cloudinaryService';

export default function CloudinaryImageUploader({
  value = null, // { url, publicId }
  onChange = () => {},
  onError = () => {},
  error = null, // Error message to display
  label = "Image",
  required = false,
  aspectRatio = [16, 9], // Default for service images
  maxWidth = 1200,
  quality = 0.8,
  folder = "services", // Cloudinary folder
  style = {},
  disabled = false,
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { showSuccess, showError } = useToastHelpers();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Animation values
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);

  const handleImagePicker = async () => {
    if (disabled) return;
    
    try {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: () => handleImageSelection('camera'),
          },
          {
            text: 'Gallery',
            onPress: () => handleImageSelection('gallery'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Image picker error:', error);
      showError('Error', 'Failed to open image picker');
    }
  };

  const handleImageSelection = async (source) => {
    try {
      setIsUploading(true);
      
      let imageAsset;
      
      if (source === 'camera') {
        imageAsset = await cloudinaryService.takePhoto({
          aspect: aspectRatio,
          quality: quality,
        });
      } else {
        imageAsset = await cloudinaryService.pickImageFromGallery({
          aspect: aspectRatio,
          quality: quality,
        });
      }

      if (!imageAsset) {
        setIsUploading(false);
        return;
      }

      // Upload to Cloudinary with enhanced error handling
      let uploadResult;
      try {
        uploadResult = await cloudinaryService.uploadImageFromURI(
          imageAsset.uri,
          {
            preset: 'salon16_images',
            folder: folder,
            transformation: 'q_auto,f_auto'
          }
        );
      } catch (error) {
        console.log('🔄 Primary upload failed, trying base64 method...');
        // Fallback to base64 upload
        uploadResult = await cloudinaryService.uploadImageBase64(
          imageAsset.uri,
          {
            preset: 'salon16_images',
            folder: folder
          }
        );
      }

      const imageData = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      };

      onChange(imageData);
      showSuccess('Success', 'Image uploaded successfully!');
      
    } catch (error) {
      console.error('Image upload error:', error);
      showError('Upload Failed', 'Failed to upload image. Please try again.');
      onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!value?.publicId || disabled) return;

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              await cloudinaryService.deleteImage(value.publicId);
              
              onChange(null);
              showSuccess('Success', 'Image deleted successfully!');
              
            } catch (error) {
              console.error('Image deletion error:', error);
              showError('Delete Failed', 'Failed to delete image. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handlePress = () => {
    if (value) {
      handleDeleteImage();
    } else {
      handleImagePicker();
    }
  };

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95);
    opacityAnim.value = withTiming(0.8);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
    opacityAnim.value = withTiming(1);
  };

  const styles = {
    container: {
      marginBottom: spacing.lg,
      ...style,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    uploaderContainer: {
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderColor: value ? colors.success : colors.inputBorder,
      borderStyle: value ? 'solid' : 'dashed',
      borderRadius: borderRadius.large,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      ...shadows.small,
    },
    uploaderContainerError: {
      borderColor: colors.error,
    },
    uploaderContainerDisabled: {
      opacity: 0.6,
      backgroundColor: colors.inputDisabled,
    },
    imageContainer: {
      width: '100%',
      height: 180,
      borderRadius: borderRadius.medium,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    uploadContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadIconContainer: {
      position: 'relative',
      marginBottom: spacing.sm,
    },
    uploadIcon: {
      zIndex: 2,
    },
    uploadIconGlow: {
      position: 'absolute',
      top: -10,
      left: -10,
      right: -10,
      bottom: -10,
      backgroundColor: colors.primary + '20',
      borderRadius: 50,
      zIndex: 1,
    },
    imageOverlay: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 20,
      padding: spacing.xs,
    },
    uploadText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    uploadSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      marginHorizontal: spacing.xs,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: spacing.xs,
    },
    deleteButton: {
      backgroundColor: colors.error + '20',
    },
    deleteButtonText: {
      color: colors.error,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.large,
    },
    loadingText: {
      fontSize: 14,
      color: colors.text,
      marginTop: spacing.sm,
    },
    requiredIndicator: {
      color: colors.error,
    },
    errorContainer: {
      marginTop: spacing.sm,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginLeft: spacing.sm,
    },
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={styles.requiredIndicator}>*</ThemedText>}
      </ThemedText>
      
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.uploaderContainer,
            disabled && styles.uploaderContainerDisabled,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isUploading || isDeleting}
        >
          {isUploading || isDeleting ? (
            <Animatable.View 
              animation="fadeIn" 
              duration={300}
              style={styles.loadingContainer}
            >
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite"
                duration={1000}
              >
                <ActivityIndicator size="large" color={colors.primary} />
              </Animatable.View>
              <Animatable.View 
                animation="fadeInUp" 
                delay={200}
              >
                <ThemedText style={styles.loadingText}>
                  {isUploading ? 'Uploading...' : 'Deleting...'}
                </ThemedText>
              </Animatable.View>
            </Animatable.View>
          ) : value ? (
            <Animatable.View 
              animation="fadeInUp" 
              duration={500}
              style={styles.uploadContent}
            >
              <Animatable.View 
                animation="zoomIn" 
                delay={200}
                style={styles.imageContainer}
              >
                <Image source={{ uri: value.url }} style={styles.image} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              </Animatable.View>
              <Animatable.View 
                animation="fadeInUp" 
                delay={400}
                style={styles.actionButtons}
              >
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteImage}
                  disabled={disabled}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Remove
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleImagePicker}
                  disabled={disabled}
                >
                  <Ionicons name="camera-outline" size={16} color={colors.primary} />
                  <ThemedText style={styles.actionButtonText}>
                    Change
                  </ThemedText>
                </TouchableOpacity>
              </Animatable.View>
            </Animatable.View>
          ) : (
            <Animatable.View 
              animation="fadeIn" 
              duration={500}
              style={styles.uploadContent}
            >
              <Animatable.View 
                animation="bounceIn" 
                delay={200}
                style={styles.uploadIconContainer}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={48}
                  color={colors.primary}
                  style={styles.uploadIcon}
                />
                <View style={styles.uploadIconGlow} />
              </Animatable.View>
              <Animatable.View 
                animation="fadeInUp" 
                delay={400}
              >
                <ThemedText style={styles.uploadText}>
                  Tap to upload image
                </ThemedText>
              </Animatable.View>
              <Animatable.View 
                animation="fadeInUp" 
                delay={600}
              >
                <ThemedText style={styles.uploadSubtext}>
                  Choose from camera or gallery
                </ThemedText>
              </Animatable.View>
            </Animatable.View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {error && (
        <Animatable.View 
          animation="fadeIn" 
          duration={300}
          style={styles.errorContainer}
        >
          <ThemedText style={styles.errorText}>
            {error}
          </ThemedText>
        </Animatable.View>
      )}
    </View>
  );
}
