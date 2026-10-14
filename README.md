# Negocios APS — PWA instalable

Esta PWA envuelve la Web App actual de Google Apps Script; no reemplaza el sistema existente. La URL configurada en `public/index.html` es la indicada en `URL_ACTUAL.txt`.

## Incluye

- Instalación como PWA en Android, iPhone y iPad.
- Portal Apps Script dentro de un iframe con permisos de cámara, micrófono, geolocalización y portapapeles.
- Splash, instalación guiada e iconos reales de Negocios APS.
- Service worker para cachear el shell local sin interceptar Apps Script.
- Registro automático de push FCM en el canal `aps_negocios_todos`, cuando se hayan configurado Firebase, VAPID y el endpoint de Notificaciones Central.

## Antes de publicar

1. En Apps Script agrega `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` a la cadena que devuelve `doGet()` y crea una nueva versión del deployment. Ver `APPS_SCRIPT_CAMBIO.txt`.
2. Sustituye los placeholders de `public/firebase-config.js` por la configuración Web del proyecto Firebase real, la clave VAPID y el endpoint `APS_PUSH_REGISTER_URL`.
3. El endpoint central debe guardar/actualizar el token recibido con `channel: "aps_negocios_todos"` y enviar desde backend usando Firebase Admin SDK. Nunca pongas una clave privada en esta PWA.
4. Publica con Firebase Hosting usando `firebase.json`.

## Verificación

La URL de Apps Script fue aportada en `URL_ACTUAL.txt`. No se asume una URL `*.web.app` ni un proyecto Firebase concreto hasta confirmar el proyecto en Firebase Console.

Prueba después del despliegue: inicio de sesión, Productividad, Carnetización, Visitas, cámara/escáner, archivos, PDF, impresión, descargas, navegación y permiso push. La bandeja interna y su botón `🔔` pertenecen al portal embebido y se conservan.

