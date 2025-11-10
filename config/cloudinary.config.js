// Cloudinary Configuration
const cloudinaryConfig = {
  cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
};

export default cloudinaryConfig;
