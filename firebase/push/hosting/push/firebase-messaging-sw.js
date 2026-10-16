/* APS Negocios 2.5 · worker de push independiente.
 * Scope: /push/ para no reemplazar el service worker principal de la PWA.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }

  const data = payload.data || {};
  const link =
    (payload.fcmOptions && payload.fcmOptions.link) ||
    (payload.webpush && payload.webpush.fcmOptions && payload.webpush.fcmOptions.link) ||
    data.link ||
    "/";

  const options = {
    body: "Tienes nueva actividad en Negocios 2.5.",
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    tag: data.id || data.tipo || "aps-negocios",
    renotify: true,
    data: { ...data, url: link },
  };

  event.waitUntil(self.registration.showNotification("APS Negocios", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = String((event.notification.data && event.notification.data.url) || "/");

  event.waitUntil((async () => {
    const absoluteTarget = new URL(target, self.location.origin).href;
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windows) {
      if (!client.url.startsWith(self.location.origin)) continue;
      try {
        if ("navigate" in client && client.url !== absoluteTarget) {
          await client.navigate(absoluteTarget);
        }
        await client.focus();
        return;
      } catch (_) {}
    }

    if (clients.openWindow) await clients.openWindow(absoluteTarget);
  })());
});

