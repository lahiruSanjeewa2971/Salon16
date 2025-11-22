import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import cloudinaryService from '../../services/cloudinaryService';
import { ThemedText } from '../ThemedText';
import { useToastHelpers } from './ToastSystem';

function CloudinaryImageUploader({
  value = null, // { url, publicId }
  onChange = () => {},
  onError = () => {},
  error = null, // Error message to display
  label = "Image",
  required = false,
  aspectRatio = [16, 9], // Default for service images
  maxWidth = 1200,
  quality = 0.8,
  folder = "salon16", // Cloudinary folder
  preset = "salon16_images", // Cloudinary upload preset
  style = {},
  disabled = false,
}) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { showSuccess, showError } = useToastHelpers();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use the original URL directly - no cleaning needed
  const imageUrl = value?.url || null;
  
  
  // Animation values
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);

  const handleImagePicker = useCallback(async () => {
    if (disabled) return;
    
    try {
      // On web, directly open file picker (skip Alert dialog)
      if (Platform.OS === 'web') {
        await handleImageSelection('gallery');
        return;
      }
      
      // On native, show Alert with Camera/Gallery options
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
  }, [disabled, onChange, onError, showSuccess, showError, folder, preset, maxWidth, quality, aspectRatio]);

  const handleImageSelection = async (source) => {
    try {
      setIsUploading(true);
      
      let imageAsset;
      
      try {
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
      } catch (pickerError) {
        // Handle picker errors (e.g., user cancelled, permission denied)
        console.log('Image picker cancelled or error:', pickerError);
        setIsUploading(false);
        return;
      }

      // If user cancelled or no image selected, stop loading
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
            preset: preset,
            folder: folder
          }
        );
      } catch (error) {
        console.log('🔄 Primary upload failed, trying base64 method...');
        // Fallback to base64 upload
        uploadResult = await cloudinaryService.uploadImageBase64(
          imageAsset.uri,
          {
            preset: preset,
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

  const handleDeleteImage = useCallback(async () => {
    if (!value?.publicId || disabled) return;

    // On web, directly delete (skip Alert dialog)
    if (Platform.OS === 'web') {
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
      return;
    }

    // On native, show confirmation Alert
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
  }, [value?.publicId, disabled, onChange, showSuccess, showError]);

  const handlePress = useCallback(() => {
    if (value) {
      handleDeleteImage();
    } else {
      handleImagePicker();
    }
  }, [value, handleDeleteImage, handleImagePicker]);

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

  // Web-compatible color helpers
  const isWeb = Platform.OS === 'web';
  
  const getTextColor = () => {
    if (isWeb) {
      return '#FFFFFF';
    }
    return colors?.text || '#000000';
  };
  
  const getTextSecondaryColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.8)';
    }
    return colors?.textSecondary || '#666666';
  };
  
  const getInputBackgroundColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.15)';
    }
    return colors?.inputBackground || '#FFFFFF';
  };
  
  const getInputBorderColor = () => {
    if (isWeb) {
      return 'rgba(255, 255, 255, 0.3)';
    }
    return colors?.inputBorder || '#E5E5E5';
  };
  
  const getSuccessBorderColor = () => {
    if (isWeb) {
      return 'rgba(16, 185, 129, 0.5)'; // success color with opacity
    }
    return colors?.success || '#10B981';
  };
  
  const getPrimaryColor = () => {
    return colors?.primary || '#6C2A52';
  };
  
  const getErrorColor = () => {
    return colors?.error || '#EF4444';
  };
  
  const getSuccessColor = () => {
    return colors?.success || '#10B981';
  };
  
  // Helper function to add alpha to hex color
  const addAlpha = (color, alpha) => {
    if (!color) return `rgba(255, 255, 255, ${alpha})`;
    // If color is already rgba, extract RGB values
    if (color.startsWith('rgba')) {
      const rgb = color.match(/\d+/g);
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
    // If color is hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Fallback
    return color;
  };

  const styles = {
    container: {
      marginBottom: spacing.lg,
      ...style,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: getTextColor(),
      marginBottom: spacing.sm,
    },
    uploaderContainer: {
      backgroundColor: getInputBackgroundColor(),
      borderWidth: 2,
      borderColor: value ? getSuccessBorderColor() : getInputBorderColor(),
      borderStyle: value ? 'solid' : 'dashed',
      borderRadius: borderRadius.large,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        default: shadows.small,
      }),
    },
    uploaderContainerError: {
      borderColor: getErrorColor(),
    },
    uploaderContainerDisabled: {
      opacity: 0.6,
      backgroundColor: isWeb ? 'rgba(255, 255, 255, 0.05)' : (colors?.inputDisabled || '#F5F5F5'),
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
      backgroundColor: addAlpha(getPrimaryColor(), 0.2),
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
      color: getTextColor(),
      marginBottom: spacing.xs,
    },
    uploadSubtext: {
      fontSize: 14,
      color: getTextSecondaryColor(),
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
      backgroundColor: isWeb 
        ? 'rgba(236, 72, 153, 0.4)' // Pink/rose color for web (Change button)
        : addAlpha(getPrimaryColor(), 0.4),
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.medium,
      marginHorizontal: spacing.xs,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: spacing.xs,
    },
    deleteButton: {
      backgroundColor: isWeb
        ? 'rgba(239, 68, 68, 0.5)' // Red color for web (Remove button)
        : addAlpha(getErrorColor(), 0.5),
    },
    deleteButtonText: {
      color: '#FFFFFF',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isWeb ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.large,
    },
    loadingText: {
      fontSize: 14,
      color: getTextColor(),
      marginTop: spacing.sm,
    },
    requiredIndicator: {
      color: getErrorColor(),
    },
    errorContainer: {
      marginTop: spacing.sm,
    },
    errorText: {
      fontSize: 13,
      color: 'white',
      marginTop: spacing.xs,
      paddingLeft: spacing.xs || 8,
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    successIconContainer: {
      position: 'relative',
      marginBottom: spacing.lg,
    },
    successIconGlow: {
      position: 'absolute',
      top: -10,
      left: -10,
      right: -10,
      bottom: -10,
      backgroundColor: addAlpha(getSuccessColor(), 0.2),
      borderRadius: 50,
      zIndex: -1,
    },
    successTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: getSuccessColor(),
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    successSubtitle: {
      fontSize: 14,
      color: getTextSecondaryColor(),
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    imageInfoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: isWeb ? 'rgba(255, 255, 255, 0.1)' : (colors?.inputBackground || '#FFFFFF'),
      borderRadius: borderRadius.medium,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    imageInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    imageInfoText: {
      fontSize: 12,
      color: getTextSecondaryColor(),
      marginLeft: spacing.xs,
      fontWeight: '500',
    },
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>
        {label} {required && <ThemedText style={styles.requiredIndicator}>*</ThemedText>}
      </ThemedText>
      
      <View>
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
              animation="bounceIn" 
              duration={600}
              style={styles.uploadContent}
            >
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite"
                duration={2000}
                style={styles.successContainer}
              >
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                  <View style={styles.successIconGlow} />
                </View>
                
                <Animatable.View 
                  animation="fadeInUp" 
                  delay={300}
                >
                  <ThemedText style={styles.successTitle}>
                    Image Uploaded Successfully!
                  </ThemedText>
                </Animatable.View>
                
                <Animatable.View 
                  animation="fadeInUp" 
                  delay={500}
                >
                  <ThemedText style={styles.successSubtitle}>
                    Your image has been uploaded to Cloudinary
                  </ThemedText>
                </Animatable.View>
                
                {/* <Animatable.View 
                  animation="fadeInUp" 
                  delay={700}
                >
                  <View style={styles.imageInfoContainer}>
                    <View style={styles.imageInfoItem}>
                      <Ionicons name="image-outline" size={16} color={getTextSecondaryColor()} />
                      <ThemedText style={styles.imageInfoText}>
                        {value?.format?.toUpperCase() || 'JPG'}
                      </ThemedText>
                    </View>
                    <View style={styles.imageInfoItem}>
                      <Ionicons name="resize-outline" size={16} color={getTextSecondaryColor()} />
                      <ThemedText style={styles.imageInfoText}>
                        {value?.width}x{value?.height}
                      </ThemedText>
                    </View>
                    <View style={styles.imageInfoItem}>
                      <Ionicons name="cloud-outline" size={16} color={getTextSecondaryColor()} />
                      <ThemedText style={styles.imageInfoText}>
                        Cloudinary
                      </ThemedText>
                    </View>
                  </View>
                </Animatable.View> */}
              </Animatable.View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteImage}
                  disabled={disabled}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Remove
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleImagePicker}
                  disabled={disabled}
                >
                  <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>
                    Change
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
      </View>
      
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

export default memo(CloudinaryImageUploader);
