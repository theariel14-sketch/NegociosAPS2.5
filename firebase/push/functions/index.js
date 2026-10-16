"use strict";

const crypto = require("node:crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const PUSH_SHARED_SECRET = defineSecret("PUSH_SHARED_SECRET");
const WEB_PUSH_VAPID_PUBLIC_KEY = defineString("WEB_PUSH_VAPID_PUBLIC_KEY", { default: "" });
const APS_SITE_URL = defineString("APS_SITE_URL", {
  default: "https://negocios-aps-xyz.web.app/",
});

const COLLECTION = "pushInstallations";
const MAX_MULTICAST = 500;
const ACTIVE_DAYS = 180;
const ALLOWED_ORIGINS = new Set([
  "https://negocios-aps-xyz.web.app",
  "https://negocios-aps-xyz.firebaseapp.com",
]);

function json(res, status, body) {
  res.status(status).set("Cache-Control", "no-store").json(body);
}

function cors(req, res) {
  const origin = String(req.headers.origin || "");
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type,X-APS-Push-Secret");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

function cleanString(value, max = 1000) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function safeSecretEqual(received, expected) {
  const a = Buffer.from(cleanString(received, 500));
  const b = Buffer.from(cleanString(expected, 500));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function chunks(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function safeSiteLink(raw) {
  const fallback = APS_SITE_URL.value();
  try {
    const url = new URL(cleanString(raw || fallback, 1000), fallback);
    if (!ALLOWED_ORIGINS.has(url.origin)) return fallback;
    return url.href;
  } catch (_) {
    return fallback;
  }
}

function invalidRegistrationCode(code) {
  const value = String(code || "").toLowerCase();
  return (
    value.includes("registration-token-not-registered") ||
    value.includes("invalid-registration-token") ||
    value.includes("invalid-argument") ||
    value.includes("unregistered") ||
    value.includes("invalid-fid") ||
    value.includes("not-found")
  );
}

/**
 * Registro AUTOMÁTICO de la instalación. El cliente envía el FID emitido
 * por el SDK de FCM; el usuario nunca escribe ni administra este dato.
 */
exports.registerPushInstallation = onRequest(
  { region: "us-central1", cors: false, maxInstances: 10 },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST requerido" });

    try {
      const fid = cleanString(req.body && req.body.fid, 500);
      if (!fid || fid.length < 8) {
        return json(res, 400, { ok: false, error: "FID inválido" });
      }

      const id = sha256(fid);
      const ref = db.collection(COLLECTION).doc(id);
      const previous = await ref.get();

      const payload = {
        fid,
        active: true,
        lastSeen: FieldValue.serverTimestamp(),
        permission: "granted",
        platform: cleanString(req.body && req.body.platform, 80),
        appVersion: cleanString(req.body && req.body.appVersion, 80),
        userAgent: cleanString(req.headers["user-agent"], 500),
        origin: cleanString(req.headers.origin, 200),
      };

      if (!previous.exists) payload.createdAt = FieldValue.serverTimestamp();
      await ref.set(payload, { merge: true });
      return json(res, 200, { ok: true });
    } catch (error) {
      console.error("registerPushInstallation", error);
      return json(res, 500, { ok: false, error: "No fue posible registrar la instalación" });
    }
  }
);

exports.unregisterPushInstallation = onRequest(
  { region: "us-central1", cors: false, maxInstances: 10 },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST requerido" });

    try {
      const fid = cleanString(req.body && req.body.fid, 500);
      if (!fid || fid.length < 8) {
        return json(res, 400, { ok: false, error: "FID inválido" });
      }
      await db.collection(COLLECTION).doc(sha256(fid)).set({
        active: false,
        deactivatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return json(res, 200, { ok: true });
    } catch (error) {
      console.error("unregisterPushInstallation", error);
      return json(res, 500, { ok: false, error: "No fue posible desregistrar la instalación" });
    }
  }
);

/** Configuración pública: la VAPID pública no es un secreto. */
exports.pushConfig = onRequest(
  { region: "us-central1", cors: false, maxInstances: 5 },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "GET") return json(res, 405, { ok: false, error: "GET requerido" });

    const vapidPublicKey = cleanString(WEB_PUSH_VAPID_PUBLIC_KEY.value(), 1000);
    if (!vapidPublicKey) {
      return json(res, 503, { ok: false, error: "WEB_PUSH_VAPID_PUBLIC_KEY no está configurada" });
    }

    return json(res, 200, {
      ok: true,
      vapidPublicKey,
      serviceWorkerScriptPath: "/push/firebase-messaging-sw.js",
      registerUrl: "/api/register-push",
      unregisterUrl: "/api/unregister-push",
      siteUrl: APS_SITE_URL.value(),
    });
  }
);

/**
 * Broadcast a TODAS las instalaciones activas. Por privacidad, el texto
 * visible es deliberadamente genérico; los detalles se consultan dentro de
 * Notificaciones Central, donde sí se aplican roles/gerencias.
 */
exports.pushBroadcast = onRequest(
  {
    region: "us-central1",
    cors: false,
    maxInstances: 10,
    secrets: [PUSH_SHARED_SECRET],
  },
  async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST requerido" });

    const receivedSecret = (req.body && req.body.secret) || req.headers["x-aps-push-secret"];
    if (!safeSecretEqual(receivedSecret, PUSH_SHARED_SECRET.value())) {
      return json(res, 403, { ok: false, error: "No autorizado" });
    }

    try {
      const dataIn = (req.body && req.body.data) || {};
      const link = safeSiteLink((req.body && req.body.link) || APS_SITE_URL.value());
      const data = {
        id: cleanString(dataIn.id, 300),
        fuente: cleanString(dataIn.fuente, 80),
        tipo: cleanString(dataIn.tipo, 120),
        link,
        title: "APS Negocios",
        body: "Tienes nueva actividad en Negocios 2.5.",
      };

      const snap = await db.collection(COLLECTION).where("active", "==", true).get();
      const cutoff = Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000;
      const docs = snap.docs.filter((doc) => {
        const value = doc.data() || {};
        const lastSeen = value.lastSeen && typeof value.lastSeen.toMillis === "function"
          ? value.lastSeen.toMillis()
          : Date.now();
        return Boolean(value.fid) && lastSeen >= cutoff;
      });

      if (!docs.length) {
        return json(res, 200, { ok: true, recipients: 0, success: 0, failure: 0 });
      }

      let success = 0;
      let failure = 0;
      const deactivate = [];

      for (const group of chunks(docs, MAX_MULTICAST)) {
        const fids = group.map((doc) => cleanString(doc.data().fid, 500));
        const result = await messaging.sendEachForMulticast({
          fids,
          data,
          webpush: {
            fcmOptions: { link },
            notification: {
              title: data.title,
              body: data.body,
              icon: "/icon-512.png",
              badge: "/icon-512.png",
              tag: data.id || data.tipo || "aps-negocios",
              renotify: true,
            },
          },
        });

        success += result.successCount;
        failure += result.failureCount;

        result.responses.forEach((response, index) => {
          if (response.success) return;
          const code = response.error && response.error.code;
          console.warn("FCM delivery failed", code, response.error && response.error.message);
          if (invalidRegistrationCode(code)) deactivate.push(group[index].ref);
        });
      }

      if (deactivate.length) {
        const batch = db.batch();
        deactivate.forEach((ref) => batch.set(ref, {
          active: false,
          deactivatedAt: FieldValue.serverTimestamp(),
        }, { merge: true }));
        await batch.commit();
      }

      return json(res, 200, {
        ok: true,
        recipients: docs.length,
        success,
        failure,
        deactivated: deactivate.length,
      });
    } catch (error) {
      console.error("pushBroadcast", error);
      return json(res, 500, { ok: false, error: "Error interno de broadcast" });
    }
  }
);

exports.pushHealth = onRequest(
  {
    region: "us-central1",
    cors: false,
    maxInstances: 3,
    secrets: [PUSH_SHARED_SECRET],
  },
  async (req, res) => {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "POST requerido" });
    const receivedSecret = (req.body && req.body.secret) || req.headers["x-aps-push-secret"];
    if (!safeSecretEqual(receivedSecret, PUSH_SHARED_SECRET.value())) {
      return json(res, 403, { ok: false, error: "No autorizado" });
    }
    const snap = await db.collection(COLLECTION).where("active", "==", true).get();
    return json(res, 200, { ok: true, activeInstallations: snap.size });
  }
);

