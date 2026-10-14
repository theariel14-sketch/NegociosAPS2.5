/* global importScripts, firebase */
// Firebase Messaging service worker for background push notifications.
// Keep this file at the web root so /firebase-messaging-sw.js is reachable.
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

firebase.initializeApp(globalThis.APS_FIREBASE_CONFIG || {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_FIREBASE_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "APS Negocios";
  const options = {
    body: notification.body || data.body || "Tienes una nueva notificación.",
    icon: notification.icon || "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/index.html", ...data }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/index.html";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (client.url.includes(self.location.origin) && "focus" in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    return clients.openWindow(targetUrl);
  }));
});

