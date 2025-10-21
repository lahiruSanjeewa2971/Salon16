#!/usr/bin/env node

/**
 * Post-build script to inject PWA manifest link and responsive CSS into index.html
 * This fixes Expo SDK 53's limitation where manifest.json isn't automatically linked
 * and adds comprehensive PWA responsive fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting PWA manifest injection and responsive CSS fixes...');

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
  } else {
    // Inject manifest link and PWA meta tags before </head>
    const manifestLink = '<link rel="manifest" href="/manifest.json" />';
    const appleTouchIcon = '<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />';
    const appleMetaTags = `
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Salon16" />`;
    
    // Replace </head> with manifest link + </head>
    html = html.replace('</head>', `${manifestLink}${appleTouchIcon}${appleMetaTags}</head>`);
    console.log('✅ PWA manifest link and Apple meta tags injected!');
  }
  
  // Inject comprehensive PWA responsive CSS
  const pwaResponsiveCSS = `
<style id="pwa-responsive-fixes">
/* PWA Responsive Fixes - Comprehensive Solution */
* {
  box-sizing: border-box;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  position: relative;
}

/* Root container fixes */
#root {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Safe area handling for PWA */
#root {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Full-width container enforcement */
.css-g5y9jx {
  width: 100% !important;
  max-width: 100vw !important;
}

/* Fix for React Native Web containers */
.css-g5y9jx.r-13awgt0 {
  width: 100% !important;
  min-height: 100vh !important;
}

/* Mobile-specific responsive fixes */
@media screen and (max-width: 480px) {
  .css-g5y9jx {
    width: 100vw !important;
    margin: 0 !important;
    padding-left: max(16px, env(safe-area-inset-left, 0px)) !important;
    padding-right: max(16px, env(safe-area-inset-right, 0px)) !important;
  }
  
  /* Fix for WelcomeScreen shrinking */
  .mainContent {
    width: 100% !important;
    max-width: 100vw !important;
    padding-left: max(16px, env(safe-area-inset-left, 0px)) !important;
    padding-right: max(16px, env(safe-area-inset-right, 0px)) !important;
  }
  
  .contentContainer {
    width: 100% !important;
    max-width: 100vw !important;
  }
  
  .cardsContainer {
    width: 100% !important;
    max-width: 100vw !important;
  }
  
  .featureCard {
    width: 100% !important;
    max-width: calc(100vw - 32px) !important;
  }
  
  .buttonsContainer {
    width: 100% !important;
    max-width: 100vw !important;
  }
}

/* Tablet responsive fixes */
@media screen and (min-width: 481px) and (max-width: 768px) {
  .css-g5y9jx {
    width: 100% !important;
    max-width: 100vw !important;
  }
}

/* Desktop responsive fixes */
@media screen and (min-width: 769px) {
  .css-g5y9jx {
    width: 100% !important;
    max-width: 100vw !important;
  }
}

/* Fix for status bar area */
.status-bar-fix {
  height: calc(44px + env(safe-area-inset-top, 0px));
  background: #6C2A52;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* Ensure all containers use full width */
.container, .main-container, .screen-container {
  width: 100% !important;
  max-width: 100vw !important;
}

/* Fix for gradient backgrounds */
.gradient-background {
  width: 100vw !important;
  height: 100vh !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: -1 !important;
}

/* Fix for decorative elements */
.decorative-element {
  pointer-events: none !important;
  z-index: 1 !important;
}

/* Fix for scrollable content */
.scrollable-content {
  width: 100% !important;
  max-width: 100vw !important;
  overflow-x: hidden !important;
}

/* Fix for floating elements */
.floating-element {
  position: fixed !important;
  z-index: 1000 !important;
}

/* PWA-specific fixes */
@media (display-mode: standalone) {
  body {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  
  #root {
    min-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  }
}

/* iOS Safari specific fixes */
@supports (-webkit-touch-callout: none) {
  .ios-fix {
    -webkit-overflow-scrolling: touch;
    -webkit-transform: translateZ(0);
  }
}

/* Android Chrome specific fixes */
@supports not (-webkit-touch-callout: none) {
  .android-fix {
    transform: translateZ(0);
  }
}
</style>`;

  // Inject CSS before </head>
  html = html.replace('</head>', `${pwaResponsiveCSS}</head>`);
  console.log('✅ PWA responsive CSS injected successfully!');
  
  // Write the modified HTML back
  fs.writeFileSync(htmlPath, html);
  
  console.log('✅ PWA fixes applied successfully!');
  console.log('✅ Manifest link: ✓');
  console.log('✅ Apple meta tags: ✓');
  console.log('✅ Responsive CSS: ✓');
  console.log('✅ Safe area handling: ✓');
  console.log('✅ Mobile viewport fixes: ✓');
  
  // Verify the injection
  const updatedHtml = fs.readFileSync(htmlPath, 'utf8');
  if (updatedHtml.includes('<link rel="manifest" href="/manifest.json" />') && 
      updatedHtml.includes('PWA Responsive Fixes')) {
    console.log('✅ Verification: All fixes found in updated HTML');
  } else {
    console.error('❌ Verification failed: Some fixes not found');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error applying PWA fixes:', error.message);
  process.exit(1);
}

console.log('🎉 PWA responsive fixes completed successfully!');
