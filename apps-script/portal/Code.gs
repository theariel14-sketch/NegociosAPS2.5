/**

 * APS NEGOCIOS 2.5 · PRODUCTIVIDAD + VISITAS + ADMINISTRACIÓN CENTRAL

 * El Portal contiene Productividad, Visitas y Carnetización.

 * Administración gestiona personal, contraseñas y permisos centrales.

 */

const NEGOCIOS25 = Object.freeze({
  VERSION: 'APS-NEGOCIOS-2.5-CORREGIDO-C7-2026.10.16',

  AUTH_WEBAPP_URL:
    'https://script.google.com/macros/s/AKfycbxV3ms4ylr5vPd-UCR22hJ0ZhKxtjOE4tdcOcELdoIK9O33PxbSxkX6oCMSh_EkTUNEGw/exec',

  PRODUCTIVIDAD_URL:
    'https://script.google.com/macros/s/AKfycbzLpLGZXGrthMgBzV_jZjlBPvULkAuOyiTw4pGoKjOML-VZscvw22-Kq0A_2s1PVK7DPw/exec',

  VISITAS_URL:
    'https://script.google.com/macros/s/AKfycbzA8Qpia9_GC0KJlLSdsokA_SMqTXFDTAZZEYYo0ZABfIyvIoSC1oqjGQ-nJsWFMbPG/exec',

  CARNETIZACION_URL:
    'https://script.google.com/macros/s/AKfycbyBJwGvyY0dwpQ6nPIpdxMwX45nMY17xtYQB4vV1WDZJQqhfnjCkYl5TS2ISBuN-6gxfw/exec',

  NOTIFICACIONES_URL:
    'https://script.google.com/macros/s/AKfycbwH88AWp9didjS7gJ_ATnth5i6f0jlVYaYBslL1lM0kRuS0zUwjpilXC5MR1kG5zV6B/exec'
});

function doGet(e) {
  const herramientaId = String(
    (e && e.parameter && e.parameter.herramienta) || ''
  ).trim();

  if (herramientaId) {
    // Se conserva el comportamiento actual del portal.
    // Las herramientas internas continúan resolviéndose desde Index.
  }

  const t = HtmlService.createTemplateFromFile('Index');

  t.portalUrl = ScriptApp.getService().getUrl();
  t.productividadUrl = NEGOCIOS25.PRODUCTIVIDAD_URL;
  t.visitasUrl = NEGOCIOS25.VISITAS_URL;
  t.carnetizacionUrl = NEGOCIOS25.CARNETIZACION_URL;
  t.notificacionesUrl = NEGOCIOS25.NOTIFICACIONES_URL;
  t.herramientasJson = JSON.stringify(
    obtenerHerramientasPortal_(t.portalUrl)
  );

  return t.evaluate()
    .setTitle('APS Negocios 2.5')
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1, viewport-fit=cover'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Lanza módulos únicamente después de validar sesión y permisos
 * en APS AUTH CENTRAL. El control visual del frontend no sustituye
 * esta comprobación de servidor.
 */
function obtenerUrlModuloSeguro_(token, moduleId, baseUrl, extraQuery) {
  try {
    var t = String(token || '').trim();
    var module = String(moduleId || '').trim().toUpperCase();
    var url = String(baseUrl || '').trim();

    if (!t) {
      return {ok:false, message:'Tu sesión ha vencido. Inicia sesión nuevamente.'};
    }

    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/i.test(url)) {
      return {ok:false, message:'La URL del módulo no está configurada correctamente.'};
    }

    var valid = authPost_({action:'validate', token:t, moduleId:module});
    if (!valid || !valid.ok) {
      return {
        ok:false,
        message:(valid && valid.message)
          ? valid.message
          : 'No tienes permiso para acceder a este módulo.'
      };
    }

    var parts = [
      'aps_token=' + encodeURIComponent(t),
      'portal_launch=' + Date.now()
    ];

    if (extraQuery) parts.push(String(extraQuery).replace(/^[?&]+/, ''));

    return {ok:true, url:url + '?' + parts.join('&')};
  } catch (e) {
    return {ok:false, message:e && e.message ? e.message : String(e)};
  }
}

