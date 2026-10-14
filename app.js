/* global firebase, APS_FIREBASE_CONFIG, APS_FIREBASE_VAPID_KEY, APS_PUSH_REGISTER_URL */
const CONFIG_PLACEHOLDER = "REPLACE_WITH_";
const CHANNEL = "aps_negocios_todos";
const notifications = JSON.parse(localStorage.getItem("aps_notifications") || "[]");

const $ = (selector) => document.querySelector(selector);
const isConfigured = () => {
  const values = [
    APS_FIREBASE_CONFIG.apiKey,
    APS_FIREBASE_CONFIG.projectId,
    APS_FIREBASE_CONFIG.messagingSenderId,
    APS_FIREBASE_CONFIG.appId,
    APS_FIREBASE_VAPID_KEY,
    APS_PUSH_REGISTER_URL
  ];
  return values.every((value) => value && !value.includes(CONFIG_PLACEHOLDER));
};

function renderNotifications() {
  const list = $("#notification-list");
  list.innerHTML = "";
  if (!notifications.length) {
    list.innerHTML = '<p class="empty">No tienes notificaciones nuevas.</p>';
  } else {
    notifications.slice().reverse().forEach((item) => {
      const row = document.createElement("article");
      row.className = "notification-item";
      row.innerHTML = `<strong>${escapeHtml(item.title || "APS Negocios")}</strong><p>${escapeHtml(item.body || "")}</p>`;
      list.appendChild(row);
    });
  }
  $("#notification-count").textContent = notifications.length ? String(notifications.length) : "";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function addNotification(payload) {
  const data = payload.data || payload.notification || payload;
  notifications.push({ title: data.title, body: data.body, receivedAt: new Date().toISOString() });
  localStorage.setItem("aps_notifications", JSON.stringify(notifications.slice(-50)));
  renderNotifications();
}

async function registerPush() {
  if (!isConfigured()) {
    $("#push-status").textContent = "Push pendiente de configuración de Firebase y Notificaciones Central.";
    return;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    $("#push-status").textContent = "Este navegador no permite notificaciones push.";
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      $("#push-status").textContent = "Las notificaciones están desactivadas en este dispositivo.";
      return;
    }
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    firebase.initializeApp(APS_FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey: APS_FIREBASE_VAPID_KEY, serviceWorkerRegistration: await navigator.serviceWorker.ready });
    if (!token) throw new Error("FCM no devolvió un token");
    const response = await fetch(APS_PUSH_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, channel: CHANNEL, app: "APS Negocios 2.5", platform: "web", url: location.origin, registeredAt: new Date().toISOString() })
    });
    if (!response.ok) throw new Error(`Registro central rechazado (${response.status})`);
    messaging.onMessage(addNotification);
    $("#push-status").textContent = "Notificaciones activadas automáticamente.";
  } catch (error) {
    console.error(error);
    $("#push-status").textContent = "No se pudo activar el push todavía; la bandeja interna sigue disponible.";
  }
}

$("#notification-button").addEventListener("click", () => $("#notification-panel").classList.toggle("open"));
$("#enable-push").addEventListener("click", registerPush);
renderNotifications();
registerPush();

