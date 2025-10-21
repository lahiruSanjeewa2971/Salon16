// Cloudinary Configuration
// Using environment variables with fallback to hardcoded values
const cloudinaryConfig = {
  cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcnucuaj5',
  api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '451316218535215',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'phMyDVxGGnUfdUhPjgP29vSy2bw',
  secure: true
};

export default cloudinaryConfig;
