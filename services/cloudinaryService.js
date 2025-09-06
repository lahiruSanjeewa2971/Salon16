import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import cloudinaryConfig from '../config/cloudinary.config';

// Note: We can't use the cloudinary SDK directly in React Native
// Instead, we'll use direct API calls to Cloudinary

export const cloudinaryService = {
  // Upload image from URI (React Native)
  uploadImageFromURI: async (imageUri, options = {}) => {
    try {
      const formData = new FormData();
      
      // Create a file object from the URI
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData.append('file', blob, 'image.jpg');
      formData.append('upload_preset', 'salon16_images'); // You'll need to create this preset
      formData.append('cloud_name', cloudinaryConfig.cloud_name);
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      const result = await uploadResponse.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },

  // Upload image with compression
  uploadImageWithCompression: async (imageUri, quality = 0.8, maxWidth = 1080) => {
    try {
      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Upload compressed image
      return await cloudinaryService.uploadImageFromURI(manipulatedImage.uri);
    } catch (error) {
      console.error('Image compression/upload error:', error);
      throw error;
    }
  },

  // Pick image from gallery
  pickImageFromGallery: async (options = {}) => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        throw new Error('Permission to access camera roll is required!');
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 1,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      
      return null;
    } catch (error) {
      console.error('Image picker error:', error);
      throw error;
    }
  },

  // Take photo with camera
  takePhoto: async (options = {}) => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        throw new Error('Permission to access camera is required!');
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 1,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      
      return null;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  },

  // Upload profile image
  uploadProfileImage: async (imageUri, userId) => {
    try {
      const result = await cloudinaryService.uploadImageWithCompression(
        imageUri,
        0.8,
        400 // Profile images should be smaller
      );
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        path: `users/${userId}/profile`
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  },

  // Upload review image
  uploadReviewImage: async (imageUri, reviewId, index = 0) => {
    try {
      const result = await cloudinaryService.uploadImageWithCompression(
        imageUri,
        0.7,
        800 // Review images can be larger
      );
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        path: `reviews/${reviewId}/image_${index}`
      };
    } catch (error) {
      console.error('Review image upload error:', error);
      throw error;
    }
  },

  // Delete image from Cloudinary (using direct API)
  deleteImage: async (publicId) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await cloudinaryService.generateSignature('destroy', publicId, timestamp);
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('api_key', cloudinaryConfig.api_key);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Image deletion error:', error);
      throw error;
    }
  },

  // Generate signature for API calls
  generateSignature: async (action, publicId, timestamp) => {
    // For unsigned uploads, we don't need signatures
    // This is a placeholder for future signed operations
    return '';
  },

  // Get image URL with transformations (direct URL construction)
  getImageUrl: (publicId, transformations = {}) => {
    const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload`;
    const transformString = Object.entries(transformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    return `${baseUrl}/${transformString}/${publicId}`;
  },

  // Get optimized image URL for different sizes
  getOptimizedImageUrl: (publicId, width, height, quality = 'auto') => {
    const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload`;
    const transforms = [
      `w_${width}`,
      `h_${height}`,
      `q_${quality}`,
      'c_fill',
      'g_auto'
    ].join(',');
    
    return `${baseUrl}/${transforms}/${publicId}`;
  }
};

// Image picker options presets
export const imagePickerOptions = {
  profile: {
    aspect: [1, 1],
    quality: 0.8,
    allowsEditing: true
  },
  review: {
    aspect: [4, 3],
    quality: 0.7,
    allowsEditing: true
  },
  service: {
    aspect: [16, 9],
    quality: 0.8,
    allowsEditing: true
  }
};

export default cloudinaryService;