function obtenerUrlProductividadGAS(token) {
  return obtenerUrlModuloSeguro_(token, 'PRODUCCION', NEGOCIOS25.PRODUCTIVIDAD_URL, '');
}

function obtenerUrlVisitasGAS(token) {
  return obtenerUrlModuloSeguro_(token, 'VISITAS', NEGOCIOS25.VISITAS_URL, '');
}

function obtenerUrlCarnetizacionGAS(token) {
  return obtenerUrlModuloSeguro_(token, 'CARNETS', NEGOCIOS25.CARNETIZACION_URL, 'authuser=0');
}

/**
 * Devuelve la URL del módulo de Notificaciones con el token central.
 * Debe ser función GLOBAL para que google.script.run pueda invocarla.
 */
function obtenerUrlNotificacionesGAS(token) {
  try {
    var t = String(token || '').trim();

    if (!t) {
      return {
        ok: false,
        message: 'Inicia sesión nuevamente.'
      };
    }

    var r = authPost_({
      action: 'validate',
      token: t,
      moduleId: 'PORTAL'
    });

    if (!r || !r.ok) {
      return {
        ok: false,
        message:
          (r && r.message)
            ? r.message
            : 'La sesión no es válida.'
      };
    }

    return {
      ok: true,
      url:
        NEGOCIOS25.NOTIFICACIONES_URL +
        '?aps_token=' +
        encodeURIComponent(t)
    };

  } catch (e) {
    return {
      ok: false,
      message:
        e && e.message
          ? e.message
          : String(e)
    };
  }
}

/* Sesión central */

function negociosLoginGAS(cedula, password, device) {

  try {

    const r = authPost_({action:'login',cedula:String(cedula||''),password:String(password||''),device:String(device||'NEGOCIOS 2.5')});

    return r && r.ok

      ? {

          ok:true,

          token:r.token,

          expiresAt:r.expiresAt||'',

          requireChange:!!r.requireChange,

          requirePhoto:!!r.requirePhoto,

          user:r.user||{},

          modules:r.modules||[],

          version:NEGOCIOS25.VERSION

        }

      : {ok:false, message:r?.message||'No fue posible iniciar sesión.'};

  } catch (e) {

    return {ok:false, message:e.message||String(e)};

  }

}

function negociosValidateGAS(token) {

  try {

    const r = authPost_({action:'modules',token:String(token||'')});

    if (!r || !r.ok) {

      return {ok:false, message:r?.message||'Sesión no válida.'};

    }

    if (!(r.modules||[]).some(function(m){return String(m.id||'').toUpperCase()==='PORTAL';}))

      return {ok:false, message:'No tienes permiso para entrar al portal.'};

    return {

      ok:true,

      user:r.user||{},

      expiresAt:r.expiresAt||'',

      requireChange:!!(r.user && r.user.requiereCambioClave),

      requirePhoto:!!r.requirePhoto,

      modules:r.modules||[],

      version:NEGOCIOS25.VERSION

    };

  } catch (e) {

    return {ok:false, message:e.message||String(e)};

  }

}

function negociosLogoutGAS(token) {

  try {

    return token ? authPost_({action:'logout',token:String(token)}) : {ok:true};

  } catch (e) {

    return {ok:true};

  }

}

/* Administración */

function adminBootPortalGAS(token) {

  return safeAuthAdmin_({action:'admin_boot', token:String(token||'')});

}

function adminSaveUserPortalGAS(token, user) {

  var r = safeAuthAdmin_({action:'admin_save_user', token:String(token||''), user:user||{}});

  if (!r || !r.ok) return r;

  var full = obtenerUsuarioCentralAdmin_(token, r.usuarioId || (user && user.usuarioId) || '');

  if (full) {

    var sync = sincronizarModulosAdmin_(full, r.tempPassword || '');

    r.moduleSync = sync;

    if (!sync.ok) {

      r.warning = 'El usuario se guardó en APS AUTH CENTRAL, pero hubo problemas de sincronización: ' + sync.errores.join(' | ');

    }

  }

  return r;

}

