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
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(req => console.log('Firebase Messaging SW registered:', req))
      .catch(err => console.warn('Firebase Messaging SW registration failed:', err));
  }
}
