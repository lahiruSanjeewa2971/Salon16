import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { imagePickerOptions } from '../services/cloudinaryService';
import { imageService } from '../services/firebaseService';

export default function CloudinaryTest() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    try {
      setUploading(true);
      
      // Debug: Check if imagePickerOptions is available
      console.log('imagePickerOptions:', imagePickerOptions);
      console.log('imagePickerOptions.profile:', imagePickerOptions?.profile);
      
      // Safety check for imagePickerOptions
      if (!imagePickerOptions) {
        throw new Error('Image picker options not available');
      }
      
      // Pick image from gallery
      const imageAsset = await imageService.pickImage(imagePickerOptions?.profile || {});
      
      if (imageAsset) {
        // Upload to Cloudinary
        const result = await imageService.uploadProfileImage(imageAsset.uri, 'test-user-123');
        
        setUploadedImage(result);
        Alert.alert('Success', 'Image uploaded to Cloudinary!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const takeAndUploadPhoto = async () => {
    try {
      setUploading(true);
      
      // Debug: Check if imagePickerOptions is available
      console.log('imagePickerOptions:', imagePickerOptions);
      console.log('imagePickerOptions.profile:', imagePickerOptions?.profile);
      
      // Take photo with camera
      const imageAsset = await imageService.takePhoto(imagePickerOptions?.profile || {});
      
      if (imageAsset) {
        // Upload to Cloudinary
        const result = await imageService.uploadProfileImage(imageAsset.uri, 'test-user-123');
        
        setUploadedImage(result);
        Alert.alert('Success', 'Photo uploaded to Cloudinary!');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to take and upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cloudinary Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.status, { color: uploadedImage ? 'green' : 'orange' }]}>
          {uploading ? 'Uploading...' : uploadedImage ? 'Connected ✅' : 'Ready to test'}
        </Text>
      </View>

      {uploadedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Uploaded Image:</Text>
          <Image source={{ uri: uploadedImage.url }} style={styles.image} />
          <Text style={styles.imageUrl}>{uploadedImage.url}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, uploading && styles.buttonDisabled]} 
        onPress={pickAndUploadImage}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Pick & Upload Image'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, uploading && styles.buttonDisabled]} 
        onPress={takeAndUploadPhoto}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Take & Upload Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#666',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  imageUrl: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