function adminResetPasswordPortalGAS(token, usuarioId) {

  var r = safeAuthAdmin_({action:'admin_reset_password', token:String(token||''), usuarioId:String(usuarioId||'')});

  if (!r || !r.ok) return r;

  var full = obtenerUsuarioCentralAdmin_(token, usuarioId);

  if (full) {

    var sync = sincronizarModulosAdmin_(full, r.tempPassword || '');

    r.moduleSync = sync;

    if (!sync.ok) {

      r.warning = 'La contraseña central fue restablecida, pero hubo problemas de sincronización: ' + sync.errores.join(' | ');

    }

  }

  return r;

}

function adminSetAccessPortalGAS(token, usuarioId, activo) {

  var r = safeAuthAdmin_({action:'admin_set_access', token:String(token||''), usuarioId:String(usuarioId||''), activo:!!activo});

  if (!r || !r.ok) return r;

  var full = obtenerUsuarioCentralAdmin_(token, usuarioId);

  if (full) {

    var sync = sincronizarModulosAdmin_(full, '');

    r.moduleSync = sync;

    if (!sync.ok) {

      r.warning = 'El acceso central cambió, pero hubo problemas de sincronización: ' + sync.errores.join(' | ');

    }

  }

  return r;

}

function adminSavePermissionsPortalGAS(token, usuarioId, permissions) {

  var r = safeAuthAdmin_({action:'admin_save_permissions', token:String(token||''), usuarioId:String(usuarioId||''), permissions:permissions||{}});

  if (!r || !r.ok) return r;

  var full = obtenerUsuarioCentralAdmin_(token, usuarioId);

  if (full) {

    var sync = sincronizarModulosAdmin_(full, '');

    r.moduleSync = sync;

    if (!sync.ok) {

      r.warning = 'Los permisos centrales se guardaron, pero hubo problemas de sincronización: ' + sync.errores.join(' | ');

    }

  }

  return r;

}

function adminGetPhotoPortalGAS(token, usuarioId) {

  return safeAuthAdmin_({

    action:'profile_photo',

    token:String(token||''),

    usuarioId:String(usuarioId||'')

  });

}

function adminSavePhotoPortalGAS(token, usuarioId, file) {

  return safeAuthAdmin_({

    action:'save_profile_photo',

    token:String(token||''),

    usuarioId:String(usuarioId||''),

    file:file||{}

  });

}

function adminDeletePhotoPortalGAS(token, usuarioId) {

  return safeAuthAdmin_({

    action:'delete_profile_photo',

    token:String(token||''),

    usuarioId:String(usuarioId||'')

  });

}

function adminSessionsPortalGAS(token, usuarioId) {

  return safeAuthAdmin_({action:'admin_sessions',token:String(token||''),usuarioId:String(usuarioId||'')});

}

function adminRevokeSessionsPortalGAS(token, usuarioId) {

  return safeAuthAdmin_({action:'admin_revoke_sessions',token:String(token||''),usuarioId:String(usuarioId||'')});

}

function adminHealthPortalGAS(token) {

  return safeAuthAdmin_({action:'admin_health',token:String(token||'')});

}

function changePasswordPortalGAS(token, actual, nueva) {

  return safeAuthAdmin_({action:'change_password',token:String(token||''),actual:String(actual||''),nueva:String(nueva||'')});

}

function adminAuditPortalGAS(token, limit) {

  return safeAuthAdmin_({action:'admin_audit', token:String(token||''), limit:Number(limit||100)});

}

function safeAuthAdmin_(payload) {

  try {

    return authPost_(payload);

  } catch (e) {

    return {ok:false, message:e.message||String(e)};

  }

}

function obtenerUsuarioCentralAdmin_(token, usuarioId) {

  var boot = safeAuthAdmin_({action:'admin_boot', token:String(token||'')});

  if (!boot || !boot.ok) return null;

  var id = String(usuarioId||'').toLowerCase();

  return (boot.users||[]).filter(function(u) {

    return String(u.usuarioId||'').toLowerCase() === id;

  })[0] || null;

}

function portalSecret_(propertyName) {
  var value = String(
    PropertiesService.getScriptProperties().getProperty(propertyName) || ''
  ).trim();

  if (!value) {
    throw new Error(
      'Falta configurar la propiedad segura ' + propertyName +
      ' en Configuración del proyecto > Propiedades de secuencia de comandos.'
    );
  }

  return value;
}

/**
 * Configura los secretos de sincronización fuera del código fuente.
 * Ejecutar manualmente una sola vez desde Apps Script.
 */
