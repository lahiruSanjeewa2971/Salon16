# Cloudinary Setup Guide for Salon 16

## ✅ What's Configured

Since Firebase Storage requires a paid billing plan, we've set up Cloudinary as a free alternative for image storage and management.

### 1. Dependencies Installed
- `cloudinary` - Main Cloudinary SDK
- `expo-image-picker` - For picking images from gallery
- `expo-image-manipulator` - For image compression and resizing

### 2. Configuration Files
- `config/cloudinary.config.js` - Cloudinary configuration
- `services/cloudinaryService.js` - Cloudinary service functions
- `services/firebaseService.js` - Updated with image service
- `components/CloudinaryTest.jsx` - Test component

### 3. Environment Variables
Your `.env` file should contain:
```env
CLOUDINARY_CLOUD_NAME=dcnucuaj5
CLOUDINARY_API_KEY=451316218535215
CLOUDINARY_API_SECRET=phMyDVxGGnUfdUhPjgP29vSy2bw
```

## 🔧 Cloudinary Console Setup Required

### 1. Create Upload Preset
1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Navigate to **Settings** → **Upload**
3. Click **Add upload preset**
4. Name: `salon16_images`
5. Signing Mode: **Unsigned** (for client-side uploads)
6. Folder: `salon16/`
7. Click **Save**

### 2. Configure Security
1. Go to **Settings** → **Security**
2. Set **Allowed file types**: `jpg, jpeg, png, gif, webp`
3. Set **Max file size**: `10MB`
4. Enable **Auto-upload** if needed

### 3. Set Up Folders (Optional)
Create these folders in Cloudinary:
- `salon16/users/` - For profile images
- `salon16/reviews/` - For review images
- `salon16/services/` - For service images

## 🧪 Testing Cloudinary

### 1. Run the App
```bash
npm run android
# or
npm run ios
# or
npm run web
```

### 2. Test Image Upload
1. Open the app
2. Go to Home tab
3. Scroll to "Cloudinary Integration" section
4. Tap "Pick & Upload Image" to test gallery upload
5. Tap "Take & Upload Photo" to test camera upload

### 3. Verify Upload
1. Check Cloudinary Console → Media Library
2. Look for uploaded images in `salon16/` folder
3. Verify image transformations and optimization

## 📱 Features Available

### Image Picker Options
```javascript
// Profile images (1:1 aspect ratio)
imagePickerOptions.profile

// Review images (4:3 aspect ratio)
imagePickerOptions.review

// Service images (16:9 aspect ratio)
imagePickerOptions.service
```

### Image Service Functions
```javascript
import { imageService } from '../services/firebaseService';

// Pick image from gallery
const image = await imageService.pickImage(imagePickerOptions.profile);

// Take photo with camera
const photo = await imageService.takePhoto(imagePickerOptions.profile);

// Upload profile image
const result = await imageService.uploadProfileImage(imageUri, userId);

// Upload review image
const result = await imageService.uploadReviewImage(imageUri, reviewId, index);

// Get optimized image URL
const url = imageService.getOptimizedImageUrl(publicId, width, height);
```

## 🎨 Image Transformations

Cloudinary automatically provides:
- **Auto-optimization** - Best format and quality
- **Responsive images** - Different sizes for different devices
- **Auto-cropping** - Smart cropping with face detection
- **Format conversion** - Automatic WebP/AVIF for supported browsers

### Example Transformations
```javascript
// Get thumbnail (100x100)
const thumbnail = imageService.getOptimizedImageUrl(publicId, 100, 100);

// Get medium size (400x400)
const medium = imageService.getOptimizedImageUrl(publicId, 400, 400);

// Get large size (800x600)
const large = imageService.getOptimizedImageUrl(publicId, 800, 600);
```

## 🔒 Security Considerations

### 1. Upload Preset Security
- Use **unsigned** presets for client-side uploads
- Set file type restrictions
- Set size limits
- Use folder organization

### 2. API Key Security
- Never expose API secret in client code
- Use environment variables
- Consider server-side uploads for sensitive images

### 3. Image Validation
- Validate file types on client side
- Check file sizes before upload
- Implement proper error handling

## 💰 Pricing & Limits

### Free Tier
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Uploads**: 1,000/month

### For Salon 16
- Profile images: ~50KB each
- Review images: ~200KB each
- Service images: ~500KB each
- Estimated usage: Well within free tier limits

## 🚀 Production Considerations

### 1. Image Optimization
- Use appropriate compression levels
- Implement lazy loading
- Use responsive images
- Consider WebP format

### 2. Error Handling
- Handle upload failures gracefully
- Implement retry logic
- Show progress indicators
- Provide user feedback

### 3. Performance
- Compress images before upload
- Use appropriate image sizes
- Implement caching strategies
- Monitor bandwidth usage

## 🔍 Troubleshooting

### Common Issues

1. **"Upload preset not found"**
   - Check if preset exists in Cloudinary Console
   - Verify preset name matches configuration
   - Ensure preset is set to "Unsigned"

2. **"Permission denied"**
   - Check API key and secret
   - Verify environment variables
   - Check Cloudinary account status

3. **"Image too large"**
   - Implement compression before upload
   - Check file size limits
   - Use appropriate quality settings

4. **"Network error"**
   - Check internet connection
   - Verify Cloudinary service status
   - Implement retry logic

### Debug Tips
- Check console logs for detailed errors
- Use Cloudinary Console to monitor uploads
- Test with small images first
- Verify environment variables

## ✅ Verification Checklist

- [ ] Cloudinary account created
- [ ] Upload preset `salon16_images` created
- [ ] Environment variables configured
- [ ] App builds and runs successfully
- [ ] Image picker works (gallery)
- [ ] Camera works (photo capture)
- [ ] Images upload to Cloudinary
- [ ] Images appear in Cloudinary Console
- [ ] Image transformations work
- [ ] Error handling works

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Cloudinary React Native Guide](https://cloudinary.com/documentation/react_native_integration)

---

*Cloudinary is now fully configured for Salon 16! You can start implementing image upload features for profiles, reviews, and services.*
