// Firebase Web Push configuration.
// Replace every value with the configuration of the Firebase project that
// actually hosts APS Negocios 2.5. Do not commit private service-account keys.
globalThis.APS_FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_FIREBASE_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

// Public Web Push certificate key from Firebase Cloud Messaging.
globalThis.APS_FIREBASE_VAPID_KEY = "REPLACE_WITH_FIREBASE_WEB_PUSH_CERTIFICATE_KEY_PAIR";

// Apps Script/web endpoint owned by APS Notificaciones Central.
// It must accept POST JSON and persist the token for channel aps_negocios_todos.
globalThis.APS_PUSH_REGISTER_URL = "REPLACE_WITH_APS_NOTIFICACIONES_CENTRAL_PUSH_REGISTER_URL";