function configurarSecretsSincronizacionPortal(productividadSecret, visitasSecret) {
  var prod = String(productividadSecret || '').trim();
  var vis = String(visitasSecret || '').trim();

  if (prod.length < 32 || vis.length < 32) {
    throw new Error('Ambos secretos deben tener al menos 32 caracteres.');
  }

  PropertiesService.getScriptProperties().setProperties({
    APS_PRODUCTIVIDAD_SYNC_SECRET: prod,
    APS_VISITAS_SYNC_SECRET: vis
  }, false);

  return {
    ok: true,
    productividadConfigurada: true,
    visitasConfigurada: true
  };
}

function estadoSecretsSincronizacionPortal() {
  var props = PropertiesService.getScriptProperties();
  return {
    ok: true,
    productividad: !!String(props.getProperty('APS_PRODUCTIVIDAD_SYNC_SECRET') || '').trim(),
    visitas: !!String(props.getProperty('APS_VISITAS_SYNC_SECRET') || '').trim()
  };
}

function syncProductividadAdmin_(user, tempPassword) {

  try {

    var response = UrlFetchApp.fetch(

      NEGOCIOS25.PRODUCTIVIDAD_URL,

      {

        method:'post', contentType:'application/json',

        payload:JSON.stringify({action:'SYNC_USER', secret:portalSecret_('APS_PRODUCTIVIDAD_SYNC_SECRET'), user:user||{}, tempPassword:String(tempPassword||'')}),

        muteHttpExceptions:true, followRedirects:true

      }

    );

    var code = response.getResponseCode();

    var text = response.getContentText();

    var data;

    try {

      data = JSON.parse(text);

    } catch (e) {

      return {ok:false, message:'Productividad devolvió una respuesta no JSON. HTTP '+code};

    }

    if (code<200 || code>=300) {

      return {ok:false, message:data && data.message ? data.message : 'HTTP '+code};

    }

    return data && typeof data === 'object' ? data : {ok:false, message:'Respuesta inválida de Productividad.'};

  } catch (e) {

    return {ok:false, message:e.message||String(e)};

  }

}

function syncVisitasAdmin_(user, tempPassword) {

  try {

    const response = UrlFetchApp.fetch(

      NEGOCIOS25.VISITAS_URL,

      {

        method:'post', contentType:'application/json',

        payload:JSON.stringify({action:'SYNC_USER', secret:portalSecret_('APS_VISITAS_SYNC_SECRET'), user:user||{}, tempPassword:String(tempPassword||'')}),

        muteHttpExceptions:true, followRedirects:true

      }

    );

    const code = response.getResponseCode();

    const text = response.getContentText();

    let data;

    try {

      data = JSON.parse(text);

    } catch (e) {

      return {ok:false, message:'Visitas devolvió una respuesta no JSON. HTTP '+code};

    }

    if (code<200 || code>=300) {

      return {ok:false, message:data && data.message ? data.message : 'HTTP '+code};

    }

    return data && typeof data === 'object' ? data : {ok:false, message:'Respuesta inválida de Visitas.'};

  } catch (e) {

    return {ok:false, message:e.message||String(e)};

  }

}

function sincronizarModulosAdmin_(user, tempPassword) {

  const resultados = {

    productividad: syncProductividadAdmin_(user, tempPassword),

    visitas: syncVisitasAdmin_(user, tempPassword)

  };

  const errores = [];

  if (!resultados.productividad.ok) errores.push('Productividad: ' + (resultados.productividad.message||'Error'));

  if (!resultados.visitas.ok) errores.push('Visitas: ' + (resultados.visitas.message||'Error'));

  return {ok:errores.length===0, resultados:resultados, errores:errores};

}

