
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in SW
// Does not need in import { initializeApp } from "firebase/app";
// because above importScripts already does that in the service worker context runtime.
firebase.initializeApp({
  apiKey:"AIzaSyBCMkeZWqgb20dRaFIN6phPvKrTlMNcHJE",
  authDomain:"salon16.firebaseapp.com",
  projectId:"salon16",
  messagingSenderId:"958917048495",
  appId:"1:958917048495:android:81dc8a28cf9ead58d3bc5a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title || "New Booking Notification";
    const notificationOptions = {
        body: payload.notification.body || 'You have a new booking today. Check the admin panel for details.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',

    }
    self.registration.showNotification(notificationTitle, notificationOptions);
})