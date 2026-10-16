import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  onUnregistered,
  register,
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging.js";

const PUSH_UI_ID = "apsPushPermissionBanner";
const APP_VERSION = "APS-NEGOCIOS-2.5-PUSH-C7-2026.10.16";
let messaging = null;
let pushConfig = null;
let initialized = false;

async function getFirebaseConfig() {
  const response = await fetch("/__/firebase/init.json", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar la configuración Firebase.");
  return response.json();
}

async function getPushConfig() {
  const response = await fetch("/api/push-config", { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Push no está configurado.");
  return data;
}

function platformName() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS/iPadOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  return "Web";
}

async function postFid(url, fid) {
  if (!url || !fid) return;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fid,
      platform: platformName(),
      appVersion: APP_VERSION,
    }),
    keepalive: true,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo sincronizar la instalación.");
  }
}

async function waitForActive(registration) {
  if (registration.active) return registration;
  const worker = registration.installing || registration.waiting;
  if (!worker) return registration;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("El service worker no se activó a tiempo.")), 12000);
    const onState = () => {
      if (worker.state === "activated") {
        clearTimeout(timer);
        worker.removeEventListener("statechange", onState);
        resolve();
      } else if (worker.state === "redundant") {
        clearTimeout(timer);
        worker.removeEventListener("statechange", onState);
        reject(new Error("El service worker quedó redundante."));
      }
    };
    worker.addEventListener("statechange", onState);
    onState();
  });
  return registration;
}

async function findPushWorkerRegistration() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.find((r) => {
    const url = String(
      (r.active && r.active.scriptURL) ||
      (r.waiting && r.waiting.scriptURL) ||
      (r.installing && r.installing.scriptURL) ||
      ""
    );
    return url.includes("/push/firebase-messaging-sw.js");
  }) || null;
}

async function showForegroundNotification(payload) {
  if (Notification.permission !== "granted") return;
  const title = "APS Negocios";
  const body = "Tienes nueva actividad en Negocios 2.5.";
  const link = payload?.fcmOptions?.link || payload?.data?.link || "/";
  const registration = await findPushWorkerRegistration();
  if (!registration) return;
  await registration.showNotification(title, {
    body,
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    tag: payload?.data?.id || payload?.data?.tipo || "aps-negocios",
    renotify: true,
    data: { url: link, ...(payload?.data || {}) },
  });
}

function hidePermissionBanner() {
  document.getElementById(PUSH_UI_ID)?.remove();
}

function showPermissionBanner() {
  if (document.getElementById(PUSH_UI_ID) || Notification.permission !== "default") return;

  const box = document.createElement("div");
  box.id = PUSH_UI_ID;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Activar notificaciones APS");
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
      <div aria-hidden="true" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:#0ea5e9;color:#fff;font-size:18px">🔔</div>
      <div style="min-width:0">
        <div style="font-weight:900;font-size:13px;color:#0f172a">Activar notificaciones APS</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;line-height:1.35">Recibe avisos de actividad aunque la app esté cerrada. Los detalles respetan tus permisos dentro de Negocios 2.5.</div>
      </div>
    </div>
    <button id="apsPushEnableBtn" type="button" style="border:0;border-radius:12px;background:#0284c7;color:white;font-weight:900;font-size:11px;padding:10px 14px;cursor:pointer;white-space:nowrap">Activar</button>
  `;
  Object.assign(box.style, {
    position: "fixed",
    left: "12px",
    right: "12px",
    bottom: "calc(14px + env(safe-area-inset-bottom))",
    zIndex: "2147483000",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "620px",
    margin: "0 auto",
    padding: "12px",
    borderRadius: "18px",
    background: "rgba(255,255,255,.98)",
    border: "1px solid rgba(148,163,184,.35)",
    boxShadow: "0 18px 55px rgba(2,6,23,.32)",
    fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
  });
  document.body.appendChild(box);
  document.getElementById("apsPushEnableBtn")?.addEventListener("click", enableApsPush);
}

async function registerCurrentInstallation() {
  if (!messaging || !pushConfig) return false;
  const swPath = pushConfig.serviceWorkerScriptPath || "/push/firebase-messaging-sw.js";
  const swRegistration = await navigator.serviceWorker.register(swPath, { scope: "/push/" });
  await waitForActive(swRegistration);
  await register(messaging, {
    vapidKey: pushConfig.vapidPublicKey,
    serviceWorkerRegistration: swRegistration,
  });
  return true;
}

export async function enableApsPush() {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    hidePermissionBanner();
    await ensureApsPush();
    await registerCurrentInstallation();
    return true;
  } catch (error) {
    console.error("APS Push enable error", error);
    return false;
  }
}

export async function ensureApsPush() {
  if (initialized) return true;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  if (!(await isSupported())) return false;

  const [firebaseConfig, cfg] = await Promise.all([getFirebaseConfig(), getPushConfig()]);
  pushConfig = cfg;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  messaging = getMessaging(app);

  onRegistered(messaging, async (fid) => {
    try {
      await postFid(pushConfig.registerUrl || "/api/register-push", fid);
      window.dispatchEvent(new CustomEvent("aps-push-registered", { detail: { fid } }));
    } catch (error) {
      console.error("APS Push registration sync error", error);
    }
  });

  onUnregistered(messaging, async (fid) => {
    try {
      await postFid(pushConfig.unregisterUrl || "/api/unregister-push", fid);
    } catch (error) {
      console.error("APS Push unregister sync error", error);
    }
  });

  onMessage(messaging, async (payload) => {
    try {
      await showForegroundNotification(payload);
      window.dispatchEvent(new CustomEvent("aps-push-received", { detail: payload }));
    } catch (error) {
      console.error("APS foreground push error", error);
    }
  });

  initialized = true;

  if (Notification.permission === "granted") {
    await registerCurrentInstallation();
  } else if (Notification.permission === "default") {
    showPermissionBanner();
  }

  return true;
}

window.enableApsPush = enableApsPush;
window.ensureApsPush = ensureApsPush;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ensureApsPush().catch(console.error), { once: true });
} else {
  ensureApsPush().catch(console.error);
}