function authPost_(payload) {

  const authUrl = String(PropertiesService.getScriptProperties().getProperty('APS_AUTH_CENTRAL_URL')||NEGOCIOS25.AUTH_WEBAPP_URL).trim();

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/.test(authUrl))

    throw new Error('Configura APS_AUTH_CENTRAL_URL con la URL /exec vigente de APS AUTH CENTRAL.');

  const response = UrlFetchApp.fetch(authUrl, {

    method:'post', contentType:'application/json',

    payload:JSON.stringify(payload||{}),

    muteHttpExceptions:true, followRedirects:true

  });

  const code = response.getResponseCode(), txt = response.getContentText();

  let data;

  try {

    data = JSON.parse(txt);

  } catch (_) {

    throw new Error(code===404

      ? 'APS AUTH CENTRAL respondió HTTP 404. Actualiza APS_AUTH_CENTRAL_URL con la URL /exec vigente.'

      : 'APS AUTH CENTRAL devolvió una respuesta no válida. HTTP '+code);

  }

  if (code<200 || code>=300) throw new Error(data?.message || ('Error HTTP '+code+' al conectar con APS AUTH CENTRAL.'));

  return data;

}

/* =========================================================

   DIAGNÓSTICO DEL PORTAL

   ========================================================= */

function diagnosticoPortalGAS() {

  var authUrl = String(

    PropertiesService.getScriptProperties().getProperty('APS_AUTH_CENTRAL_URL') ||

    NEGOCIOS25.AUTH_WEBAPP_URL

  ).trim();

  return {

    ok: true,

    version: NEGOCIOS25.VERSION,

    scriptId: ScriptApp.getScriptId(),

    webAppUrl: ScriptApp.getService().getUrl(),

    authCentralUrl: authUrl,

    configuracionSegura: {
      productividadSyncSecretEnPropiedades: !!PropertiesService.getScriptProperties().getProperty('APS_PRODUCTIVIDAD_SYNC_SECRET'),
      visitasSyncSecretEnPropiedades: !!PropertiesService.getScriptProperties().getProperty('APS_VISITAS_SYNC_SECRET')
    },

    funciones: {

      negociosLoginGAS: typeof negociosLoginGAS === 'function',

      negociosValidateGAS: typeof negociosValidateGAS === 'function',

      adminGetPhotoPortalGAS: typeof adminGetPhotoPortalGAS === 'function',

      adminSavePhotoPortalGAS: typeof adminSavePhotoPortalGAS === 'function',

      adminDeletePhotoPortalGAS: typeof adminDeletePhotoPortalGAS === 'function',

      changePasswordPortalGAS: typeof changePasswordPortalGAS === 'function',

      safeAuthAdmin: typeof safeAuthAdmin_ === 'function',

      authPost: typeof authPost_ === 'function',
      obtenerUrlProductividadGAS: typeof obtenerUrlProductividadGAS === 'function',
      obtenerUrlVisitasGAS: typeof obtenerUrlVisitasGAS === 'function',
      obtenerUrlCarnetizacionGAS: typeof obtenerUrlCarnetizacionGAS === 'function',
      obtenerUrlNotificacionesGAS: typeof obtenerUrlNotificacionesGAS === 'function'

    }

  };

}

function diagnosticoAuthCentralGAS() {

  try {

    var r = authPost_({action:'ping'});

    return {

      ok: !!(r && r.ok),

      response: r || null,

      portalVersion: NEGOCIOS25.VERSION

    };

  } catch (e) {

    return {

      ok: false,

      message: e.message || String(e),

      portalVersion: NEGOCIOS25.VERSION

    };

  }

}

