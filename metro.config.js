const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable network requests that might cause "Body is unusable" errors
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
