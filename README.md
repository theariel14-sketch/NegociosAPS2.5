# APS Negocios 2.5

Base PWA para APS Negocios 2.5 con bandeja interna (`🔔`) y registro automático de notificaciones push mediante Firebase Cloud Messaging.

## Qué incluye

- PWA instalable con `manifest.json` y `icon.svg`.
- Registro automático del permiso y token FCM al abrir la app.
- `firebase-messaging-sw.js` para recibir avisos cuando la app está cerrada.
- Bandeja interna local que conserva los avisos recibidos y el botón `🔔`.
- Contrato de registro para APS Notificaciones Central con el canal `aps_negocios_todos`.

## Configuración obligatoria antes de publicar

No se inventaron credenciales. Edita `firebase-config.js` con los valores del proyecto Firebase real; ese mismo archivo es cargado por el service worker:

1. `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` y `appId` de Firebase Web.
2. `APS_FIREBASE_VAPID_KEY`, desde Firebase Console → Project settings → Cloud Messaging → Web Push certificates.
3. `APS_PUSH_REGISTER_URL`, endpoint de APS Notificaciones Central que reciba `POST` JSON.

El endpoint debe guardar o actualizar por token el registro recibido, al menos con:

```json
{
  "token": "...",
  "channel": "aps_negocios_todos",
  "app": "APS Negocios 2.5",
  "platform": "web",
  "url": "https://dominio-publicado.example"
}
```

Productividad, Carnets APS Pro, Visitas y Validar RNC deben enviar sus eventos al flujo de Notificaciones Central. El backend central debe usar Firebase Admin SDK (o su equivalente seguro) para enviar a los tokens registrados; la clave privada nunca debe ir en este repositorio ni en el navegador.

## Estado verificado

- El repositorio remoto conocido es `theariel14-sketch/NegociosAPS2.5`.
- La URL `negocios-aps-xyz.web.app` no pudo verificarse desde el entorno actual; no se asume que sea el proyecto Firebase correcto.
- La bandeja interna queda disponible aun sin Firebase configurado.

