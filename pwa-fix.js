// Manual PWA fix - Add this to your app's entry point
// This will register the service worker directly in the app

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Register service worker
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}
