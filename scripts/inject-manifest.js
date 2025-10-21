#!/usr/bin/env node

/**
 * Post-build script to inject PWA manifest link into index.html
 * This fixes Expo SDK 53's limitation where manifest.json isn't automatically linked
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting PWA manifest injection...');

// Paths
const distPath = path.join(__dirname, '../dist');
const htmlPath = path.join(distPath, 'index.html');
const manifestPath = path.join(distPath, 'manifest.json');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist directory not found. Run "npx expo export --platform web" first.');
  process.exit(1);
}

// Check if manifest.json exists
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: manifest.json not found in dist directory.');
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(htmlPath)) {
  console.error('❌ Error: index.html not found in dist directory.');
  process.exit(1);
}

try {
  // Read the HTML file
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Check if manifest link already exists
  if (html.includes('<link rel="manifest" href="/manifest.json" />')) {
    console.log('✅ Manifest link already exists in index.html');
    process.exit(0);
  }
  
  // Inject manifest link before </head>
  const manifestLink = '<link rel="manifest" href="/manifest.json" />';
  const appleTouchIcon = '<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />';
  const appleMetaTags = `
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Salon16" />`;
  
  // Replace </head> with manifest link + </head>
  html = html.replace('</head>', `${manifestLink}${appleTouchIcon}${appleMetaTags}</head>`);
  
  // Write the modified HTML back
  fs.writeFileSync(htmlPath, html);
  
  console.log('✅ PWA manifest link injected successfully!');
  console.log('✅ Apple touch icon link added!');
  console.log('✅ Apple meta tags added!');
  
  // Verify the injection
  const updatedHtml = fs.readFileSync(htmlPath, 'utf8');
  if (updatedHtml.includes('<link rel="manifest" href="/manifest.json" />')) {
    console.log('✅ Verification: Manifest link found in updated HTML');
  } else {
    console.error('❌ Verification failed: Manifest link not found');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error injecting manifest:', error.message);
  process.exit(1);
}

console.log('🎉 PWA manifest injection completed successfully!');