function obtenerHerramientasPortal_(portalUrl) {

  return [

    {id:'escaner_pdf',categoria:'Gestión documental',nombre:'Escáner PDF',descripcion:'Digitaliza documentos y genera PDF.',icono:'fa-file-pdf',tipo:'Utilidad',tag:'DESTACADO',url:'https://script.google.com/macros/s/AKfycbx0cbgO_RN24UApYgw0ezPu5uWMx8oMAvFeT3iCeS4K6CylrFFZdS_1QQcTtRIlYySRWA/exec'},

    {id:'dependientes',categoria:'Gestión documental',nombre:'Afiliación de dependientes',descripcion:'Requisitos y gestión de solicitudes de dependientes.',icono:'fa-people-roof',tipo:'Guía',url:'https://script.google.com/macros/s/AKfycbxgvqO-MaXgjfzp3KinvoPnGeTw8iSH5cUEZtBpzkvr_plz-JjcImFnRRJKhXhImeRf/exec'},

    {id:'acta_amonestacion',categoria:'Gestión documental',nombre:'Acta de Amonestación',descripcion:'Formulario administrativo de amonestación.',icono:'fa-file-signature',tipo:'Formulario',url:'https://script.google.com/macros/s/AKfycbylzCUKOW4kSgJpIrwVXMt3HlMr4QYsCBnT1KVhahhLJ2PCd9LpHAN_Cu57nBLSwKlM/exec'},

    {id:'cotizacion_planes_aps',categoria:'Cotizadores APS',nombre:'Cotización de Planes APS',descripcion:'Cotiza planes de salud APS.',icono:'fa-file-invoice-dollar',tipo:'Cotizador',url:'https://script.google.com/macros/s/AKfycbwtjU4htkkIOd6xCkX0wDZ4Ad-8X0frwh5lAsI7lVFnWFE73C3K0n9Y17O9Fh_8NVwL/exec'},

    {id:'renta_vitalicia',categoria:'Cotizadores APS',nombre:'Renta Vitalicia',descripcion:'Cotizador de Renta Vitalicia.',icono:'fa-chart-pie',tipo:'Cotizador',url:'https://script.google.com/macros/s/AKfycbyrAQtC-KbsTlNwqDJaSlbsbItvfdGf2WRzd6gE1232t_NtrCUKLl1pK1ZFGnEGGTGH/exec'},

    {id:'plan_basico',categoria:'Planes y coberturas',nombre:'Plan Básico',descripcion:'Beneficios del Plan Básico APS.',icono:'fa-shield-heart',tipo:'Plan',url:'https://script.google.com/macros/s/AKfycbwyJR24XWfilikr-w0_NAnRnDd0QYp5XF3gPBwwfIsBXSvFY9vIeNuuCBrjE-nSYp0wZQ/exec'},

    {id:'planes_aps',categoria:'Planes y coberturas',nombre:'Planes APS',descripcion:'Planes de salud APS.',icono:'fa-heart-pulse',tipo:'Plan',url:'https://script.google.com/macros/s/AKfycbwjq9tkhxwO2dle9igSGhfvaPQ-mlX_6mwR7pkb-CvO-JxiKRRGbwWIRI91i-Ktmsg/exec'},

    {id:'clubes_pp',categoria:'Servicios y prevención',nombre:'Clubes P&P',descripcion:'Clubes estratégicos de promoción y prevención.',icono:'fa-people-group',tipo:'Consulta',url:'https://script.google.com/macros/s/AKfycbzgfuF810N4ReRKApz5D6JH4TxaCmzQflaUhkeu78_pvaAQeNGCsfGtWhdFgiVq7h4k/exec'},

    {id:'red_pss',categoria:'Servicios y prevención',nombre:'RED PSS',descripcion:'Prestadoras y especialistas APS.',icono:'fa-hospital',tipo:'Consulta',tag:'CONSULTA RÁPIDA',url:'https://script.google.com/macros/s/AKfycbwRuQxea3HMSIwJDh7TuR5NtIg5W4_d4S-z5O7B9v2gM_AU-Ko9lWlf5csVXjpgSemt/exec'},

    {id:'guia_bolsillo',categoria:'Manuales y guías',nombre:'Guía de Bolsillo',descripcion:'Guía comercial APS.',icono:'fa-book-open',tipo:'Documento',url:'https://script.google.com/macros/s/AKfycbzE5wIHe0-JL2PjNGSDbHmNQIZKv5kSHiKfLr-TJz89TZZW0xRzykoUvfyQ7z6B4vmI/exec'},

    {id:'manual_operativo',categoria:'Manuales y guías',nombre:'Manual de Procedimiento',descripcion:'Manual operativo APS.',icono:'fa-clipboard-list',tipo:'Documento',url:'https://script.google.com/macros/s/AKfycbzJ3VM_UZv3ArPtkdR_2aUQ70frVmFhLPbLN1Oh1DU45z_EJeeVlfI9VTSmS3QLVJ1erQ/exec'},

    {id:'manual_etica',categoria:'Manuales y guías',nombre:'Manual de Procedimientos y Políticas Éticas',descripcion:'Procedimientos operativos y políticas éticas APS.',icono:'fa-scale-balanced',tipo:'Documento',url:'https://script.google.com/macros/s/AKfycbwzhfiJzXmtgg-7Ho1SQyzR_2TlzsqDgvDt9Nva-B2fatY8SvK1YhHpF-20iIbhQQQHkg/exec'}

  ];

}

