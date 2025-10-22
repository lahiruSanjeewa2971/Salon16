#!/bin/bash

# Test script to verify zoom fix implementation
echo "🔍 Testing Zoom Fix Implementation..."
echo ""

# Check if custom HTML template exists
if [ -f "web/index.html" ]; then
    echo "✅ Custom HTML template found: web/index.html"
    
    # Check if viewport meta tag is properly configured
    if grep -q "user-scalable=no" web/index.html; then
        echo "✅ Viewport meta tag includes user-scalable=no"
    else
        echo "❌ Viewport meta tag missing user-scalable=no"
    fi
    
    if grep -q "maximum-scale=1" web/index.html; then
        echo "✅ Viewport meta tag includes maximum-scale=1"
    else
        echo "❌ Viewport meta tag missing maximum-scale=1"
    fi
    
    # Check if CSS zoom prevention is included
    if grep -q "font-size: 16px" web/index.html; then
        echo "✅ CSS includes 16px font-size for inputs"
    else
        echo "❌ CSS missing 16px font-size for inputs"
    fi
    
    if grep -q "touch-action: manipulation" web/index.html; then
        echo "✅ CSS includes touch-action: manipulation"
    else
        echo "❌ CSS missing touch-action: manipulation"
    fi
else
    echo "❌ Custom HTML template not found: web/index.html"
fi

echo ""

# Check if app.json includes custom template
if grep -q '"template": "./web/index.html"' app.json; then
    echo "✅ app.json configured to use custom HTML template"
else
    echo "❌ app.json not configured to use custom HTML template"
fi

echo ""

# Check LoginScreen updates
if grep -q "fontSize: Platform.OS === 'web' ? 16" app/LoginScreen.jsx; then
    echo "✅ LoginScreen includes web-specific font size"
else
    echo "❌ LoginScreen missing web-specific font size"
fi

if grep -q "transform: 'translateZ(0)'" app/LoginScreen.jsx; then
    echo "✅ LoginScreen includes hardware acceleration"
else
    echo "❌ LoginScreen missing hardware acceleration"
fi

echo ""

# Check RegisterScreen updates
if grep -q "fontSize: Platform.OS === 'web' ? 16" app/RegisterScreen.jsx; then
    echo "✅ RegisterScreen includes web-specific font size"
else
    echo "❌ RegisterScreen missing web-specific font size"
fi

echo ""
echo "🎯 Fix Implementation Summary:"
echo "1. Custom HTML template with proper viewport configuration"
echo "2. CSS rules to prevent zoom on input focus"
echo "3. Web-specific input styling in React Native components"
echo "4. Updated KeyboardAvoidingView behavior for web"
echo ""
echo "📱 To test the fix:"
echo "1. Run: npx expo export --platform web"
echo "2. Serve the dist folder locally or deploy to web"
echo "3. Open on mobile device and test input focus behavior"
echo "4. Verify that zoom no longer occurs when tapping input fields"
