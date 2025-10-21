#!/bin/bash
# Post-build script to add PWA files to dist folder

echo "🔧 Adding PWA files to dist folder..."

# Copy service worker files
cp public/sw.js dist/
cp public/sw-register.js dist/

# Update index.html to include service worker registration
echo "📝 Updating index.html with service worker registration..."

# Create a temporary file with the service worker script
cat > temp_sw_script.js << 'EOF'
// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
EOF

# Insert the service worker script into index.html
sed -i 's|</head>|<script src="/sw-register.js"></script></head>|g' dist/index.html

# Clean up
rm temp_sw_script.js

echo "✅ PWA files added successfully!"
