# Push automático · APS Negocios 2.5

Esta corrección usa el flujo FID recomendado actualmente por Firebase Cloud Messaging para Web: `register()` + `onRegistered()`. No existe formulario ni registro manual de teléfonos.

## Lo único que el usuario hace

La primera vez que la PWA puede recibir notificaciones aparece **Activar notificaciones APS**. Al tocarlo, el sistema operativo solicita permiso. Si acepta, Firebase registra automáticamente esa instalación y renueva el FID cuando corresponda.

## Configuración obligatoria antes de desplegar

1. En Firebase Console > Project settings > Cloud Messaging > Web Push certificates, generar/copiar la clave VAPID pública.
2. Configurar en Functions el parámetro `WEB_PUSH_VAPID_PUBLIC_KEY`.
3. Crear un secreto fuerte distinto de cualquier secreto usado anteriormente y guardarlo como `PUSH_SHARED_SECRET` en Firebase Functions.
4. En Apps Script > APS Notificaciones Central ejecutar una vez:

```javascript
configurarPushBroadcastAutomatico('PEGA_AQUI_EL_NUEVO_SECRETO');
```

No guardar ese secreto en GitHub ni en HTML.

5. Fusionar `firebase.rewrites.snippet.json` con el `firebase.json` existente. No reemplazar a ciegas la configuración actual de Hosting.
6. Copiar `hosting/push/notifications.js` y `hosting/push/firebase-messaging-sw.js` al directorio público que despliega Firebase Hosting.
7. Añadir el contenido de `INDEX_SNIPPET.html` al index REAL de Firebase Hosting.
8. Desplegar Functions + Hosting en una versión de prueba.

## Privacidad

El broadcast llega a todas las instalaciones autorizadas, pero el texto visible es genérico. Los nombres, empresas y demás detalles continúan mostrándose únicamente dentro de Notificaciones Central, donde se aplican los permisos del usuario.

