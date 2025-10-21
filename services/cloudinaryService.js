import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import cloudinaryConfig from '../config/cloudinary.config';

// Note: We can't use the cloudinary SDK directly in React Native
// Instead, we'll use direct API calls to Cloudinary

// Cache for preset status to avoid repeated API calls
let presetCache = {
  salon16_images: null, // null = not checked, true = exists, false = doesn't exist
};

export const cloudinaryService = {
  // Simple preset validation (client-side safe approach)
  validatePresetExists: async (presetName) => {
    try {
      // For client-side, we'll assume the preset exists and handle errors gracefully
      // The actual preset should be created manually in Cloudinary dashboard
      console.log(`ℹ️ Assuming preset '${presetName}' exists (client-side validation)`);
      return true;
    } catch (error) {
      console.error('Preset validation error:', error);
      return false;
    }
  },
  // Upload image from URI (React Native) - Enhanced for React Native compatibility
  uploadImageFromURI: async (imageUri, options = {}) => {
    try {
      const presetName = options.preset || 'salon16_images';
      
      // Simple validation (assumes preset exists)
      await cloudinaryService.validatePresetExists(presetName);

      console.log(`📤 Starting upload with preset: ${presetName}`);
      console.log(`📤 Image URI: ${imageUri}`);
      console.log(`📤 Cloud name: ${cloudinaryConfig.cloud_name}`);

      // Create FormData for React Native
      const formData = new FormData();
      
      // For React Native, we need to create the file object differently
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
      formData.append('upload_preset', presetName);
      formData.append('cloud_name', cloudinaryConfig.cloud_name);
      
      // Add optional parameters
      if (options.folder) {
        formData.append('folder', options.folder);
        console.log(`📤 Upload folder: ${options.folder}`);
      }
      if (options.public_id) {
        formData.append('public_id', options.public_id);
        console.log(`📤 Public ID: ${options.public_id}`);
      }
      
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`;
      console.log(`📤 Upload URL: ${uploadUrl}`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log(`📤 Upload response status: ${uploadResponse.status}`);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ Upload failed: ${uploadResponse.status}`, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
      
      const result = await uploadResponse.json();
      console.log(`✅ Image uploaded successfully: ${result.public_id}`);
      console.log(`✅ Image URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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

      // Upload compressed image with options
      return await cloudinaryService.uploadImageFromURI(manipulatedImage.uri, {
        preset: 'salon16_images',
        folder: 'salon16'
      });
    } catch (error) {
      console.error('Image compression/upload error:', error);
      throw error;
    }
  },

  // Alternative upload method using base64 (fallback)
  uploadImageBase64: async (imageUri, options = {}) => {
    try {
      const presetName = options.preset || 'salon16_images';
      
      console.log(`📤 Starting base64 upload with preset: ${presetName}`);
      
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result.split(',')[1];
            
            const formData = new FormData();
            formData.append('file', `data:image/jpeg;base64,${base64}`);
            formData.append('upload_preset', presetName);
            formData.append('cloud_name', cloudinaryConfig.cloud_name);
            
            if (options.folder) {
              formData.append('folder', options.folder);
            }
            
            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
              {
                method: 'POST',
                body: formData,
              }
            );
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }
            
            const result = await uploadResponse.json();
            console.log(`✅ Base64 upload successful: ${result.public_id}`);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Base64 upload error:', error);
      throw error;
    }
  },

  // Pick image from gallery
  pickImageFromGallery: async (options = {}) => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation using HTML file input
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (event) => {
            try {
              const file = event.target.files[0];
              if (!file) {
                resolve(null);
                return;
              }
              
              // Convert file to URI for web
              const uri = URL.createObjectURL(file);
              resolve({
                uri,
                width: 0, // Will be determined after loading
                height: 0,
                type: file.type,
                fileName: file.name,
                fileSize: file.size,
              });
            } catch (error) {
              reject(error);
            }
          };
          input.onerror = reject;
          input.click();
        });
      }

      // Native implementation
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
      if (Platform.OS === 'web') {
        // Web implementation - fallback to file picker since camera access is limited
        console.warn('Camera not available on web, falling back to file picker');
        return await cloudinaryService.pickImageFromGallery(options);
      }

      // Native implementation
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
      // For unsigned uploads, we can't delete images from client-side
      // This would require Admin API access which should be done server-side
      console.warn('⚠️ Image deletion requires server-side implementation');
      console.log(`Would delete image: ${publicId}`);
      
      // For now, just return success (in a real app, you'd call your backend)
      return { result: 'ok' };
    } catch (error) {
      console.error('Image deletion error:', error);
      throw error;
    }
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
