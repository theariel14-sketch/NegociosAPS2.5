/**
 * APS BUSINESS COMMAND PRO - Backend Google Apps Script
 *
 * INSTRUCCIONES:
 * - Si este proyecto está vinculado al Google Sheet (Extensiones > Apps Script),
 *   deja SPREADSHEET_ID vacío: ''.
 * - Si es un script independiente, coloca el ID del Google Sheet.
 * - NO requiere activar "Drive API v2" en Servicios (+). El OCR usa REST.
 */
const APS_AUTH_CENTRAL_URL = 'https://script.google.com/macros/s/AKfycbxV3ms4ylr5vPd-UCR22hJ0ZhKxtjOE4tdcOcELdoIK9O33PxbSxkX6oCMSh_EkTUNEGw/exec';

const APS_CONFIG = {
  SPREADSHEET_ID: '158tXFc0E4f9dIvA5PuezB-S7rcmAXu6WJSTubtDMQW4',
  DRIVE_FOLDER_ARS_ID: '1p3OMqP19lUF6h9143kh9CpJSaKpEImDY',
  DRIVE_FOLDER_AFP_ID: '1J-O8KFtOIWpmHsiOt6a84ByJ1nLGE7jj',
  TIMEZONE: 'America/Santo_Domingo',
  SESSION_SECONDS: 21600, // 6 horas
  MAX_FILE_BYTES: 8 * 1024 * 1024, // 8 MB

  USUARIOS_INICIALES: [
    { usuario:'maite.veras', nombre:'MAITE VERAS', rol:'DIRECTORA', gerenciaId:'', coordinadorId:'', cedula:'00116321597', tipoClave:'CEDULA', gestores:[] },

    { usuario:'ariel.aguilera', nombre:'ARIEL AGUILERA ROSADO', rol:'GERENTE', gerenciaId:'G_ARIEL', coordinadorId:'', cedula:'00118554757', tipoClave:'CEDULA', gestores:['RAFAEL ALCANTARA FERMIN','ADALGIZA ARVELO CASANOVA','GARDENIA MONTERO','ROSARIO VALERIO RODRIGUEZ'] },
    { usuario:'rafael.alcantara', nombre:'RAFAEL ALCANTARA FERMIN', rol:'GESTOR', gerenciaId:'G_ARIEL', coordinadorId:'', cedula:'22300180571', gestores:[] },
    { usuario:'adalgiza.arvelo', nombre:'ADALGIZA ARVELO CASANOVA', rol:'GESTOR', gerenciaId:'G_ARIEL', coordinadorId:'', cedula:'40220769166', gestores:[] },
    { usuario:'gardenia.montero', nombre:'GARDENIA MONTERO', rol:'GESTOR', gerenciaId:'G_ARIEL', coordinadorId:'', cedula:'00119084549', gestores:[] },
    { usuario:'rosario.valerio', nombre:'ROSARIO VALERIO RODRIGUEZ', rol:'GESTOR', gerenciaId:'G_ARIEL', coordinadorId:'', cedula:'22300151606', gestores:[] },

    { usuario:'belkis.andujar', nombre:'BELKIS ELISA ANDUJAR RODRIGUEZ', rol:'GERENTE', gerenciaId:'G_BELKIS', coordinadorId:'', cedula:'02301576803', gestores:['YORDHIRA VANESSA CASTILLO MARTINEZ','ANA BRITO','ANA ERCILIA TUBAY LIRIANO'] },
    { usuario:'dairy.rodriguez', nombre:'DAIRY ESTEFANY RODRIGUEZ RODRIGUEZ', rol:'COORDINADOR', gerenciaId:'G_BELKIS', coordinadorId:'', cedula:'40222803898', gestores:['YORDHIRA VANESSA CASTILLO MARTINEZ','ANA BRITO','ANA ERCILIA TUBAY LIRIANO'] },
    { usuario:'yordhira.castillo', nombre:'YORDHIRA VANESSA CASTILLO MARTINEZ', rol:'GESTOR', gerenciaId:'G_BELKIS', coordinadorId:'dairy.rodriguez', cedula:'02601380237', gestores:[] },
    { usuario:'ana.brito', nombre:'ANA BRITO', rol:'GESTOR', gerenciaId:'G_BELKIS', coordinadorId:'dairy.rodriguez', cedula:'00201152055', gestores:[] },
    { usuario:'ana.tubay', nombre:'ANA ERCILIA TUBAY LIRIANO', rol:'GESTOR', gerenciaId:'G_BELKIS', coordinadorId:'dairy.rodriguez', cedula:'40221357573', gestores:[] },

    { usuario:'jose.angel', nombre:'JOSE ANGEL GONZALEZ FLORES', rol:'GERENTE', gerenciaId:'G_ANGEL', coordinadorId:'', cedula:'00118335355', gestores:['GERALD EMMANUEL CARRASCO HERNANDEZ','DENNI ESTHER RAMIREZ DE GERMAN','KATIUSCA VICTORIA FAMILIA'] },
    { usuario:'rafelina.pichardo', nombre:'RAFELINA DAYANARA PICHARDO FELIZ', rol:'COORDINADOR', gerenciaId:'G_ANGEL', coordinadorId:'', cedula:'22900209440', gestores:['GERALD EMMANUEL CARRASCO HERNANDEZ','DENNI ESTHER RAMIREZ DE GERMAN','KATIUSCA VICTORIA FAMILIA'] },
    { usuario:'gerald.carrasco', nombre:'GERALD EMMANUEL CARRASCO HERNANDEZ', rol:'GESTOR', gerenciaId:'G_ANGEL', coordinadorId:'rafelina.pichardo', cedula:'22900295787', gestores:[] },
    { usuario:'denni.ramirez', nombre:'DENNI ESTHER RAMIREZ DE GERMAN', rol:'GESTOR', gerenciaId:'G_ANGEL', coordinadorId:'rafelina.pichardo', cedula:'00500439559', gestores:[] },
    { usuario:'katiusca.familia', nombre:'KATIUSCA VICTORIA FAMILIA', rol:'GESTOR', gerenciaId:'G_ANGEL', coordinadorId:'rafelina.pichardo', cedula:'22301618132', gestores:[] }
  ]
};

function doGet(e) {
  try {
    var html = cargarHtmlPrincipal_();

    // Pasamos el token a la página sin validar ni crear sesión en doGet.
    // Se inyecta antes de devolver el HTML para que funcione también
    // cuando Productividad se abre dentro del iframe de Negocios 2.5.
    var centralToken = String(
      e && e.parameter && (e.parameter.aps_token || e.parameter.t) || ''
    ).trim();

    if (centralToken) {
      var tokenJson = JSON.stringify(centralToken).replace(/</g, '\\u003c');
      var tokenScript =
        '<script>window.__APS_CENTRAL_TOKEN__=' +
        tokenJson +
        ';</script>';

      html = html.indexOf('<head>') !== -1
        ? html.replace('<head>', '<head>' + tokenScript)
        : tokenScript + html;
    }

    return HtmlService
      .createHtmlOutput(html)
      .setTitle('APS Business Command Pro')
      .addMetaTag(
        'viewport',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:system-ui;padding:32px;max-width:540px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #fee2e2;">' +
      '<h2 style="color:#dc2626;margin-top:0;">Error al iniciar</h2><p>' +
      escapeHtml_(err.message) +
      '</p></div>'
    ).setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
  }
}


/**
 * Carga el HTML principal sin depender de mayúsculas/minúsculas.
 *
 * En Apps Script el nombre lógico del archivo NO incluye ".html".
 * Por ejemplo:
 *   Index.html  -> createHtmlOutputFromFile('Index')
 *   index.html  -> createHtmlOutputFromFile('index')
 */
function cargarHtmlPrincipal_() {
  var candidatos = ['Index', 'index'];
  var errores = [];

  for (var i = 0; i < candidatos.length; i++) {
    try {
      return HtmlService
        .createHtmlOutputFromFile(candidatos[i])
        .getContent();
    } catch (err) {
      errores.push(
        candidatos[i] + ': ' +
        (err && err.message ? err.message : String(err))
      );
    }
  }

  throw new Error(
    'No se encontró el HTML principal. ' +
    'El proyecto debe contener un archivo HTML llamado "Index" o "index". ' +
    'En Apps Script se mostrará como Index.html o index.html.'
  );
}


/* ============================================================
   APS AUTH CENTRAL · FASE 3
   Permite entrar a Productividad desde Negocios 2.5 sin
   solicitar un segundo login.
   ============================================================ */

function authCentralPost_(payload) {
  var authUrl = String(PropertiesService.getScriptProperties().getProperty('APS_AUTH_CENTRAL_URL') || APS_AUTH_CENTRAL_URL).trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/.test(authUrl))
    throw new Error('Configura APS_AUTH_CENTRAL_URL con la URL /exec vigente de APS AUTH CENTRAL.');
  var response = UrlFetchApp.fetch(authUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
    followRedirects: true
  });

  var httpCode = response.getResponseCode();
  var text = response.getContentText();
  var data;

  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(httpCode === 404
      ? 'APS AUTH CENTRAL respondió HTTP 404. Actualiza APS_AUTH_CENTRAL_URL en Propiedades de secuencia de comandos de Productividad.'
      : 'APS AUTH CENTRAL devolvió una respuesta no válida. HTTP ' + httpCode);
  }

  if (httpCode < 200 || httpCode >= 300) {
    throw new Error(data && data.message ? data.message : 'Error HTTP ' + httpCode + ' al validar APS AUTH CENTRAL.');
  }

  return data;
}

function obtenerFotoCentralGAS(centralToken, usuarioId) {
  try {
    var r=authCentralPost_({
      action:'profile_photo',
      token:String(centralToken||''),
      usuarioId:String(usuarioId||'')
    });

    return {
      success:!!(r&&r.ok),
      disponible:!!(r&&r.disponible),
      dataUrl:r&&r.dataUrl?r.dataUrl:'',
      nombre:r&&r.nombre?r.nombre:'',
      role:r&&r.rol?r.rol:'',
      fotoActualizada:r&&r.fotoActualizada?r.fotoActualizada:'',
      error:r&&r.ok?'':(r&&r.message?r.message:'No se pudo cargar la foto central.')
    };

  } catch(e) {
    return {success:false,error:e.message||String(e)};
  }
}

function guardarFotoCentralGAS(centralToken, usuarioId, archivo) {
  try {
    var r=authCentralPost_({
      action:'save_profile_photo',
      token:String(centralToken||''),
      usuarioId:String(usuarioId||''),
      file:archivo||{}
    });

    return r&&r.ok
      ? {
          success:true,
          user:r.user||{},
          message:r.message||'Foto central actualizada.'
        }
      : {
          success:false,
          error:r&&r.message?r.message:'No se pudo guardar la foto central.'
        };

  } catch(e) {
    return {success:false,error:e.message||String(e)};
  }
}

function cambiarClaveCentralProxyGAS(centralToken, actual, nueva) {
  try {
    var r=authCentralPost_({
      action:'change_password',
      token:String(centralToken||''),
      actual:String(actual||''),
      nueva:String(nueva||'')
    });

    return r&&r.ok
      ? {
          success:true,
          message:r.message||'Contraseña central actualizada.'
        }
      : {
          success:false,
          error:r&&r.message?r.message:'No se pudo cambiar la contraseña central.'
        };

  } catch(e) {
    return {success:false,error:e.message||String(e)};
  }
}


function centralSessionFromToken_(centralToken) {
  var token = String(centralToken || '').trim();
  if (!token) throw new Error('Sesión central requerida.');

  var validated = authCentralPost_({
    action: 'validate',
    token: token,
    moduleId: 'PRODUCCION'
  });

  if (!validated || !validated.ok || !validated.user) {
    throw new Error(
      validated && validated.message
        ? validated.message
        : 'Sesión central no válida.'
    );
  }

  var cu = validated.user || {};
  var userId = String(cu.usuarioId || cu.usuario || '').trim();

  if (!userId) {
    throw new Error('APS AUTH CENTRAL no devolvió el identificador del usuario.');
  }

  var effective = {
    usuario: userId,
    nombre: String(cu.nombre || userId),
    codigoVendedor: String(cu.codigoVendedor || ''),
    rol: normalizeRole_(cu.rol || 'GESTOR'),
    gerenciaId: String(cu.gerenciaId || ''),
    coordinadorId: String(cu.coordinadorId || ''),
    supervisorId: String(cu.supervisorId || ''),
    cedula: String(cu.cedula || ''),
    direccion: String(cu.direccionId || 'DIRECCION_COMERCIAL'),
    activo: true,
    versionSesion: Number(cu.versionSesion || 1),
    gestores: [],
    fotoDisponible: cu.fotoDisponible === true,
    fotoActualizada: String(cu.fotoActualizada || ''),
    fotoVersion: Number(cu.fotoVersion || 0),
    requiereCambioClave: cu.requiereCambioClave === true,
    tipoClave: 'CENTRAL'
  };

  var session = publicUser_(effective);
  session.centralAuth = true;
  session.centralValidatedAt = Date.now();

  return {
    session: session,
    centralUser: cu
  };
}


function iniciarSesionCentralGAS(centralToken) {
  try {
    var t0 = Date.now();

    try { limpiarSesionesPersistidasVencidas_(); } catch (ignore) {}

    var central = centralSessionFromToken_(centralToken);
    var session = central.session;

    /*
     * V3.3.2
     * AUTH CENTRAL pasa a ser la sesión real de Productividad.
     * Ya no se crea un segundo token local.
     */
    persistSession_(String(centralToken || ''), session);

    try {
      registrarAuditoria_(
        'LOGIN_CENTRAL',
        session,
        'Acceso directo con sesión de APS AUTH CENTRAL'
      );
    } catch (e) {}

    return {
      success: true,
      token: String(centralToken || ''),
      user: session,
      centralAuth: true,
      centralUser: central.centralUser,
      fastLogin: true,
      loginMs: Date.now() - t0,
      expiresIn: APS_CONFIG.SESSION_SECONDS
    };

  } catch (e) {
    return {
      success: false,
      error: e.message || String(e)
    };
  }
}


/* ============================================================
   AUTENTICACIÓN Y SESIONES
   ============================================================ */


function getPrincipalConfigByCedula_(cedula) {
  var clean = normalizeCedula_(cedula || '');
  var principals = (APS_CONFIG.USUARIOS_INICIALES || []).filter(function(u){
    return u.usuario === 'maite.veras' || u.usuario === 'ariel.aguilera';
  });

  var cfg = principals.filter(function(u){
    return normalizeCedula_(u.cedula || '') === clean;
  })[0];

  if (!cfg) return null;

  return {
    usuario: cfg.usuario,
    nombre: cfg.nombre,
    cedula: normalizeCedula_(cfg.cedula || ''),
    rol: normalizeRole_(cfg.rol),
    gerenciaId: cfg.gerenciaId || '',
    coordinadorId: cfg.coordinadorId || '',
    direccion: 'DIRECCION_COMERCIAL',
    activo: true,
    tipoClave: 'CEDULA',
    versionSesion: 1,
    gestores: Array.isArray(cfg.gestores) ? cfg.gestores : []
  };
}

function getPrincipalConfigByUsuario_(username) {
  var cfg = (APS_CONFIG.USUARIOS_INICIALES || []).filter(function(u){
    return u.usuario === username &&
      (u.usuario === 'maite.veras' || u.usuario === 'ariel.aguilera');
  })[0];

  if (!cfg) return null;

  return {
    usuario: cfg.usuario,
    nombre: cfg.nombre,
    cedula: normalizeCedula_(cfg.cedula || ''),
    rol: normalizeRole_(cfg.rol),
    gerenciaId: cfg.gerenciaId || '',
    coordinadorId: cfg.coordinadorId || '',
    direccion: 'DIRECCION_COMERCIAL',
    activo: true,
    tipoClave: 'CEDULA',
    versionSesion: 1,
    gestores: Array.isArray(cfg.gestores) ? cfg.gestores : []
  };
}


function getDirectPrincipalUser_(cedula) {
  var clean = String(cedula || '').replace(/\D/g,'');
  var base = null;

  if (clean === '00116321597') {
    base = {
      usuario:'maite.veras',
      nombre:'MAITE VERAS',
      rol:'DIRECTORA',
      gerenciaId:'',
      coordinadorId:'',
      cedula:'00116321597'
    };
  } else if (clean === '00118554757') {
    base = {
      usuario:'ariel.aguilera',
      nombre:'ARIEL AGUILERA ROSADO',
      rol:'GERENTE',
      gerenciaId:'G_ARIEL',
      coordinadorId:'',
      cedula:'00118554757'
    };
  }

  if (!base) return null;

  // Si la hoja responde, tomamos la versión/estructura real para que la sesión
  // no se invalide después del login.
  try {
    var users = getUsers_();
    var current = users.filter(function(u){ return u.usuario === base.usuario; })[0];
    if (current) {
      if (current.activo === false) throw new Error('Tu acceso está desactivado.');
      current.tipoClave = 'CEDULA';
      current.cedula = base.cedula;
      return current;
    }
  } catch(e) {
    if (/desactivado/i.test(String(e && e.message || e))) throw e;
  }

  return {
    usuario:base.usuario,
    nombre:base.nombre,
    cedula:base.cedula,
    rol:base.rol,
    gerenciaId:base.gerenciaId,
    coordinadorId:base.coordinadorId,
    direccion:'DIRECCION_COMERCIAL',
    activo:true,
    tipoClave:'CEDULA',
    versionSesion:1,
    gestores:[]
  };
}


/* ============================================================
   RECUPERACIÓN SEGURA DE CONTRASEÑA
   - Clave temporal por 30 minutos.
   - Un solo inicio de sesión con la clave temporal.
   - Cambio obligatorio al entrar.
   - Máximo 3 solicitudes por usuario en 1 hora.
   - Nunca se guarda la clave temporal en texto plano.
   ============================================================ */

var APS_RECOVERY_CONFIG_={
  TEMP_MINUTES:30,
  MAX_REQUESTS_PER_HOUR:3
};

function getRecuperacionHeaders_(){
  return [
    'Fecha Hora','Usuario','Nombre','Rol','Gerencia','Coordinador',
    'Accion','Clave Temporal','Expira',
    'Solicitado Por','Visible Para','Estado','Fecha Uso','Limpiada'
  ];
}

function registrarRecuperacion_(data){
  try{
    var sh=ensureSheetHeaders_('RECUPERACION_ACCESOS',getRecuperacionHeaders_());
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}
    data=data||{};

    put('Fecha Hora',data.fechaHora||new Date());
    put('Usuario',data.usuario||'');
    put('Nombre',data.nombre||'');
    put('Rol',data.rol||'');
    put('Gerencia',data.gerenciaId||'');
    put('Coordinador',data.coordinadorId||'');
    put('Accion',data.accion||'RECUPERACION');
    put('Clave Temporal',data.claveTemporal||'');
    put('Expira',data.expira||'');
    put('Solicitado Por',data.solicitadoPor||'AUTOSERVICIO');
    put('Visible Para',data.visiblePara||'MAITE VERAS');
    put('Estado',data.estado||'GENERADA');
    put('Fecha Uso',data.fechaUso||'');
    put('Limpiada',data.limpiada||'NO');

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

    var last=sh.getLastRow();
    if(last>3001)sh.deleteRows(2,last-3001);
  }catch(ignore){}
}

function contarRecuperacionesUltimaHora_(userId){
  try{
    var ss=getSpreadsheet_();
    var sh=ss.getSheetByName('RECUPERACION_ACCESOS');
    if(!sh||sh.getLastRow()<2)return 0;

    var values=sh.getDataRange().getValues();
    var map=headerMap_(sh);
    var since=Date.now()-60*60*1000;
    var count=0;

    for(var i=1;i<values.length;i++){
      var uid=String(valueByHeader_(values[i],map,['Usuario'])||'');
      if(uid!==String(userId||''))continue;

      var action=String(valueByHeader_(values[i],map,['Accion'])||'');
      if(action!=='SOLICITUD_AUTOSERVICIO')continue;

      var fh=valueByHeader_(values[i],map,['Fecha Hora']);
      var dt=fh instanceof Date?fh:new Date(fh);
      if(dt&&!isNaN(dt.getTime())&&dt.getTime()>=since)count++;
    }
    return count;
  }catch(e){
    return 0;
  }
}


function limpiarClavesTemporalesExpiradas_(){
  try{
    var ss=getSpreadsheet_();
    var sh=ss.getSheetByName('RECUPERACION_ACCESOS');
    if(!sh||sh.getLastRow()<2)return 0;

    sh=ensureSheetHeaders_('RECUPERACION_ACCESOS',getRecuperacionHeaders_());
    var values=sh.getDataRange().getValues();
    var map=headerMap_(sh);

    var idxClave=map[normalizeHeader_('Clave Temporal')];
    var idxExpira=map[normalizeHeader_('Expira')];
    var idxEstado=map[normalizeHeader_('Estado')];
    var idxLimpiada=map[normalizeHeader_('Limpiada')];

    var cleaned=0;
    for(var i=1;i<values.length;i++){
      var clave=String(values[i][idxClave]||'');
      if(!clave)continue;

      var estado=String(values[i][idxEstado]||'').toUpperCase();
      var exp=values[i][idxExpira] instanceof Date
        ? values[i][idxExpira]
        : new Date(values[i][idxExpira]);

      var expired=exp&&!isNaN(exp.getTime())&&exp.getTime()<=Date.now();
      var consumed=estado==='USADA'||estado==='REEMPLAZADA'||estado==='EXPIRADA';

      if(expired||consumed){
        sh.getRange(i+1,idxClave+1).clearContent();
        sh.getRange(i+1,idxLimpiada+1).setValue('SI');
        if(expired&&estado!=='USADA'&&estado!=='REEMPLAZADA'){
          sh.getRange(i+1,idxEstado+1).setValue('EXPIRADA');
        }
        cleaned++;
      }
    }
    if(cleaned)SpreadsheetApp.flush();
    return cleaned;
  }catch(e){
    return 0;
  }
}

function marcarClaveTemporalUsada_(userId){
  try{
    var ss=getSpreadsheet_();
    var sh=ss.getSheetByName('RECUPERACION_ACCESOS');
    if(!sh||sh.getLastRow()<2)return;

    sh=ensureSheetHeaders_('RECUPERACION_ACCESOS',getRecuperacionHeaders_());
    var values=sh.getDataRange().getValues();
    var map=headerMap_(sh);

    var idxUser=map[normalizeHeader_('Usuario')];
    var idxClave=map[normalizeHeader_('Clave Temporal')];
    var idxEstado=map[normalizeHeader_('Estado')];
    var idxFechaUso=map[normalizeHeader_('Fecha Uso')];
    var idxLimpiada=map[normalizeHeader_('Limpiada')];

    for(var i=values.length-1;i>=1;i--){
      if(String(values[i][idxUser]||'')!==String(userId||''))continue;

      var estado=String(values[i][idxEstado]||'').toUpperCase();
      if(estado==='ENVIADA'||estado==='GENERADA'||estado==='ACTIVA'){
        sh.getRange(i+1,idxEstado+1).setValue('USADA');
        sh.getRange(i+1,idxFechaUso+1).setValue(new Date());
        sh.getRange(i+1,idxClave+1).clearContent();
        sh.getRange(i+1,idxLimpiada+1).setValue('SI');
        SpreadsheetApp.flush();
        break;
      }
    }
  }catch(e){}
}

function invalidarClavesTemporalesPrevias_(userId){
  try{
    var ss=getSpreadsheet_();
    var sh=ss.getSheetByName('RECUPERACION_ACCESOS');
    if(!sh||sh.getLastRow()<2)return;

    sh=ensureSheetHeaders_('RECUPERACION_ACCESOS',getRecuperacionHeaders_());
    var values=sh.getDataRange().getValues();
    var map=headerMap_(sh);

    var idxUser=map[normalizeHeader_('Usuario')];
    var idxClave=map[normalizeHeader_('Clave Temporal')];
    var idxEstado=map[normalizeHeader_('Estado')];
    var idxLimpiada=map[normalizeHeader_('Limpiada')];

    for(var i=1;i<values.length;i++){
      if(String(values[i][idxUser]||'')!==String(userId||''))continue;

      var estado=String(values[i][idxEstado]||'').toUpperCase();
      if((estado==='ENVIADA'||estado==='GENERADA'||estado==='ACTIVA') && String(values[i][idxClave]||'')){
        sh.getRange(i+1,idxEstado+1).setValue('REEMPLAZADA');
        sh.getRange(i+1,idxClave+1).clearContent();
        sh.getRange(i+1,idxLimpiada+1).setValue('SI');
      }
    }
    SpreadsheetApp.flush();
  }catch(e){}
}

function listarClavesTemporalesMaiteGAS(token){
  var session=requireSession_(token);

  if(session.usuario!=='maite.veras'){
    throw new Error('Esta información solo está disponible para Maite Veras.');
  }

  limpiarClavesTemporalesExpiradas_();

  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('RECUPERACION_ACCESOS');
  if(!sh||sh.getLastRow()<2)return {success:true,claves:[]};

  sh=ensureSheetHeaders_('RECUPERACION_ACCESOS',getRecuperacionHeaders_());
  var values=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var out=[];

  for(var i=1;i<values.length;i++){
    var clave=String(valueByHeader_(values[i],map,['Clave Temporal'])||'');
    if(!clave)continue;

    var estado=String(valueByHeader_(values[i],map,['Estado'])||'').toUpperCase();
    if(['ENVIADA','GENERADA','ACTIVA'].indexOf(estado)===-1)continue;

    var exp=valueByHeader_(values[i],map,['Expira']);
    var expDate=exp instanceof Date?exp:new Date(exp);
    if(!expDate||isNaN(expDate.getTime())||expDate.getTime()<=Date.now())continue;

    out.push({
      usuario:String(valueByHeader_(values[i],map,['Usuario'])||''),
      nombre:String(valueByHeader_(values[i],map,['Nombre'])||''),
      rol:String(valueByHeader_(values[i],map,['Rol'])||''),
      claveTemporal:clave,
      expira:Utilities.formatDate(expDate,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm a'),
      solicitadoPor:String(valueByHeader_(values[i],map,['Solicitado Por'])||''),
      estado:estado
    });
  }

  return {success:true,claves:out};
}


function generarClaveTemporal_(){
  var raw=Utilities.getUuid().replace(/-/g,'').toUpperCase();
  return 'APS-'+raw.slice(0,8);
}





function aplicarClaveTemporal_(target,tempPassword,expira,modificadoPor){
  var salt=Utilities.getUuid();
  target.tipoClave='TEMPORAL';
  target.salt=salt;
  target.claveHash=hashClave_(tempPassword,salt);
  target.claveTemporalExpira=expira;
  target.requiereCambioClave=true;
  target.claveTemporalUsada=false;
  target.versionSesion=Number(target.versionSesion||1)+1;
  target.modificadoPor=modificadoPor||'RECUPERACION';
  target.ultimaModificacion=new Date();
}



function generarRecuperacionParaUsuario_(target,users,solicitadoPor,accion){
  if(!target||target.activo===false)throw new Error('Usuario no disponible.');
  if(target.rol==='DIRECTORA')throw new Error('La cuenta de Dirección no utiliza recuperación automática.');

  var temp=generarClaveTemporal_();
  var expira=new Date(Date.now()+APS_RECOVERY_CONFIG_.TEMP_MINUTES*60*1000);

  // Invalida claves temporales anteriores de ese usuario.
  invalidarClavesTemporalesPrevias_(target.usuario);

  aplicarClaveTemporal_(target,temp,expira,solicitadoPor);
  saveUsers_(users);

  try{revocarDispositivosUsuario_(target.usuario);}catch(e){}

  // Único lugar donde se conserva temporalmente la clave en texto visible:
  // RECUPERACION_ACCESOS. También puede verla Maite desde su sesión.
  registrarRecuperacion_({
    usuario:target.usuario,
    nombre:target.nombre,
    rol:target.rol,
    gerenciaId:target.gerenciaId||'',
    coordinadorId:target.coordinadorId||'',
    accion:accion||'SOLICITUD_AUTOSERVICIO',
    claveTemporal:temp,
    expira:expira,
    solicitadoPor:solicitadoPor||'AUTOSERVICIO',
    visiblePara:'MAITE VERAS',
    estado:'ACTIVA',
    limpiada:'NO'
  });

  try{
    registrarAuditoria_(
      'GENERAR_CLAVE_TEMPORAL',
      {usuario:String(solicitadoPor||'AUTOSERVICIO'),nombre:String(solicitadoPor||'AUTOSERVICIO'),role:'SISTEMA'},
      target.usuario+' | '+target.nombre+' | Visible para Maite'
    );
  }catch(e){}

  return {
    success:true,
    expira:expira,
    claveTemporal:temp
  };
}

function solicitarRecuperacionAccesoGAS(cedula){
  var generic={
    success:true,
    mensaje:'Si la cédula corresponde a un usuario activo, se generará una contraseña temporal para que Maite pueda consultarla en su perfil.'
  };

  try{
    var clean=normalizeCedula_(cedula||'');
    if(!/^\d{11}$/.test(clean))return generic;

    var users=getUsers_();
    var target=users.filter(function(u){
      return u.activo!==false && normalizeCedula_(u.cedula||'')===clean;
    })[0];

    if(!target||target.rol==='DIRECTORA')return generic;

    if(contarRecuperacionesUltimaHora_(target.usuario)>=APS_RECOVERY_CONFIG_.MAX_REQUESTS_PER_HOUR){
      registrarRecuperacion_({
        usuario:target.usuario,
        nombre:target.nombre,
        rol:target.rol,
        gerenciaId:target.gerenciaId||'',
        coordinadorId:target.coordinadorId||'',
        accion:'LIMITE_RECUPERACION',
        solicitadoPor:'AUTOSERVICIO',
        visiblePara:'MAITE VERAS',
        estado:'BLOQUEADA'
      });
      return generic;
    }

    generarRecuperacionParaUsuario_(
      target,
      users,
      'AUTOSERVICIO',
      'SOLICITUD_AUTOSERVICIO'
    );

    return generic;

  }catch(e){
    try{registrarErrorSistema_(null,'SEGURIDAD','solicitarRecuperacionAccesoGAS',e,'');}catch(ignore){}
    return generic;
  }
}

function generarClaveTemporalAdminGAS(token,userId){
  var session=requireSession_(token);

  if(session.usuario!=='maite.veras'){
    throw new Error('Solo Maite Veras puede generar y consultar contraseñas temporales desde Administración.');
  }

  var users=getUsers_();
  var target=users.filter(function(u){
    return u.usuario===String(userId||'') && u.activo!==false;
  })[0];

  if(!target)throw new Error('Usuario no encontrado o inactivo.');

  var result=generarRecuperacionParaUsuario_(
    target,
    users,
    session.nombre||session.usuario,
    'GENERADA_POR_MAITE'
  );

  return {
    success:true,
    nombre:target.nombre,
    claveTemporal:result.claveTemporal,
    expira:Utilities.formatDate(result.expira,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm a'),
    mensaje:'Contraseña temporal generada. Está disponible en la base de datos y en el perfil de Maite.'
  };
}


function iniciarSesionGAS(clave, recordarDispositivo) {
  return {success:false,error:'El acceso local de Productividad fue deshabilitado. Entra desde Negocios 2.5.'};
}
function iniciarSesionGAS_DESHABILITADO_(clave, recordarDispositivo) {
  var rawKey=String(clave||'').trim();
  if(!rawKey)throw new Error('Ingresa tu cédula o contraseña.');

  var cleanDigits=String(rawKey).replace(/\D/g,'');
  var user=null;
  var users=null;
  var temporaryLogin=false;

  // ACCESO DIRECTO PRINCIPAL.
  // Maite y Ariel conservan el acceso principal por cédula.
  if(cleanDigits==='00116321597'||cleanDigits==='00118554757'){
    user=getDirectPrincipalUser_(cleanDigits);
  }

  if(!user){
    users=getUsers_();

    var matches=users.filter(function(u){
      if(u.activo===false)return false;

      var tipo=String(u.tipoClave||'CEDULA').toUpperCase();

      if(tipo==='CEDULA'){
        var ced=String(u.cedula||'').replace(/\D/g,'');
        return /^\d{11}$/.test(ced)&&/^\d{11}$/.test(cleanDigits)&&ced===cleanDigits;
      }

      if(tipo==='PASSWORD'){
        return !!(u.salt&&u.claveHash&&hashClave_(rawKey,u.salt)===u.claveHash);
      }

      if(tipo==='TEMPORAL'){
        if(u.claveTemporalUsada===true)return false;
        var exp=u.claveTemporalExpira instanceof Date
          ? u.claveTemporalExpira
          : new Date(u.claveTemporalExpira);
        if(!exp||isNaN(exp.getTime())||exp.getTime()<=Date.now())return false;
        return !!(u.salt&&u.claveHash&&hashClave_(rawKey,u.salt)===u.claveHash);
      }

      return false;
    });

    if(matches.length===1){
      user=matches[0];
      temporaryLogin=String(user.tipoClave||'').toUpperCase()==='TEMPORAL';
    }
  }

  if(!user)throw new Error('Credenciales no válidas.');

  if(temporaryLogin){
    // La clave temporal queda consumida al primer inicio correcto.
    user.claveTemporalUsada=true;
    user.requiereCambioClave=true;
    marcarClaveTemporalUsada_(user.usuario);
    user.modificadoPor='LOGIN TEMPORAL';
    user.ultimaModificacion=new Date();
    saveUsers_(users);
  }

  var sesion=crearSesion_(user);

  // Nunca recordar un dispositivo mientras la contraseña sea temporal.
  if(recordarDispositivo===true&&!temporaryLogin&&!user.requiereCambioClave){
    sesion.deviceToken=crearDispositivoRecordado_(user);
    sesion.deviceExpiresDays=30;
  }

  sesion.requiereCambioClave=user.requiereCambioClave===true;
  sesion.accesoTemporal=temporaryLogin;

  return sesion;
}


function sessionPropKey_(token) {
  return 'APS_SESSION_PERSIST_' + String(token || '');
}

function persistSession_(token, session) {
  var tokenStr = String(token || '');
  if (!tokenStr || !session) return;

  if (session.centralAuth === true) {
    try {
      CacheService.getScriptCache().put(
        'APS_SESSION_' + tokenStr,
        JSON.stringify(session),
        180
      );
    } catch(e) {}
    return;
  }

  var payload = {
    session: session,
    expiresAt: Date.now() + (APS_CONFIG.SESSION_SECONDS * 1000)
  };

  var raw = JSON.stringify(payload);

  try {
    CacheService.getScriptCache().put(
      'APS_SESSION_' + tokenStr,
      JSON.stringify(session),
      APS_CONFIG.SESSION_SECONDS
    );
  } catch(e) {}

  try {
    PropertiesService.getScriptProperties().setProperty(
      sessionPropKey_(tokenStr),
      raw
    );
  } catch(e) {}
}


function limpiarSesionesPersistidasVencidas_() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var prefix = 'APS_SESSION_PERSIST_';
  var now = Date.now();
  var removed = 0;

  Object.keys(all || {}).forEach(function(key) {
    if (key.indexOf(prefix) !== 0) return;

    var shouldDelete = false;

    try {
      var payload = JSON.parse(all[key] || '{}');
      shouldDelete =
        !payload ||
        !payload.session ||
        !Number(payload.expiresAt || 0) ||
        Number(payload.expiresAt || 0) <= now;
    } catch(e) {
      shouldDelete = true;
    }

    if (shouldDelete) {
      try {
        props.deleteProperty(key);
        removed++;
      } catch(e) {}
    }
  });

  return removed;
}

function limpiarSesionesPersistidasVencidasGAS() {
  return {
    success: true,
    eliminadas: limpiarSesionesPersistidasVencidas_()
  };
}


function deletePersistedSession_(token) {
  try {
    CacheService.getScriptCache().remove('APS_SESSION_' + String(token || ''));
  } catch(e) {}
  try {
    PropertiesService.getScriptProperties().deleteProperty(sessionPropKey_(token));
  } catch(e) {}
}

function readPersistedSession_(token) {
  var tokenStr = String(token || '');
  if (!tokenStr) return null;

  var cacheKey = 'APS_SESSION_' + tokenStr;

  try {
    var rawCache = CacheService.getScriptCache().get(cacheKey);
    if (rawCache) return JSON.parse(rawCache);
  } catch(e) {}

  try {
    var raw = PropertiesService.getScriptProperties().getProperty(sessionPropKey_(tokenStr));
    if (!raw) return null;

    var payload = JSON.parse(raw);
    if (!payload || !payload.session || Number(payload.expiresAt || 0) <= Date.now()) {
      deletePersistedSession_(tokenStr);
      return null;
    }

    try {
      CacheService.getScriptCache().put(
        cacheKey,
        JSON.stringify(payload.session),
        Math.max(60, Math.min(
          APS_CONFIG.SESSION_SECONDS,
          Math.floor((Number(payload.expiresAt) - Date.now()) / 1000)
        ))
      );
    } catch(e) {}

    return payload.session;
  } catch(e) {
    return null;
  }
}

function crearSesion_(user) {
  var token = Utilities.getUuid() + Utilities.getUuid();
  var session = publicUser_(user);

  persistSession_(token, session);

  try { registrarAuditoria_('LOGIN', session, 'Inicio de sesión'); } catch (e) {}

  return {
    success:true,
    token:token,
    user:session,
    expiresIn:APS_CONFIG.SESSION_SECONDS
  };
}

function validarSesionGAS(token) {
  try {
    var session = requireSession_(token);
    return { success: true, user: session, expiresIn: APS_CONFIG.SESSION_SECONDS };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function cerrarSesionGAS(token, deviceToken) {
  try {
    var session = null;
    try { session = requireSession_(token); } catch(e) {}

    deletePersistedSession_(token);

    if (deviceToken) {
      try { revocarDispositivoRecordado_(deviceToken); } catch(e) {}
    }

    if (session) {
      try { registrarAuditoria_('LOGOUT', session, 'Cierre de sesión'); } catch(e) {}
    }
  } catch (e) {
    deletePersistedSession_(token);
    if (deviceToken) {
      try { revocarDispositivoRecordado_(deviceToken); } catch(ex) {}
    }
  }

  return { success: true };
}

function requireSession_(token) {
  var tokenStr = String(token || '').trim();
  if (!tokenStr) throw new Error('Sesión requerida.');

  var cachedSession = readPersistedSession_(tokenStr);

  if (cachedSession && cachedSession.centralAuth === true) {
    return cachedSession;
  }

  if (!cachedSession) {
    try {
      var central = centralSessionFromToken_(tokenStr);
      persistSession_(tokenStr, central.session);
      return central.session;
    } catch (centralError) {
      throw new Error(
        centralError && centralError.message
          ? centralError.message
          : 'La sesión central venció. Abre Productividad nuevamente desde Negocios 2.5.'
      );
    }
  }

  // Compatibilidad temporal con sesiones locales antiguas.
  var current = null;
  var usersReadOk = false;

  try {
    var users = getUsers_();
    usersReadOk = true;
    current = users.filter(function(u){
      return u.usuario === cachedSession.usuario;
    })[0] || null;
  } catch(e) {
    usersReadOk = false;
  }

  if (usersReadOk && current && current.activo === false) {
    deletePersistedSession_(tokenStr);
    throw new Error('Tu acceso fue desactivado.');
  }

  if (usersReadOk && current) {
    var currentVersion = Number(current.versionSesion || 1);
    var sessionVersion = Number(cachedSession.versionSesion || 1);

    if (currentVersion !== sessionVersion) {
      deletePersistedSession_(tokenStr);
      throw new Error('Tus permisos o credenciales cambiaron. Ingresa nuevamente.');
    }

    var freshSession = publicUser_(current);
    persistSession_(tokenStr, freshSession);
    return freshSession;
  }

  var principal = getPrincipalConfigByUsuario_(cachedSession.usuario);
  if (principal) {
    var fallbackSession = publicUser_(principal);
    fallbackSession.versionSesion = Number(cachedSession.versionSesion || 1);
    persistSession_(tokenStr, fallbackSession);
    return fallbackSession;
  }

  deletePersistedSession_(tokenStr);
  throw new Error('No se pudo validar la sesión. Ingresa nuevamente.');
}


function validarCredencialUsuario_(user, rawKey) {
  rawKey = String(rawKey || '').trim();
  if (!rawKey || !user) return false;

  if (String(user.tipoClave || '').toUpperCase() === 'PASSWORD') {
    return !!(user.salt && user.claveHash &&
      hashClave_(rawKey, user.salt) === user.claveHash);
  }

  var clean = normalizeCedula_(rawKey);
  var ced = normalizeCedula_(user.cedula || '');
  if (ced && clean && ced === clean) return true;

  return !!(user.salt && user.claveHash &&
    hashClave_(clean, user.salt) === user.claveHash);
}

function credencialYaUsada_(users, userId, nuevaClave) {
  var raw = String(nuevaClave || '').trim();
  var clean = normalizeCedula_(raw);

  return users.some(function(u) {
    if (u.usuario === userId || u.activo === false) return false;

    if (String(u.tipoClave || '').toUpperCase() === 'PASSWORD') {
      return !!(u.salt && u.claveHash && hashClave_(raw, u.salt) === u.claveHash);
    }

    var ced = normalizeCedula_(u.cedula || '');
    return !!(ced && clean && ced === clean);
  });
}

function cambiarClaveGAS(token, claveActual, nuevaClave) {
  var session=requireSession_(token);
  var users=getUsers_();

  var user=users.filter(function(u){
    return u.usuario===session.usuario&&u.activo!==false;
  })[0];

  if(!user)throw new Error('Usuario no encontrado o inactivo.');

  var actual=String(claveActual||'').trim();
  var nueva=String(nuevaClave||'').trim();
  var cambioForzado=user.requiereCambioClave===true;

  // Si entró correctamente con una clave temporal de un solo uso,
  // la sesión ya demostró posesión de esa clave.
  if(!cambioForzado && !validarCredencialUsuario_(user,actual)){
    throw new Error('La contraseña actual no es correcta.');
  }

  if(nueva.length<8)throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  if(nueva.length>64)throw new Error('La nueva contraseña no puede superar 64 caracteres.');
  if(!cambioForzado && nueva===actual)throw new Error('La nueva contraseña debe ser diferente de la actual.');
  if(credencialYaUsada_(users,user.usuario,nueva)){
    throw new Error('Esa contraseña ya está siendo utilizada por otro acceso. Elige otra.');
  }

  var salt=Utilities.getUuid();
  user.tipoClave='PASSWORD';
  user.salt=salt;
  user.claveHash=hashClave_(nueva,salt);
  user.claveTemporalExpira='';
  user.requiereCambioClave=false;
  user.claveTemporalUsada=false;
  marcarClaveTemporalUsada_(user.usuario);
  user.versionSesion=Number(user.versionSesion||1)+1;
  user.modificadoPor=user.nombre;
  user.ultimaModificacion=new Date();

  saveUsers_(users);
  revocarDispositivosUsuario_(user.usuario);

  try{
    registrarAuditoria_(
      cambioForzado?'CAMBIAR_CLAVE_TEMPORAL':'CAMBIAR_CLAVE',
      session,
      cambioForzado?'Contraseña temporal reemplazada por contraseña definitiva':'Contraseña actualizada por el usuario'
    );
  }catch(e){}

  // La versión de sesión cambió; emitimos una sesión nueva para evitar
  // que el usuario quede expulsado inmediatamente después del cambio.
  deletePersistedSession_(token);
  var newSession=crearSesion_(user);

  return {
    success:true,
    requiereNuevoRecordatorio:true,
    token:newSession.token,
    user:newSession.user
  };
}

function getDispositivosHeaders_() {
  return ['Token Hash','Usuario','Creado','Expira','Ultimo Uso','Activo'];
}

function hashDeviceToken_(token) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token || ''),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest);
}

function crearDispositivoRecordado_(user) {
  var rawToken = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
  var tokenHash = hashDeviceToken_(rawToken);
  var now = new Date();
  var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sh = ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());
    sh.appendRow([tokenHash, user.usuario, now, expires, now, 'SI']);
    SpreadsheetApp.flush();
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }

  return rawToken;
}

function validarDispositivoGAS(deviceToken) {
  return {success:false,error:'Los dispositivos se administran ahora en APS AUTH CENTRAL.'};
}
function validarDispositivoGAS_DESHABILITADO_(deviceToken) {
  var raw = String(deviceToken || '').trim();
  if (!raw) return {success:false,error:'Dispositivo no recordado.'};

  var sh = ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());
  if (sh.getLastRow() < 2) return {success:false,error:'Dispositivo no recordado.'};

  var tokenHash = hashDeviceToken_(raw);
  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  var map = {};
  headers.forEach(function(h,i){ map[normalizeHeader_(h)] = i; });

  var idxHash = map[normalizeHeader_('Token Hash')];
  var idxUser = map[normalizeHeader_('Usuario')];
  var idxExp = map[normalizeHeader_('Expira')];
  var idxLast = map[normalizeHeader_('Ultimo Uso')];
  var idxActivo = map[normalizeHeader_('Activo')];

  var rowIndex = -1;
  var row = null;

  for (var i=0; i<values.length; i++) {
    if (String(values[i][idxHash] || '') === tokenHash) {
      rowIndex = i + 2;
      row = values[i];
      break;
    }
  }

  if (!row) return {success:false,error:'Este dispositivo ya no está autorizado.'};

  var activo = String(row[idxActivo] || '').toUpperCase() !== 'NO';
  var expira = row[idxExp] instanceof Date ? row[idxExp] : new Date(row[idxExp]);

  if (!activo || !expira || isNaN(expira.getTime()) || expira.getTime() <= Date.now()) {
    try { sh.getRange(rowIndex, idxActivo+1).setValue('NO'); } catch(e) {}
    return {success:false,error:'El acceso recordado venció. Ingresa nuevamente.'};
  }

  var userId = String(row[idxUser] || '');
  var user = getUsers_().filter(function(u){
    return u.usuario === userId && u.activo !== false;
  })[0];

  if (!user) {
    try { sh.getRange(rowIndex, idxActivo+1).setValue('NO'); } catch(e) {}
    return {success:false,error:'El usuario ya no está activo.'};
  }

  try { sh.getRange(rowIndex, idxLast+1).setValue(new Date()); } catch(e) {}

  var sesion = crearSesion_(user);
  sesion.remembered = true;
  return sesion;
}

function revocarDispositivoRecordado_(deviceToken) {
  var raw = String(deviceToken || '').trim();
  if (!raw) return;

  var sh = ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());
  if (sh.getLastRow() < 2) return;

  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  var map = {};
  headers.forEach(function(h,i){ map[normalizeHeader_(h)] = i; });

  var idxHash = map[normalizeHeader_('Token Hash')];
  var idxActivo = map[normalizeHeader_('Activo')];
  var target = hashDeviceToken_(raw);

  for (var i=0; i<values.length; i++) {
    if (String(values[i][idxHash] || '') === target) {
      sh.getRange(i+2, idxActivo+1).setValue('NO');
      break;
    }
  }
}

function revocarDispositivosUsuario_(userId) {
  var sh = ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());
  if (sh.getLastRow() < 2) return;

  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  var map = {};
  headers.forEach(function(h,i){ map[normalizeHeader_(h)] = i; });

  var idxUser = map[normalizeHeader_('Usuario')];
  var idxActivo = map[normalizeHeader_('Activo')];

  for (var i=0; i<values.length; i++) {
    if (String(values[i][idxUser] || '') === String(userId || '')) {
      sh.getRange(i+2, idxActivo+1).setValue('NO');
    }
  }
}

function publicUser_(user) {
  return {
    usuario:user.usuario,
    nombre:user.nombre,
    codigoVendedor:user.codigoVendedor||'',
    role:user.rol,
    gerenciaId:user.gerenciaId||'',
    coordinadorId:user.coordinadorId||'',
    supervisorId:user.supervisorId||'',
    gestores:Array.isArray(user.gestores)?user.gestores:[],
    versionSesion:Number(user.versionSesion||1),
    requiereCambioClave:user.requiereCambioClave===true,
    accesoTemporal:String(user.tipoClave||'').toUpperCase()==='TEMPORAL',
    fotoDisponible:user.fotoDisponible===true || !!user.fotoFileId,
    fotoActualizada:user.fotoActualizada instanceof Date
      ? user.fotoActualizada.toISOString()
      : String(user.fotoActualizada||''),
    fotoVersion:Number(user.fotoVersion||0)
  };
}

function configurarSeguridadInicial_() {
  return migrarUsuariosASheets_();
}

function getUsers_() {
  if(Array.isArray(APS_RUNTIME_.users)){
    return APS_RUNTIME_.users.map(cloneUserRuntime_);
  }

  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('USUARIOS_APS');

  if(!sh||sh.getLastRow()<2){
    migrarUsuariosASheets_();
    sh=ss.getSheetByName('USUARIOS_APS');
  }

  if(!sh||sh.getLastRow()<2){
    APS_RUNTIME_.users=[];
    return [];
  }

  sh=ensureSheetHeaders_('USUARIOS_APS',getUsuariosHeaders_());

  var range=sh.getDataRange();
  var values=range.getValues();
  var display=range.getDisplayValues();
  var map=headerMap_(sh);

  values.shift();
  display.shift();

  var users=values.map(function(r,idx){
    var d=display[idx]||r;
    var usuario=String(valueByHeader_(r,map,['Usuario'])||'').trim();
    if(!usuario)return null;

    var activoRaw=valueByHeader_(r,map,['Activo']);
    var activo=!(
      activoRaw===false ||
      String(activoRaw).toUpperCase()==='NO' ||
      String(activoRaw)==='0'
    );

    var cedulaDisplay=String(
      valueByHeader_(d,map,['Cedula','Cédula']) ||
      valueByHeader_(r,map,['Cedula','Cédula']) ||
      ''
    );

    return {
      usuario:usuario,
      nombre:String(valueByHeader_(r,map,['Nombre'])||''),
      cedula:cedulaDisplay,
      codigoVendedor:String(valueByHeader_(r,map,['Codigo Vendedor','Código Vendedor','Codigo'])||''),
      rol:normalizeRole_(valueByHeader_(r,map,['Rol'])),
      gerenciaId:String(valueByHeader_(r,map,['Gerencia'])||''),
      coordinadorId:String(valueByHeader_(r,map,['Coordinador'])||''),
      supervisorId:String(valueByHeader_(r,map,['Supervisor'])||''),
      direccion:String(valueByHeader_(r,map,['Direccion','Dirección'])||'DIRECCION_COMERCIAL'),
      activo:activo,
      tipoClave:String(valueByHeader_(r,map,['Tipo Clave'])||'CEDULA'),
      salt:String(valueByHeader_(r,map,['Salt'])||''),
      claveHash:String(valueByHeader_(r,map,['Clave Hash'])||''),
      versionSesion:Number(valueByHeader_(r,map,['Version Sesion'])||1),
      claveTemporalExpira:valueByHeader_(r,map,['Clave Temporal Expira'])||'',
      requiereCambioClave:String(valueByHeader_(r,map,['Requiere Cambio Clave'])||'').toUpperCase()==='SI',
      claveTemporalUsada:String(valueByHeader_(r,map,['Clave Temporal Usada'])||'').toUpperCase()==='SI',
      fotoFileId:String(valueByHeader_(r,map,['Foto File ID'])||''),
      fotoActualizada:valueByHeader_(r,map,['Foto Actualizada'])||'',
      fechaIngreso:valueByHeader_(r,map,['Fecha Ingreso'])||'',
      modificadoPor:String(valueByHeader_(r,map,['Modificado Por'])||''),
      ultimaModificacion:valueByHeader_(r,map,['Ultima Modificacion','Última Modificación'])||''
    };
  }).filter(Boolean);

  APS_RUNTIME_.users=users.map(cloneUserRuntime_);
  APS_RUNTIME_.gestorMaps=null;

  return users.map(cloneUserRuntime_);
}



function verificarAccesosPrincipales() {
  var users = getUsers_();

  function estado(username) {
    var u = users.filter(function(x){ return x.usuario === username; })[0];
    if (!u) return {usuario:username,existe:false};

    return {
      usuario:username,
      existe:true,
      activo:u.activo !== false,
      tipoClave:String(u.tipoClave || ''),
      tieneSalt:!!u.salt,
      tieneHash:!!u.claveHash,
      versionSesion:Number(u.versionSesion || 1)
    };
  }

  return {
    success:true,
    maite:estado('maite.veras'),
    ariel:estado('ariel.aguilera')
  };
}

function diagnosticoLoginGAS() {
  try {
    var ss = getSpreadsheet_();
    var sh = ss.getSheetByName('USUARIOS_APS');
    if (!sh) return {success:false,error:'No existe la hoja USUARIOS_APS.'};

    var users = getUsers_();
    var active = users.filter(function(u){return u.activo !== false;});
    var passwordUsers = active.filter(function(u){
      return String(u.tipoClave||'').toUpperCase()==='PASSWORD';
    });

    return {
      success:true,
      usuarios:users.length,
      activos:active.length,
      conPassword:passwordUsers.length,
      columnas:sh.getLastColumn(),
      filas:sh.getLastRow(),
      mensaje:'Diagnóstico correcto. No se devuelven contraseñas, salts ni hashes.'
    };
  } catch(e) {
    return {success:false,error:e && e.message ? e.message : String(e)};
  }
}


/**
 * RECUPERACIÓN DE ACCESO PRINCIPAL
 * Ejecutar manualmente UNA SOLA VEZ desde Apps Script cuando sea necesario.
 *
 * Restaura las credenciales definidas en APS_CONFIG.USUARIOS_INICIALES
 * para Maite y Ariel, genera nuevos salts/hashes, reactiva las cuentas,
 * incrementa Version Sesion y revoca dispositivos recordados.
 *
 * No borra usuarios, producción, estructura, fotos ni historial.
 */

function probarConexionUsuarios() {
  var ss = (APS_CONFIG.SPREADSHEET_ID && String(APS_CONFIG.SPREADSHEET_ID).trim())
    ? SpreadsheetApp.openById(String(APS_CONFIG.SPREADSHEET_ID).trim())
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('No hay Google Sheet activo. Configura APS_CONFIG.SPREADSHEET_ID.');
  }

  var sh = ss.getSheetByName('USUARIOS_APS');
  if (!sh) throw new Error('No existe USUARIOS_APS.');

  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log('USUARIOS_APS filas: ' + sh.getLastRow() + ', columnas: ' + sh.getLastColumn());

  return 'OK';
}

function restablecerCredencialesPrincipales() {
  return activarAccesoCedulaMaiteAriel();
}



function restablecerClaveACedulaGAS(token, userId) {
  try {
    var session = requireSession_(token);
    assertCanManageUsers_(session);

    var users = getUsers_();
    var target = users.filter(function(u){
      return u.usuario === String(userId || '');
    })[0];

    if (!target) {
      return {success:false,error:'Usuario no encontrado.'};
    }

    var cedula = normalizeCedula_(target.cedula || '');
    if (!/^\d{11}$/.test(cedula)) {
      return {
        success:false,
        error:'Este usuario no tiene una cédula válida de 11 dígitos para usar como contraseña temporal.'
      };
    }

    var salt = Utilities.getUuid();

    target.tipoClave = 'CEDULA';
    target.salt = salt;
    target.claveHash = hashClave_(cedula, salt);
    target.claveTemporalExpira = '';
    target.requiereCambioClave = false;
    target.claveTemporalUsada = false;
    target.activo = true;
    target.versionSesion = Number(target.versionSesion || 1) + 1;
    target.modificadoPor = session.nombre;
    target.ultimaModificacion = new Date();

    saveUsers_(users);

    try { revocarDispositivosUsuario_(target.usuario); } catch(e) {}

    try {
      registrarCambioEstructura_(
        session,
        target,
        'CREDENCIAL',
        'PASSWORD/PREVIA',
        'CEDULA'
      );
    } catch(e) {}

    try {
      registrarAuditoria_(
        'RESTABLECER_CLAVE_A_CEDULA',
        session,
        target.usuario + ' | ' + target.nombre
      );
    } catch(e) {}

    return {
      success:true,
      usuario:target.usuario,
      nombre:target.nombre,
      mensaje:'La contraseña fue restablecida a la cédula del usuario.'
    };

  } catch(error) {
    return {
      success:false,
      error:error && error.message ? error.message : String(error)
    };
  }
}



/**
 * MAITE Y ARIEL: ACCESO POR CÉDULA
 *
 * Ejecutar UNA SOLA VEZ desde Apps Script.
 * Usa la cédula ya registrada en USUARIOS_APS.
 * No borra usuarios, fotos, producción ni estructura.
 */
function activarAccesoCedulaMaiteAriel() {
  var users = getUsers_();
  var objetivos = ['maite.veras', 'ariel.aguilera'];
  var now = new Date();
  var resultado = [];
  var pendientes = [];

  objetivos.forEach(function(username) {
    var user = users.filter(function(u){
      return u.usuario === username;
    })[0];

    if (!user) {
      pendientes.push(username + ': usuario no encontrado');
      return;
    }

    var cedula = normalizeCedula_(user.cedula || '');

    if (!/^\d{11}$/.test(cedula)) {
      pendientes.push(username + ': falta una cédula de 11 dígitos en USUARIOS_APS');
      return;
    }

    var salt = Utilities.getUuid();

    user.tipoClave = 'CEDULA';
    user.salt = salt;
    user.claveHash = hashClave_(cedula, salt);
    user.activo = true;
    user.versionSesion = Number(user.versionSesion || 1) + 1;
    user.modificadoPor = 'CAMBIO A ACCESO POR CEDULA';
    user.ultimaModificacion = now;

    resultado.push({
      usuario:user.usuario,
      nombre:user.nombre,
      tipoClave:'CEDULA'
    });
  });

  // Guardamos los que sí pudieron convertirse, aunque otro tenga datos incompletos.
  saveUsers_(users);

  resultado.forEach(function(item) {
    try { revocarDispositivosUsuario_(item.usuario); } catch(e) {}
  });

  try {
    registrarAuditoria_(
      'ACCESO_CEDULA_MAITE_ARIEL',
      {usuario:'sistema',nombre:'CONFIGURACION',role:'DIRECTORA'},
      'Convertidos: ' + resultado.map(function(x){return x.usuario;}).join(', ') +
      (pendientes.length ? ' | Pendientes: ' + pendientes.join(' | ') : '')
    );
  } catch(e) {}

  return {
    success: resultado.length > 0,
    convertidos: resultado,
    pendientes: pendientes,
    mensaje: pendientes.length
      ? 'Se convirtieron las cuentas con cédula válida. Revisa los pendientes.'
      : 'Maite y Ariel ya pueden ingresar usando su cédula.'
  };
}



function diagnosticarAccesoCedulaMaiteAriel() {
  var users = getUsers_();

  function estado(username) {
    var u = users.filter(function(x){ return x.usuario === username; })[0];
    if (!u) return {usuario:username,existe:false};

    var cedula = normalizeCedula_(u.cedula || '');

    return {
      usuario:username,
      existe:true,
      activo:u.activo !== false,
      tipoClave:String(u.tipoClave || ''),
      tieneCedulaValida:/^\d{11}$/.test(cedula),
      longitudCedula:cedula.length,
      tieneSalt:!!u.salt,
      tieneHash:!!u.claveHash
    };
  }

  return {
    success:true,
    maite:estado('maite.veras'),
    ariel:estado('ariel.aguilera')
  };
}



function activarAccesoCedulaAriel() {
  var users = getUsers_();
  var user = users.filter(function(u){ return u.usuario === 'ariel.aguilera'; })[0];
  if (!user) throw new Error('No se encontró ariel.aguilera.');

  var cedula = normalizeCedula_(user.cedula || '');
  if (!/^\d{11}$/.test(cedula)) throw new Error('Ariel no tiene una cédula válida de 11 dígitos.');

  var salt = Utilities.getUuid();
  user.tipoClave = 'CEDULA';
  user.salt = salt;
  user.claveHash = hashClave_(cedula, salt);
  user.activo = true;
  user.versionSesion = Number(user.versionSesion || 1) + 1;
  user.modificadoPor = 'RECUPERACION ARIEL CEDULA';
  user.ultimaModificacion = new Date();

  saveUsers_(users);
  try { revocarDispositivosUsuario_(user.usuario); } catch(e) {}

  return 'OK - Ariel ya puede entrar con su cédula.';
}



/**
 * CONFIGURACIÓN DEFINITIVA DE BASE + ACCESO POR CÉDULA.
 *
 * EJECUTAR UNA SOLA VEZ DESDE EL EDITOR DE APPS SCRIPT,
 * estando abierto desde el Google Sheet correcto.
 *
 * 1. Guarda el ID exacto del Spreadsheet en Script Properties.
 * 2. Localiza USUARIOS_APS.
 * 3. Deja a Maite y Ariel activos con acceso por cédula.
 * 4. Genera hashes compatibles con el login.
 * 5. Revoca dispositivos recordados.
 */
function configurarBaseYAccesos() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error(
      'Abre Apps Script desde el Google Sheet de APS (Extensiones > Apps Script) y vuelve a ejecutar.'
    );
  }

  PropertiesService.getScriptProperties().setProperty('APS_SPREADSHEET_ID', active.getId());

  var sh = active.getSheetByName('USUARIOS_APS');
  if (!sh) throw new Error('En esta hoja no existe USUARIOS_APS.');

  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function(h,i){
    map[String(h || '').trim().toLowerCase()] = i + 1;
  });

  function col(name) {
    var c = map[String(name).trim().toLowerCase()];
    if (!c) throw new Error('Falta la columna "' + name + '" en USUARIOS_APS.');
    return c;
  }

  var required = ['Usuario','Cedula','Activo','Tipo Clave','Salt','Clave Hash'];
  required.forEach(col);

  // Columnas opcionales: si faltan, las creamos.
  ['Version Sesion','Modificado Por','Ultima Modificacion'].forEach(function(h){
    if (!map[h.toLowerCase()]) {
      headers.push(h);
      sh.getRange(1,headers.length).setValue(h);
      map[h.toLowerCase()] = headers.length;
    }
  });

  var lastRow = sh.getLastRow();
  if (lastRow < 2) throw new Error('USUARIOS_APS está vacía.');

  var usernames = sh.getRange(2,col('Usuario'),lastRow-1,1).getValues();

  function findRow(username) {
    for (var i=0;i<usernames.length;i++) {
      if (String(usernames[i][0] || '').trim().toLowerCase() === username.toLowerCase()) return i+2;
    }
    return -1;
  }

  function resetCedula(username, fallbackCedula) {
    var row = findRow(username);
    if (row < 0) throw new Error('No se encontró ' + username + ' en USUARIOS_APS.');

    var cedulaRaw = sh.getRange(row,col('Cedula')).getDisplayValue();
    var cedula = normalizeCedula_(cedulaRaw || fallbackCedula || '');

    if (!/^\d{11}$/.test(cedula)) {
      throw new Error('La cédula de ' + username + ' no tiene 11 dígitos.');
    }

    // Guardarla como texto para preservar ceros iniciales.
    sh.getRange(row,col('Cedula')).setNumberFormat('@').setValue(cedula);

    var salt = Utilities.getUuid();
    var hash = hashClave_(cedula, salt);
    var version = Number(sh.getRange(row,col('Version Sesion')).getValue() || 1);

    sh.getRange(row,col('Activo')).setValue('SI');
    sh.getRange(row,col('Tipo Clave')).setValue('CEDULA');
    sh.getRange(row,col('Salt')).setValue(salt);
    sh.getRange(row,col('Clave Hash')).setValue(hash);
    sh.getRange(row,col('Version Sesion')).setValue(version + 1);
    sh.getRange(row,col('Modificado Por')).setValue('CONFIGURACION DEFINITIVA');
    sh.getRange(row,col('Ultima Modificacion')).setValue(new Date());

    return {usuario:username, cedula:cedula};
  }

  var maite = resetCedula('maite.veras','00116321597');
  var ariel = resetCedula('ariel.aguilera','00118554757');

  SpreadsheetApp.flush();

  // Verificación directa contra lo que quedó escrito en la hoja.
  function verify(item) {
    var row = findRow(item.usuario);
    var salt = String(sh.getRange(row,col('Salt')).getValue() || '');
    var hash = String(sh.getRange(row,col('Clave Hash')).getValue() || '');
    var tipo = String(sh.getRange(row,col('Tipo Clave')).getValue() || '');
    var activo = String(sh.getRange(row,col('Activo')).getValue() || '');

    return {
      usuario:item.usuario,
      activo:activo,
      tipoClave:tipo,
      cedulaValida:/^\d{11}$/.test(item.cedula),
      hashCoincide:hashClave_(item.cedula,salt) === hash
    };
  }

  try { revocarDispositivosUsuario_('maite.veras'); } catch(e) {}
  try { revocarDispositivosUsuario_('ariel.aguilera'); } catch(e) {}

  return {
    success:true,
    spreadsheetId:active.getId(),
    spreadsheetName:active.getName(),
    maite:verify(maite),
    ariel:verify(ariel),
    mensaje:'Base vinculada y accesos por cédula configurados.'
  };
}

function diagnosticoAccesoDefinitivo() {
  var ss = getSpreadsheet_();
  var users = getUsers_();

  function status(username) {
    var u = users.filter(function(x){return x.usuario===username;})[0];
    if(!u) return {usuario:username,existe:false};
    var ced=normalizeCedula_(u.cedula||'');
    return {
      usuario:username,
      existe:true,
      activo:u.activo!==false,
      tipoClave:String(u.tipoClave||''),
      cedulaValida:/^\d{11}$/.test(ced),
      hashCoincide:!!(u.salt && u.claveHash && hashClave_(ced,u.salt)===u.claveHash)
    };
  }

  return {
    success:true,
    spreadsheetId:ss.getId(),
    spreadsheetName:ss.getName(),
    maite:status('maite.veras'),
    ariel:status('ariel.aguilera')
  };
}



/**
 * EJECUTAR UNA SOLA VEZ.
 * Convierte todas las cédulas de USUARIOS_APS a texto de 11 dígitos,
 * preservando los ceros iniciales.
 */
function normalizarCedulasUsuarios() {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName('USUARIOS_APS');
  if (!sh) throw new Error('No existe USUARIOS_APS.');

  var range = sh.getDataRange();
  var values = range.getValues();
  var display = range.getDisplayValues();
  var map = headerMap_(sh);
  var idxCed = map[normalizeHeader_('Cedula')];
  var idxUser = map[normalizeHeader_('Usuario')];

  if (idxCed === undefined) throw new Error('No existe la columna Cedula.');

  var corregidas = 0;
  var invalidas = [];

  for (var i=1; i<values.length; i++) {
    var username = idxUser !== undefined ? String(values[i][idxUser] || '') : ('fila '+(i+1));
    var visible = String(display[i][idxCed] || values[i][idxCed] || '');
    var ced = normalizeCedula_(visible);

    if (!ced) continue;

    if (/^\d{11}$/.test(ced)) {
      sh.getRange(i+1, idxCed+1).setNumberFormat('@').setValue(ced);
      corregidas++;
    } else {
      invalidas.push(username + ': ' + visible);
    }
  }

  SpreadsheetApp.flush();

  return {
    success:true,
    corregidas:corregidas,
    invalidas:invalidas
  };
}



function diagnosticarLoginCedula() {
  var users = getUsers_();

  function status(username) {
    var u = users.filter(function(x){return x.usuario===username;})[0];
    if (!u) return {usuario:username,existe:false};

    var ced = normalizeCedula_(u.cedula || '');

    return {
      usuario:username,
      existe:true,
      activo:u.activo !== false,
      tipoClave:String(u.tipoClave || ''),
      cedula11:/^\d{11}$/.test(ced),
      ultimos4:ced ? ced.slice(-4) : '',
      longitud:ced.length
    };
  }

  return {
    success:true,
    maite:status('maite.veras'),
    ariel:status('ariel.aguilera')
  };
}



function probarAccesoPrincipal() {
  var users = getUsers_();

  function one(username, cedula) {
    var u = users.filter(function(x){return x.usuario===username;})[0];
    return {
      usuario: username,
      encontrado: !!u,
      activo: !!(u && u.activo !== false),
      cedulaEntradaValida: /^\d{11}$/.test(cedula),
      cedulaHojaValida: !!(u && /^\d{11}$/.test(normalizeCedula_(u.cedula || ''))),
      coincideConHoja: !!(u && normalizeCedula_(u.cedula || '') === cedula)
    };
  }

  var ss = getSpreadsheet_();

  return {
    success:true,
    spreadsheetId:ss.getId(),
    spreadsheetName:ss.getName(),
    maite:one('maite.veras','00116321597'),
    ariel:one('ariel.aguilera','00118554757')
  };
}



function obtenerBuildGAS() {
  return {
    success:true,
    build:'APS-20260919-ARIEL-DIRECTO-V2',
    spreadsheetId:(function(){
      try { return getSpreadsheet_().getId(); } catch(e) { return ''; }
    })()
  };
}



function probarAccesoArielDirecto() {
  var u = getDirectPrincipalUser_('00118554757');
  return {
    success:!!u,
    usuario:u ? u.usuario : '',
    nombre:u ? u.nombre : '',
    activo:u ? u.activo !== false : false,
    role:u ? u.rol : '',
    versionSesion:u ? Number(u.versionSesion || 1) : 0,
    build:'APS-20260919-ARIEL-DIRECTO-V2'
  };
}


/* ============================================================
   GESTIÓN DE ACCESOS
   ============================================================ */

function listarUsuariosGAS(token) {
  var session = requireSession_(token);
  assertCanManageUsers_(session);

  var usersRaw = getUsers_();
  var users = usersRaw.map(function(user) {
    return {
      id: user.usuario,
      nombre: user.nombre,
      cedula: user.cedula || '',
      codigoVendedor:user.codigoVendedor||'',
      role: user.rol,
      gerenciaId: user.gerenciaId || '',
      coordinadorId: user.coordinadorId || '',
      supervisorId: user.supervisorId || '',
      direccion: user.direccion || 'DIRECCION_COMERCIAL',
      activo:user.activo!==false,
      accesoTemporal:String(user.tipoClave||'').toUpperCase()==='TEMPORAL',
      requiereCambioClave:user.requiereCambioClave===true,
      fotoDisponible:!!user.fotoFileId,
      fotoActualizada: user.fotoActualizada instanceof Date
        ? Utilities.formatDate(user.fotoActualizada, APS_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
        : String(user.fotoActualizada || ''),
      esCuentaPrincipal: user.usuario === 'maite.veras'
    };
  });

  var estructuras = [];
  var estructuraWarning = '';
  try { estructuras = leerEstructuras_(); }
  catch(e) { estructuraWarning = e && e.message ? e.message : String(e); }

  return {
    success: true,
    usuarios: users,
    rolesPermitidos: ['GERENTE', 'COORDINADOR', 'SUPERVISOR', 'GESTOR'],
    gerencias: [
      { id: 'G_ARIEL', nombre: 'Gerencia de Ariel Aguilera' },
      { id: 'G_BELKIS', nombre: 'Gerencia de Belkis Andujar' },
      { id: 'G_ANGEL', nombre: 'Gerencia de José Ángel González' }
    ],
    estructuras: estructuras,
    estructuraWarning: estructuraWarning
  };
}

function guardarUsuarioGAS(token, data) {
  var session = requireSession_(token);
  assertCanManageUsers_(session);

  data = data || {};
  var name = safeText_(data.nombre || '').toUpperCase();
  var role = normalizeRole_(data.role);
  var cedula = normalizeCedula_(data.cedula);
  var codigoVendedor = safeText_(data.codigoVendedor || '');
  var gerenciaId = safeText_(data.gerenciaId || '');
  var coordinadorId = safeText_(data.coordinadorId || '');
  var supervisorId = safeText_(data.supervisorId || '');

  if (!name) throw new Error('Ingresa el nombre completo.');
  if (['GERENTE','COORDINADOR','SUPERVISOR','GESTOR'].indexOf(role) === -1) {
    throw new Error('Selecciona un cargo válido.');
  }
  if (!/^\d{11}$/.test(cedula)) throw new Error('La cédula debe tener 11 dígitos.');
  if (!gerenciaId) throw new Error('Selecciona una gerencia.');

  if (role === 'GERENTE' || role === 'COORDINADOR') {
    coordinadorId = '';
    supervisorId = '';
  } else if (role === 'SUPERVISOR') {
    supervisorId = '';
  }

  var users = getUsers_();

  var duplicate = users.filter(function(u) {
    return normalizeCedula_(u.cedula || '') === cedula;
  })[0];
  if (duplicate) {
    throw new Error(duplicate.activo === false
      ? 'Ese colaborador ya existe y está inactivo. Usa Reactivar.'
      : 'Ya existe un usuario registrado con esa cédula.');
  }

  validarAsignacionUsuario_(users, role, gerenciaId, coordinadorId, supervisorId);

  if (role === 'GESTOR' && supervisorId) {
    var sup = users.filter(function(u){ return u.usuario === supervisorId; })[0];
    if (sup && sup.coordinadorId) coordinadorId = sup.coordinadorId;
  }

  var salt = Utilities.getUuid();
  var userId = makeUserId_(name, users);
  var now = new Date();

  var nuevo = {
    usuario: userId, nombre: name, rol: role,
    gerenciaId: gerenciaId, coordinadorId: coordinadorId, supervisorId: supervisorId,
    direccion: 'DIRECCION_COMERCIAL', gestores: [],
    cedula: cedula, codigoVendedor:codigoVendedor, tipoClave: 'CEDULA', salt: salt,
    claveHash: hashClave_(cedula, salt), versionSesion: 1,
    activo: true, fechaIngreso: now, modificadoPor: session.nombre, ultimaModificacion: now
  };

  users.push(nuevo);
  saveUsers_(users);

  registrarCambioEstructura_(
    session, nuevo, 'ALTA', '',
    role + ' | ' + gerenciaId +
    (coordinadorId ? ' | Coord: ' + coordinadorId : '') +
    (supervisorId ? ' | Sup: ' + supervisorId : '')
  );

  registrarAuditoria_('AGREGAR_USUARIO', session, name + ' · ' + role);
  return { success: true, id: userId };
}

function reasignarUsuarioGAS(token, data) {
  return actualizarUsuarioGAS(token, data);
}

function desactivarUsuarioGAS(token, userId) {
  var session=requireSession_(token);
  assertCanManageUsers_(session);

  var users=getUsers_();
  var target=users.filter(function(u){return u.usuario===String(userId||'');})[0];
  if(!target) throw new Error('Usuario no encontrado.');
  if(target.usuario==='maite.veras'||target.rol==='DIRECTORA') {
    throw new Error('La cuenta principal de Dirección no puede desactivarse.');
  }

  if(target.rol==='GERENTE'||target.rol==='COORDINADOR'){
    return desactivarUsuariosConTransicionGAS(token,{
      userIds:[target.usuario],
      modo:'TRANSICION',
      motivo:'Vacante temporal mientras Dirección designa sustituto.'
    });
  }

  if (target.rol === 'SUPERVISOR') {
    users.forEach(function(u){
      if (u.supervisorId === target.usuario) {
        u.supervisorId = '';
        u.versionSesion = Number(u.versionSesion || 1) + 1;
        u.modificadoPor = session.nombre;
        u.ultimaModificacion = new Date();
      }
    });
  }

  var anterior=target.activo!==false?'ACTIVO':'INACTIVO';
  target.versionSesion=Number(target.versionSesion||1)+1;
  target.activo=false;
  target.modificadoPor=session.nombre;
  target.ultimaModificacion=new Date();

  saveUsers_(users);
  revocarDispositivosUsuario_(target.usuario);
  registrarCambioEstructura_(session,target,'ESTADO',anterior,'INACTIVO');
  registrarAuditoria_('QUITAR_USUARIO',session,target.nombre);
  return {success:true};
}

function reactivarUsuarioGAS(token, userId) {
  var session = requireSession_(token);
  assertCanManageUsers_(session);

  var users = getUsers_();
  var target = users.filter(function(u) {
    return u.usuario === String(userId || '');
  })[0];

  if (!target) throw new Error('Usuario no encontrado.');

  var anterior = target.activo !== false ? 'ACTIVO' : 'INACTIVO';
  target.versionSesion = Number(target.versionSesion || 1) + 1;
  target.activo = true;
  target.modificadoPor = session.nombre;
  target.ultimaModificacion = new Date();

  saveUsers_(users);
  registrarCambioEstructura_(session, target, 'ESTADO', anterior, 'ACTIVO');
  registrarAuditoria_('REACTIVAR_USUARIO', session, target.nombre);

  return { success: true };
}

function assertCanManageUsers_(session) {
  if (!session || session.role !== 'DIRECTORA') {
    throw new Error('La administración de usuarios está centralizada en Dirección.');
  }
}

function saveUsers_(users) {
  if (!Array.isArray(users)) throw new Error('Listado de usuarios inválido.');

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var sh = ensureSheetHeaders_('USUARIOS_APS', getUsuariosHeaders_());
    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var rows = users.map(function(u) {
      var obj = {};
      function put(h,v){ obj[normalizeHeader_(h)] = v; }

      put('Usuario', u.usuario || '');
      put('Nombre', u.nombre || '');
      put('Cedula', u.cedula || '');
      put('Codigo Vendedor', u.codigoVendedor || '');
      put('Rol', u.rol || 'GESTOR');
      put('Gerencia', u.gerenciaId || '');
      put('Coordinador', u.coordinadorId || '');
      put('Supervisor', u.supervisorId || '');
      put('Direccion', u.direccion || 'DIRECCION_COMERCIAL');
      put('Activo', u.activo !== false ? 'SI' : 'NO');
      put('Tipo Clave', u.tipoClave || 'CEDULA');
      put('Salt', u.salt || '');
      put('Clave Hash', u.claveHash || '');
      put('Version Sesion', Number(u.versionSesion || 1));
      put('Clave Temporal Expira', u.claveTemporalExpira || '');
      put('Requiere Cambio Clave', u.requiereCambioClave === true ? 'SI' : 'NO');
      put('Clave Temporal Usada', u.claveTemporalUsada === true ? 'SI' : 'NO');
      put('Foto File ID', u.fotoFileId || '');
      put('Foto Actualizada', u.fotoActualizada || '');
      put('Fecha Ingreso', u.fechaIngreso || '');
      put('Modificado Por', u.modificadoPor || '');
      put('Ultima Modificacion', u.ultimaModificacion || '');

      return headers.map(function(h) {
        return obj[normalizeHeader_(h)] !== undefined ? obj[normalizeHeader_(h)] : '';
      });
    });

    if (sh.getLastRow() > 1) {
      sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
    }
    if (rows.length) {
      sh.getRange(2,1,rows.length,headers.length).setValues(rows);
    }

    SpreadsheetApp.flush();

    // Mantiene consistente la caché de esta misma ejecución.
    APS_RUNTIME_.users=users.map(cloneUserRuntime_);
    APS_RUNTIME_.gestorMaps=null;

    // Copia de respaldo para recuperación; la fuente oficial es USUARIOS_APS.
    try {
      PropertiesService.getScriptProperties().setProperty('APS_USERS_JSON_BACKUP', JSON.stringify(users));
    } catch(e) {}

  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}


function getUsuariosHeaders_() {
  return [
    'Usuario','Nombre','Cedula','Codigo Vendedor','Rol','Gerencia','Coordinador','Supervisor','Direccion','Activo',
    'Tipo Clave','Salt','Clave Hash','Version Sesion',
    'Clave Temporal Expira','Requiere Cambio Clave','Clave Temporal Usada',
    'Foto File ID','Foto Actualizada','Fecha Ingreso','Modificado Por','Ultima Modificacion'
  ];
}


function repararCodigosVendedorConocidos_(){
  try{
    var sh=ensureSheetHeaders_('USUARIOS_APS',getUsuariosHeaders_());
    if(sh.getLastRow()<2)return;

    var data=sh.getDataRange().getDisplayValues();
    var map=headerMap_(sh);
    var idxUsuario=map[normalizeHeader_('Usuario')];
    var idxCedula=map[normalizeHeader_('Cedula')];
    var idxCodigo=map[normalizeHeader_('Codigo Vendedor')];

    if(idxUsuario===undefined||idxCedula===undefined||idxCodigo===undefined)return;

    var codigoPorCedula={
      '00118554757':'2312',
      '22300180571':'2553',
      '22900295787':'2554',
      '40220769166':'2555',
      '02601380237':'2140',
      '22301618132':'2557',
      '22300151606':'2558',
      '00500439559':'2560',
      '00119084549':'1631'
    };

    var changed=false;

    for(var i=1;i<data.length;i++){
      var usuario=String(data[i][idxUsuario]||'').trim();
      var cedula=normalizeCedula_(data[i][idxCedula]||'');
      var codigoActual=String(data[i][idxCodigo]||'').trim();

      // Nunca crea personas nuevas: solo completa usuarios ya existentes.
      if(!usuario||!cedula)continue;

      var codigo=codigoPorCedula[cedula]||'';
      if(!codigo)continue;

      // Respeta cualquier código ya definido manualmente.
      if(!codigoActual){
        sh.getRange(i+1,idxCodigo+1).setValue(codigo);
        changed=true;
      }
    }

    if(changed)SpreadsheetApp.flush();
  }catch(e){}
}

function getHistorialEstructuraHeaders_() {
  return [
    'Fecha Hora','Usuario ID','Nombre','Accion','Campo',
    'Valor Anterior','Valor Nuevo','Modificado Por'
  ];
}

function migrarUsuariosASheets_() {
  var sh = ensureSheetHeaders_('USUARIOS_APS', getUsuariosHeaders_());
  ensureSheetHeaders_('HISTORIAL_ESTRUCTURA', getHistorialEstructuraHeaders_());
  ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());

  // Si ya hay usuarios, solo aseguramos columnas y salimos.
  if (sh.getLastRow() >= 2) {
    return 'USUARIOS_APS ya contiene ' + (sh.getLastRow()-1) + ' usuario(s). No se sobrescribió.';
  }

  var source = [];
  try {
    var raw = PropertiesService.getScriptProperties().getProperty('APS_USERS_JSON');
    if (raw) source = JSON.parse(raw);
  } catch(e) {}

  if (!Array.isArray(source) || !source.length) {
    source = (APS_CONFIG.USUARIOS_INICIALES || []).map(function(user) {
      var username = normalizeUsername_(user.usuario);
      var keyType = String(user.tipoClave || 'CEDULA').toUpperCase();
      var accessKey = keyType === 'CEDULA'
        ? normalizeCedula_(user.cedula)
        : String(user.clave || '').trim();
      var salt = Utilities.getUuid();

      return {
        usuario: username,
        nombre: safeText_(user.nombre),
        rol: normalizeRole_(user.rol),
        gerenciaId: safeText_(user.gerenciaId || ''),
        coordinadorId: safeText_(user.coordinadorId || ''),
        supervisorId: safeText_(user.supervisorId || ''),
        direccion: 'DIRECCION_COMERCIAL',
        gestores: [],
        cedula: user.cedula || '',
        codigoVendedor: user.codigoVendedor || (username==='ariel.aguilera' ? '2312' : ''),
        tipoClave: keyType,
        salt: salt,
        claveHash: hashClave_(accessKey, salt),
        versionSesion: 1,
        activo: true,
        fechaIngreso: new Date(),
        modificadoPor: 'MIGRACION INICIAL',
        ultimaModificacion: new Date()
      };
    });
  } else {
    source = source.map(function(u) {
      u.direccion = 'DIRECCION_COMERCIAL';
      if (u.activo === undefined) u.activo = true;
      if (!u.versionSesion) u.versionSesion = 1;
      if (!u.fechaIngreso) u.fechaIngreso = new Date();
      if (!u.modificadoPor) u.modificadoPor = 'MIGRACION INICIAL';
      if (!u.ultimaModificacion) u.ultimaModificacion = new Date();
      return u;
    });
  }

  saveUsers_(source);

  var dirSession = {
    usuario:'sistema',
    nombre:'MIGRACION INICIAL',
    role:'DIRECTORA'
  };

  source.forEach(function(u) {
    registrarCambioEstructura_(
      dirSession, u, 'MIGRACION', '',
      (u.rol||'') + ' | ' + (u.gerenciaId||'') + (u.coordinadorId ? ' | '+u.coordinadorId : '')
    );
  });

  return 'Migrados ' + source.length + ' usuario(s) a USUARIOS_APS.';
}

function validarAsignacionUsuario_(users, role, gerenciaId, coordinadorId, supervisorId) {
  role = normalizeRole_(role);
  gerenciaId = String(gerenciaId || '');
  coordinadorId = String(coordinadorId || '');
  supervisorId = String(supervisorId || '');

  if (!gerenciaId) throw new Error('Selecciona una gerencia.');

  var coord = null;
  if (coordinadorId) {
    coord = users.filter(function(u) {
      return u.usuario === coordinadorId &&
             u.activo !== false &&
             u.rol === 'COORDINADOR' &&
             u.gerenciaId === gerenciaId;
    })[0];
    if (!coord) throw new Error('El coordinador seleccionado no pertenece a la gerencia indicada.');
  }

  if (role === 'SUPERVISOR') return true;

  if (role === 'GESTOR' && supervisorId) {
    var sup = users.filter(function(u) {
      return u.usuario === supervisorId &&
             u.activo !== false &&
             u.rol === 'SUPERVISOR' &&
             u.gerenciaId === gerenciaId;
    })[0];

    if (!sup) throw new Error('El supervisor seleccionado no pertenece a la gerencia indicada.');

    if (sup.coordinadorId && coordinadorId && sup.coordinadorId !== coordinadorId) {
      throw new Error('El supervisor seleccionado pertenece a otro coordinador.');
    }
  }

  return true;
}

function registrarCambioEstructura_(session, user, accion, anterior, nuevo, campo) {
  try {
    var sh = ensureSheetHeaders_('HISTORIAL_ESTRUCTURA', getHistorialEstructuraHeaders_());
    sh.appendRow([
      new Date(),
      safeText_(user.usuario || ''),
      safeText_(user.nombre || ''),
      safeText_(accion || ''),
      safeText_(campo || accion || ''),
      safeText_(anterior || ''),
      safeText_(nuevo || ''),
      safeText_((session && session.nombre) || '')
    ]);
  } catch(e) {
    console.warn('Historial de estructura no guardado: ' + e.message);
  }
}

function actualizarUsuarioGAS(token, data) {
  var session = requireSession_(token);
  assertCanManageUsers_(session);

  data = data || {};
  var userId = String(data.userId || '').trim();
  if (!userId) throw new Error('Usuario requerido.');

  var users = getUsers_();
  var target = users.filter(function(u) { return u.usuario === userId; })[0];
  if (!target) throw new Error('Usuario no encontrado.');

  if (target.usuario === 'maite.veras' || target.rol === 'DIRECTORA') {
    throw new Error('La cuenta principal de Dirección no se modifica desde este formulario.');
  }

  var name = safeText_(data.nombre || target.nombre).toUpperCase();
  var role = normalizeRole_(data.role || target.rol);
  var cedula = normalizeCedula_(data.cedula || target.cedula);
  var codigoVendedor = safeText_(data.codigoVendedor !== undefined ? data.codigoVendedor : (target.codigoVendedor || ''));
  var gerenciaId = safeText_(data.gerenciaId || '');
  var coordinadorId = safeText_(data.coordinadorId || '');
  var supervisorId = safeText_(data.supervisorId || '');

  if (['GERENTE','COORDINADOR','SUPERVISOR','GESTOR'].indexOf(role) === -1) {
    throw new Error('Selecciona un cargo válido.');
  }
  if (!/^\d{11}$/.test(cedula)) throw new Error('La cédula debe tener 11 dígitos.');
  if (!gerenciaId) throw new Error('Selecciona una gerencia.');

  if (role === 'GERENTE' || role === 'COORDINADOR') {
    coordinadorId = '';
    supervisorId = '';
  } else if (role === 'SUPERVISOR') {
    supervisorId = '';
  }

  var duplicate = users.filter(function(u) {
    return u.usuario !== userId && normalizeCedula_(u.cedula || '') === cedula;
  })[0];
  if (duplicate) throw new Error('Ya existe otro usuario con esa cédula.');

  validarAsignacionUsuario_(users, role, gerenciaId, coordinadorId, supervisorId);

  if (role === 'GESTOR' && supervisorId) {
    var sup = users.filter(function(u){ return u.usuario === supervisorId; })[0];
    if (sup && sup.coordinadorId) coordinadorId = sup.coordinadorId;
  }

  var before = {
    nombre: target.nombre, cedula: target.cedula, rol: target.rol,
    gerenciaId: target.gerenciaId, coordinadorId: target.coordinadorId,
    supervisorId: target.supervisorId || ''
  };

  target.nombre = name;
  target.cedula = cedula;
  target.codigoVendedor = codigoVendedor;
  target.rol = role;
  target.gerenciaId = gerenciaId;
  target.coordinadorId = coordinadorId;
  target.supervisorId = supervisorId;
  target.direccion = 'DIRECCION_COMERCIAL';
  target.modificadoPor = session.nombre;
  target.ultimaModificacion = new Date();

  var cambiaAccesoOEstructura =
    String(before.cedula||'') !== String(cedula||'') ||
    String(before.rol||'') !== String(role||'') ||
    String(before.gerenciaId||'') !== String(gerenciaId||'') ||
    String(before.coordinadorId||'') !== String(coordinadorId||'') ||
    String(before.supervisorId||'') !== String(supervisorId||'');

  if (cambiaAccesoOEstructura) target.versionSesion = Number(target.versionSesion || 1) + 1;

  if (normalizeCedula_(before.cedula || '') !== cedula) {
    var salt = Utilities.getUuid();
    target.tipoClave = 'CEDULA';
    target.salt = salt;
    target.claveHash = hashClave_(cedula, salt);
  }

  saveUsers_(users);

  [
    ['NOMBRE', before.nombre, target.nombre],
    ['CEDULA', before.cedula, target.cedula],
    ['ROL', before.rol, target.rol],
    ['GERENCIA', before.gerenciaId, target.gerenciaId],
    ['COORDINADOR', before.coordinadorId, target.coordinadorId],
    ['SUPERVISOR', before.supervisorId, target.supervisorId]
  ].forEach(function(c) {
    if (String(c[1] || '') !== String(c[2] || '')) {
      registrarCambioEstructura_(session, target, 'CAMBIO', c[1], c[2], c[0]);
    }
  });

  registrarAuditoria_('ACTUALIZAR_USUARIO', session, target.nombre + ' · ' + target.rol + ' · ' + target.gerenciaId);
  return { success:true, id:target.usuario };
}

function makeUserId_(name, users) {
  var base = normalizeHeader_(name).replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'usuario';
  var candidate = base, suffix = 2;
  while (users.some(function(u) { return u.usuario === candidate; })) candidate = base + '.' + suffix++;
  return candidate;
}

function getAllowedGestores_(session) {
  var users = getUsers_().filter(function(u) { return u.activo !== false; });

  if (session.role === 'DIRECTORA') return users.map(function(u) { return u.nombre; });

  if (session.role === 'GERENTE') {
    return users.filter(function(u) {
      return u.gerenciaId === session.gerenciaId;
    }).map(function(u) { return u.nombre; });
  }

  if (session.role === 'COORDINADOR') {
    var supervisors = users.filter(function(u){
      return u.rol === 'SUPERVISOR' &&
             u.gerenciaId === session.gerenciaId &&
             u.coordinadorId === session.usuario;
    }).map(function(u){ return u.usuario; });

    return users.filter(function(u) {
      return u.usuario === session.usuario ||
             (u.gerenciaId === session.gerenciaId &&
               (u.coordinadorId === session.usuario ||
                supervisors.indexOf(u.supervisorId) !== -1));
    }).map(function(u) { return u.nombre; });
  }

  if (session.role === 'SUPERVISOR') {
    return users.filter(function(u){
      return u.usuario === session.usuario ||
             (u.rol === 'GESTOR' && u.gerenciaId === session.gerenciaId && u.supervisorId === session.usuario);
    }).map(function(u){ return u.nombre; });
  }

  return [session.nombre];
}

function getAllowedArsGestores_(session) {
  var users = getUsers_().filter(function(u) {
    return u.activo !== false && u.rol === 'GESTOR';
  });

  if (session.role === 'DIRECTORA') return users;
  if (session.role === 'GERENTE') {
    return users.filter(function(u) { return u.gerenciaId === session.gerenciaId; });
  }
  if (session.role === 'COORDINADOR') {
    var all = getUsers_().filter(function(u){ return u.activo !== false; });
    var supervisorIds = all.filter(function(u){
      return u.rol === 'SUPERVISOR' &&
             u.gerenciaId === session.gerenciaId &&
             u.coordinadorId === session.usuario;
    }).map(function(u){ return u.usuario; });

    return users.filter(function(u) {
      return u.gerenciaId === session.gerenciaId &&
             (u.coordinadorId === session.usuario || supervisorIds.indexOf(u.supervisorId) !== -1);
    });
  }
  if (session.role === 'SUPERVISOR') {
    return users.filter(function(u) {
      return u.gerenciaId === session.gerenciaId && u.supervisorId === session.usuario;
    });
  }
  if (session.role === 'GESTOR') {
    return users.filter(function(u) { return u.usuario === session.usuario; });
  }
  return [];
}

function normalizarNombrePersona_(value) {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolverGestorARS_(nombreRepresentante, cedulaRepresentante) {
  if(!APS_RUNTIME_.gestorMaps){
    var gestores=getUsers_().filter(function(u){
      return u.activo!==false && u.rol==='GESTOR';
    });

    var byCedula={},byNombre={};
    gestores.forEach(function(u){
      var c=normalizeCedula_(u.cedula||'');
      var n=normalizarNombrePersona_(u.nombre||'');
      if(c&&!byCedula[c])byCedula[c]=u;
      if(n&&!byNombre[n])byNombre[n]=u;
    });

    APS_RUNTIME_.gestorMaps={byCedula:byCedula,byNombre:byNombre};
  }

  var nombre=normalizarNombrePersona_(nombreRepresentante);
  var cedula=normalizeCedula_(cedulaRepresentante);
  var encontrado=null;

  if(cedula) encontrado=APS_RUNTIME_.gestorMaps.byCedula[cedula]||null;
  if(!encontrado&&nombre) encontrado=APS_RUNTIME_.gestorMaps.byNombre[nombre]||null;

  if(!encontrado){
    return {
      encontrado:false,
      gestor:'',
      cedula:'',
      gerenciaId:'',
      coordinadorId:'',
      supervisorId:'',
      usuario:'',
      motivo:nombreRepresentante
        ? 'El representante que aparece en el formulario no pertenece a la Dirección de Negocios de Maite.'
        : 'No se detectó un representante perteneciente a la Dirección de Negocios de Maite.'
    };
  }

  return {
    encontrado:true,
    gestor:encontrado.nombre,
    cedula:encontrado.cedula||'',
    gerenciaId:encontrado.gerenciaId||'',
    coordinadorId:encontrado.coordinadorId||'',
    supervisorId:encontrado.supervisorId||'',
    usuario:encontrado.usuario
  };
}

/* ============================================================
   HOJA DE CÁLCULO Y DRIVE
   ============================================================ */



/* ============================================================
   CACHE DE EJECUCIÓN — SEGURO / SIN DATOS OBSOLETOS
   ------------------------------------------------------------
   Solo vive durante UNA ejecución de Apps Script.
   No usa CacheService para producción, por lo que una nueva
   llamada siempre vuelve a leer Google Sheets.
   ============================================================ */
var APS_RUNTIME_ = {
  spreadsheet:null,
  users:null,
  gestorMaps:null
};

function resetRuntimeCache_(){
  APS_RUNTIME_.spreadsheet=null;
  APS_RUNTIME_.users=null;
  APS_RUNTIME_.gestorMaps=null;
}

function cloneUserRuntime_(u){
  return Object.assign({},u);
}


function esBaseAPS_(ss) {
  if (!ss) return false;
  try {
    return !!(
      ss.getSheetByName('USUARIOS_APS') ||
      ss.getSheetByName('PRODUCCION_ARS') ||
      ss.getSheetByName('AFILIACIONES_ARS')
    );
  } catch(e) {
    return false;
  }
}

function guardarIdBaseAPS_(ss) {
  if (!ss) return;
  try {
    PropertiesService.getScriptProperties().setProperty('APS_SPREADSHEET_ID', ss.getId());
  } catch(e) {}
}

function getSpreadsheet_() {
  if (APS_RUNTIME_.spreadsheet) return APS_RUNTIME_.spreadsheet;

  var props = PropertiesService.getScriptProperties();
  var configId = String(APS_CONFIG.SPREADSHEET_ID || '').trim();
  var savedId = String(props.getProperty('APS_SPREADSHEET_ID') || '').trim();

  /*
   * REPARACIÓN 24/09/2026
   * La base configurada es la autoridad.
   * Antes se intentaba primero getActiveSpreadsheet() / propiedad guardada,
   * lo que podía dejar Productividad apuntando a otra hoja o sin base
   * cuando el Web App se ejecutaba fuera del editor.
   */
  if (configId) {
    try {
      var configured = SpreadsheetApp.openById(configId);

      if (!esBaseAPS_(configured)) {
        throw new Error(
          'La base configurada no contiene USUARIOS_APS, PRODUCCION_ARS ni AFILIACIONES_ARS.'
        );
      }

      props.setProperty('APS_SPREADSHEET_ID', configured.getId());
      APS_RUNTIME_.spreadsheet = configured;
      return configured;

    } catch (e) {
      throw new Error(
        'NO SE PUDO ABRIR LA BASE APS CONFIGURADA (' +
        configId +
        '). Verifica permisos del usuario que ejecuta el Web App. Detalle: ' +
        (e && e.message ? e.message : String(e))
      );
    }
  }

  // Compatibilidad de respaldo si en el futuro se deja SPREADSHEET_ID vacío.
  if (savedId) {
    try {
      var saved = SpreadsheetApp.openById(savedId);
      if (esBaseAPS_(saved)) {
        APS_RUNTIME_.spreadsheet = saved;
        return saved;
      }
    } catch (e) {}
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && esBaseAPS_(active)) {
      props.setProperty('APS_SPREADSHEET_ID', active.getId());
      APS_RUNTIME_.spreadsheet = active;
      return active;
    }
  } catch (e) {}

  throw new Error(
    'NO HAY BASE APS CONECTADA. Configura APS_CONFIG.SPREADSHEET_ID con el ID de la base Productividad.'
  );
}

function getOrCreateSheet_(name, headers) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function getDriveFolder_(tipo) {
  var folderId = tipo === 'ARS' ? APS_CONFIG.DRIVE_FOLDER_ARS_ID : tipo === 'AFP' ? APS_CONFIG.DRIVE_FOLDER_AFP_ID : '';
  if (!folderId || !String(folderId).trim()) throw new Error('No está configurada la carpeta de Drive para ' + tipo + '.');
  return DriveApp.getFolderById(String(folderId).trim());
}

function subirArchivoBase64_(archivo, tipo) {
  if (!archivo || !archivo.base64) return '';
  var rawBase64 = String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, '');
  var bytes = Utilities.base64Decode(rawBase64);
  var blob = Utilities.newBlob(bytes, archivo.mimeType || 'application/pdf', sanitizeFileName_(archivo.name || ('archivo_' + Date.now())));
  var file = getDriveFolder_(tipo).createFile(blob);
  return file.getUrl();
}


function getFotosUsuariosFolder_() {
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('APS_FOTOS_USUARIOS_FOLDER_ID');

  if (savedId) {
    try {
      return DriveApp.getFolderById(savedId);
    } catch(e) {
      props.deleteProperty('APS_FOTOS_USUARIOS_FOLDER_ID');
    }
  }

  var root = getDriveFolder_('ARS');
  var it = root.getFoldersByName('FOTOS_USUARIOS_APS');
  var folder = it.hasNext() ? it.next() : root.createFolder('FOTOS_USUARIOS_APS');

  props.setProperty('APS_FOTOS_USUARIOS_FOLDER_ID', folder.getId());
  return folder;
}

function guardarFotoPerfilGAS(token, archivo) {
  var file = null;

  try {
    var session = requireSession_(token);

    if (!archivo || !archivo.base64) {
      return {success:false,error:'Selecciona una foto.'};
    }

    var mime = String(archivo.mimeType || '').toLowerCase();
    if (['image/jpeg','image/png','image/webp'].indexOf(mime) === -1) {
      return {success:false,error:'La foto debe ser JPG, PNG o WEBP.'};
    }

    var raw = String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, '');
    var bytes;

    try {
      bytes = Utilities.base64Decode(raw);
    } catch(e) {
      return {success:false,error:'La imagen no pudo decodificarse.'};
    }

    if (bytes.length > 1536 * 1024) {
      return {success:false,error:'La foto es demasiado grande. Selecciona otra imagen.'};
    }

    var folder = getFotosUsuariosFolder_();
    var ext = mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
    var safeName = 'FOTO_' +
      String(session.usuario || 'usuario').replace(/[^a-z0-9._-]/gi,'_') +
      '_' + Date.now() + ext;

    var blob = Utilities.newBlob(bytes, mime, safeName);
    file = folder.createFile(blob);

    // Actualización directa de UNA SOLA FILA en USUARIOS_APS.
    // Evita reescribir la tabla completa después de cada foto.
    var sh = ensureSheetHeaders_('USUARIOS_APS', getUsuariosHeaders_());
    var data = sh.getDataRange().getValues();
    var map = headerMap_(sh);

    var idxUsuario = map[normalizeHeader_('Usuario')];
    var idxFoto = map[normalizeHeader_('Foto File ID')];
    var idxFotoFecha = map[normalizeHeader_('Foto Actualizada')];
    var idxModPor = map[normalizeHeader_('Modificado Por')];
    var idxUltMod = map[normalizeHeader_('Ultima Modificacion')];

    if (idxUsuario === undefined || idxFoto === undefined) {
      try { file.setTrashed(true); } catch(ex) {}
      return {success:false,error:'Faltan columnas de foto en USUARIOS_APS. Ejecuta prepararBaseDeDatos_().' };
    }

    var rowIndex = -1;
    var oldFileId = '';

    for (var i=1;i<data.length;i++) {
      if (String(data[i][idxUsuario] || '') === String(session.usuario || '')) {
        rowIndex = i + 1;
        oldFileId = String(data[i][idxFoto] || '');
        break;
      }
    }

    if (rowIndex < 0) {
      try { file.setTrashed(true); } catch(ex) {}
      return {success:false,error:'No se encontró el usuario en USUARIOS_APS.'};
    }

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      sh.getRange(rowIndex, idxFoto + 1).setValue(file.getId());

      if (idxFotoFecha !== undefined) {
        sh.getRange(rowIndex, idxFotoFecha + 1).setValue(new Date());
      }
      if (idxModPor !== undefined) {
        sh.getRange(rowIndex, idxModPor + 1).setValue(session.nombre || session.usuario);
      }
      if (idxUltMod !== undefined) {
        sh.getRange(rowIndex, idxUltMod + 1).setValue(new Date());
      }

      SpreadsheetApp.flush();
    } finally {
      try { lock.releaseLock(); } catch(e) {}
    }

    if (oldFileId && oldFileId !== file.getId()) {
      try { DriveApp.getFileById(oldFileId).setTrashed(true); } catch(e) {}
    }

    // Actualizamos la sesión en memoria sin volver a leer toda la base.
    var fresh = {
      usuario: session.usuario,
      nombre: session.nombre,
      role: session.role,
      gerenciaId: session.gerenciaId || '',
      coordinadorId: session.coordinadorId || '',
      gestores: Array.isArray(session.gestores) ? session.gestores : [],
      versionSesion: Number(session.versionSesion || 1),
      fotoDisponible: true,
      fotoActualizada: new Date().toISOString()
    };

    persistSession_(token, fresh);

    return {
      success:true,
      user:fresh,
      fotoFileId:file.getId()
    };

  } catch(error) {
    // Si Drive alcanzó a crear el archivo pero no pudimos asociarlo al usuario,
    // lo retiramos para evitar archivos huérfanos.
    if (file) {
      try { file.setTrashed(true); } catch(ex) {}
    }

    return {
      success:false,
      error:'No se pudo completar el guardado de la foto: ' +
        (error && error.message ? error.message : String(error))
    };
  }
}

function obtenerFotoPerfilGAS(token, userId) {
  try {
    var session = requireSession_(token);
    var users = getUsers_();
    var targetId = String(userId || session.usuario);

    var user = users.filter(function(u){
      return u.usuario === targetId && u.activo !== false;
    })[0];

    if (!user || !user.fotoFileId) {
      return {success:true,disponible:false};
    }

    var file = DriveApp.getFileById(user.fotoFileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();

    if (bytes.length > 2 * 1024 * 1024) {
      return {
        success:false,
        error:'La foto guardada es demasiado grande para mostrarla. Vuelve a cargar una foto más ligera.'
      };
    }

    var mime = blob.getContentType() || 'image/jpeg';

    return {
      success:true,
      disponible:true,
      dataUrl:'data:' + mime + ';base64,' + Utilities.base64Encode(bytes),
      nombre:user.nombre,
      role:user.rol
    };

  } catch(e) {
    return {
      success:false,
      error:'No se pudo cargar la foto desde Drive: ' +
        (e && e.message ? e.message : String(e))
    };
  }
}


/* ============================================================
   OCR — Usa Drive API REST v3 con UrlFetchApp.
   NO requiere activar el servicio avanzado "Drive API v2".
   ============================================================ */

function procesarDocumentoOcrGAS(token, archivo) {
  try {
    var session = requireSession_(token);
    if (!archivo || !archivo.base64) throw new Error('No se recibió archivo para procesar.');

    var rawBase64 = String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, '');
    var bytes = Utilities.base64Decode(rawBase64);
    if (bytes.length > APS_CONFIG.MAX_FILE_BYTES) throw new Error('El archivo supera el límite de 8 MB.');

    var mimeType = String(archivo.mimeType || 'application/pdf').toLowerCase();
    var fileName = sanitizeFileName_(archivo.name || 'solicitud_' + Date.now());

    var extractedText = ocrViaDriveRest_(bytes, mimeType, fileName);
    if (!extractedText || extractedText.replace(/\s/g, '').length < 20) {
      throw new Error('El documento parece escaneado y Drive no devolvió texto OCR. Usa la Carga Manual.');
    }

    var parsedData = extraerDatosSolicitudTexto_(extractedText, fileName);
    parsedData.origenExtraccion = 'OCR';
    return { success: true, data: parsedData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function ocrViaDriveRest_(bytes, mimeType, fileName) {
  var boundary = 'apsocr' + Date.now();
  var metadata = { name: 'OCR_TEMP_' + Date.now(), mimeType: 'application/vnd.google-apps.document' };

  var metaPart = Utilities.newBlob(
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n'
  ).getBytes();

  var contentPart = Utilities.newBlob(
    '--' + boundary + '\r\nContent-Type: ' + mimeType + '\r\n\r\n'
  ).getBytes().concat(bytes).concat(Utilities.newBlob('\r\n').getBytes());

  var endPart = Utilities.newBlob('--' + boundary + '--').getBytes();
  var payload = metaPart.concat(contentPart).concat(endPart);

  var uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=es&supportsAllDrives=true';

  var resp = UrlFetchApp.fetch(uploadUrl, {
    method: 'post',
    contentType: 'multipart/related; boundary=' + boundary,
    payload: payload,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('Drive rechazó el OCR (HTTP ' + resp.getResponseCode() + '). Reautoriza la app web.');
  }

  var fileId = JSON.parse(resp.getContentText()).id;
  var text = '';
  try {
    var exportUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=text%2Fplain';
    var textResp = UrlFetchApp.fetch(exportUrl, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (textResp.getResponseCode() === 200) text = textResp.getContentText('UTF-8') || '';
  } finally {
    try {
      UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?supportsAllDrives=true', {
        method: 'delete',
        headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
        muteHttpExceptions: true
      });
    } catch (e) {}
  }
  return text;
}


function extraerFechaHoraSuscripcion_(raw){
  var original=String(raw||'')
    .replace(/\r/g,'\n')
    .replace(/[\t\f\v]+/g,' ');

  var plano=original
    .replace(/[ ]{2,}/g,' ')
    .replace(/\n+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  var fecha='', hora='';

  // 1) Patrón ideal: etiqueta + fecha + hora.
  var m=plano.match(
    /\bFECHA\s+DE\s+SUSCRIPCI(?:Ó|O|Ó?O?)N(?:\s*\/\s*HORA|\s+HORA)?\s*[:.\-]*\s*(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(?:HORA\s*[:.\-]*\s*)?(\d{1,2}:\d{2}(?::\d{2})?\s*(?:A\.?\s*M\.?|P\.?\s*M\.?|AM|PM)?))?/i
  );

  if(m){
    fecha=m[1]||'';
    hora=String(m[2]||'').replace(/\./g,'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  // 2) Busca la fecha cerca de la etiqueta, aunque PDF.js haya insertado texto intermedio.
  if(!fecha){
    var idx=plano.search(/\bFECHA\s+DE\s+SUSCRIPCI[ÓO]N\b/i);
    if(idx>=0){
      var zona=plano.slice(idx, idx+220);
      var fm=zona.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
      if(fm) fecha=fm[1];
    }
  }

  // 3) Busca HORA por separado.
  if(!hora){
    var hi=plano.search(/\bHORA\b/i);
    if(hi>=0){
      var hz=plano.slice(hi, hi+160);
      var hm=hz.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:A\.?\s*M\.?|P\.?\s*M\.?|AM|PM)?)\b/i);
      if(hm) hora=String(hm[1]||'').replace(/\./g,'').replace(/\s+/g,' ').trim().toUpperCase();
    }
  }

  // 4) Fallback seguro: solo en el encabezado anterior a DATOS DEL AFILIADO.
  // Evita confundir la fecha de nacimiento del titular con la fecha de suscripción.
  if(!fecha||!hora){
    var corte=plano.search(/\bDATOS\s+DEL\s+AFILIADO\b/i);
    var encabezado=corte>0?plano.slice(0,corte):plano.slice(0,500);

    if(!fecha){
      var fechas=encabezado.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g)||[];
      if(fechas.length) fecha=fechas[0];
    }
    if(!hora){
      var horas=encabezado.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:A\.?\s*M\.?|P\.?\s*M\.?|AM|PM)?\b/ig)||[];
      if(horas.length){
        hora=String(horas[0]).replace(/\./g,'').replace(/\s+/g,' ').trim().toUpperCase();
      }
    }
  }

  return {fecha:fecha,hora:hora};
}

function extraerDatosSolicitudTexto_(rawText, originalFileName){
  var text=normalizarTextoSolicitud_(rawText);

  // NUCT ESTRICTO: solo el valor explícitamente rotulado como NUCT.
  // Si no se encuentra con seguridad, queda vacío. Nunca se inventa.
  var nuct='';
  var nuctMatch=text.match(/\bNUCT\s*[:#.-]?\s*([0-9]{8})\b/i);
  if(nuctMatch) nuct=nuctMatch[1];

  var fh=extraerFechaHoraSuscripcion_(rawText);
  var fechaSuscripcion=fh.fecha||'';
  var horaSuscripcion=fh.hora||'';

  var codigoSeguridad='';
  var cod=text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s+([A-Z0-9]{8,16})\b/i);
  if(cod) codigoSeguridad=String(cod[1]||'').toUpperCase();

  var titular='';
  var titularMatch=text.match(/\bNOMBRE\s+DEL\s+TITULAR\s*[:.-]?\s*(.+?)(?=\s+(?:DATOS\s+DE\s+DEPENDIENTES|C[EÉ]DULA\s+DEL\s+TITULAR|FECHA\s+DE\s+SUSCRIPCI[ÓO]N|HORA)\b|$)/i);
  if(titularMatch) titular=limpiarNombreSolicitud_(titularMatch[1]);
  if(!titular){
    var nom=text.match(/\bNOMBRE\(S\)\s*[:.-]?\s*(.+?)(?=\s+APELLIDO\(S\)\s*[:.-]?)/i);
    var ape=text.match(/\bAPELLIDO\(S\)\s*[:.-]?\s*(.+?)(?=\s+(?:C[EÉ]DULA|FECHA\s+DE\s+NACIMIENTO|N[ÚU]MERO\s+SEGURIDAD\s+SOCIAL|TEL\.?RESIDENCIA|CELULAR|EMAIL)\b)/i);
    if(nom||ape) titular=limpiarNombreSolicitud_((nom?nom[1]:'')+' '+(ape?ape[1]:''));
  }

  var cedula='';
  var cedMatch=text.match(/\bC[EÉ]DULA\s+DEL\s+TITULAR\s*[:.-]?\s*([0-9\s-]{11,15})/i)
    || text.match(/\bDATOS\s+DEL\s+AFILIADO.*?\bC[EÉ]DULA\s*[:.-]?\s*([0-9\s-]{11,15})/i);
  if(cedMatch){
    var cd=cedMatch[1].replace(/\D/g,'').slice(0,11);
    if(cd.length===11) cedula=cd.replace(/(\d{3})(\d{7})(\d)/,'$1-$2-$3');
  }

  var nss='';
  var nssMatch=text.match(/\bN[ÚU]MERO\s+(?:DE\s+)?SEGURIDAD\s+SOCIAL\s*[:.-]?\s*([0-9]{6,10})\b/i);
  if(nssMatch) nss=nssMatch[1];

  var fechaNacimiento='';
  var fn=text.match(/\bFECHA\s+DE\s+NACIMIENTO\s*[:.-]?\s*(\d{2}\/\d{2}\/\d{4})\b/i);
  if(fn) fechaNacimiento=fn[1];

  var telefono='';
  var telMatch=text.match(/\bCELULAR\s*[:.-]?\s*((?:809|829|849)[-.\s]?\d{3}[-.\s]?\d{4})\b/i);
  if(!telMatch) telMatch=text.match(/\b((?:809|829|849)[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  if(telMatch) telefono=(telMatch[1]||telMatch[0]).replace(/\D/g,'');

  var email='';
  var em=text.match(/\bEMAIL\s*[:.-]?\s*([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})\b/i);
  if(em) email=String(em[1]||'').toUpperCase();

  var representanteNombre='', representanteCedula='', arsDestino='';
  var repSection='';
  var repIdx=text.search(/\bDATOS\s+REPRESENTANTE\s+DE\s+LA\s+ARS\s+DESTINO\b/i);
  if(repIdx>=0) repSection=text.slice(repIdx, repIdx+900);
  if(repSection){
    var rn=repSection.match(/\bNOMBRE\s+Y\s+APELLIDO\s*[:.-]?\s*(.+?)(?=\s+C[EÉ]DULA\s*[:.-]?)/i);
    if(rn) representanteNombre=limpiarNombreSolicitud_(rn[1]);
    var rc=repSection.match(/\bC[EÉ]DULA\s*[:.-]?\s*([0-9\s-]{11,15})/i);
    if(rc){ var rcd=rc[1].replace(/\D/g,'').slice(0,11); if(rcd.length===11) representanteCedula=rcd.replace(/(\d{3})(\d{7})(\d)/,'$1-$2-$3'); }
    var ad=repSection.match(/\bNOMBRE\s+ARS\s+DESTINO\s*[:.-]?\s*(.+?)(?=\s+(?:FECHA\s+DE\s+NACIMIENTO|FIRMA|DECLARACI[ÓO]N|DATOS\s+DE\s+DEPENDIENTES)\b|$)/i);
    if(ad) arsDestino=String(ad[1]||'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  var detalleDependientes=extraerDependientesSolicitud_(rawText);
  var dependientes=detalleDependientes.length;
  if(!dependientes){
    var depExplicit=text.match(/(?:TOTAL\s+)?DEPENDIENTES?\s*[:.-]?\s*([0-9]{1,2})\b/i)
      || text.match(/CANTIDAD\s+DEP(?:ENDIENTES?)?\s*[:.-]?\s*([0-9]{1,2})\b/i);
    if(depExplicit) dependientes=parseInt(depExplicit[1],10)||0;
  }

  return {
    nuct:nuct, fechaSuscripcion:fechaSuscripcion, horaSuscripcion:horaSuscripcion,
    titular:titular, cedula:cedula, nss:nss, fechaNacimiento:fechaNacimiento,
    telefono:telefono, email:email,
    representanteNombre:representanteNombre, representanteCedula:representanteCedula,
    arsDestino:arsDestino, codigoSeguridad:codigoSeguridad,
    dependientes:dependientes, detalleDependientes:detalleDependientes,
    textoExtraido:String(rawText||'').slice(0,45000)
  };
}

function normalizarTextoSolicitud_(raw){
  return String(raw||'')
    .replace(/\r/g,'\n')
    .replace(/[\t\f\v]+/g,' ')
    .replace(/[ ]{2,}/g,' ')
    .replace(/\n+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function limpiarNombreSolicitud_(value){
  return String(value||'')
    .replace(/[^A-ZÁÉÍÓÚÜÑa-záéíóúüñ' -]/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
}

function extraerDependientesSolicitud_(raw){
  var original=String(raw||'')
    .replace(/\r/g,'\n')
    .replace(/\t/g,' ')
    .replace(/[ ]{2,}/g,' ')
    .trim();

  var plano=normalizarTextoSolicitud_(original);

  // Acepta distintas versiones del formulario SISALRIL.
  var marcadores=[
    /\bDATOS\s+DE\s+DEPENDIENTES\b/i,
    /\bDEPENDIENTES\s+DEL\s+AFILIADO\s+SOLICITANTE\b/i,
    /\bDEPENDIENTES\s+DEL\s+AFILIADO\b/i,
    /\bRELACI[ÓO]N\s+DE\s+DEPENDIENTES\b/i
  ];

  var inicio=-1;
  for(var i=0;i<marcadores.length;i++){
    var pos=plano.search(marcadores[i]);
    if(pos>=0 && (inicio<0 || pos<inicio)) inicio=pos;
  }
  if(inicio<0) return [];

  var section=plano.slice(inicio);

  // Si existe el encabezado de la tabla, comenzamos ahí para evitar tomar
  // la cédula/NSS del titular como si fuera un dependiente.
  var tabla=section.search(/\bNOMBRE\s+NSS\s+PARENTESCO\b/i);
  if(tabla>=0) section=section.slice(tabla);

  // Cortes posibles después de la tabla.
  var cortes=[
    /\bDECLARACI[ÓO]N\s+DEL\s+AFILIADO\b/i,
    /\bFIRMA\s+DEL\s+AFILIADO\b/i,
    /\bAUTORIZACI[ÓO]N\b/i,
    /\bUSO\s+EXCLUSIVO\b/i,
    /\bOBSERVACIONES\b/i
  ];
  var stop=-1;
  for(var c=0;c<cortes.length;c++){
    var p=section.search(cortes[c]);
    if(p>0 && (stop<0 || p<stop)) stop=p;
  }
  if(stop>0) section=section.slice(0,stop);

  var parentescos=[
    'COMPAÑERO/A DE VIDA','COMPAÑERA/O DE VIDA',
    'COMPAÑERO DE VIDA','COMPAÑERA DE VIDA',
    'ESPOSO/A','ESPOSO','ESPOSA','CÓNYUGE','CONYUGE',
    'HIJASTRA','HIJASTRO','HIJA','HIJO',
    'MADRE','PADRE','HERMANA','HERMANO',
    'NIETA','NIETO','DEPENDIENTE'
  ];

  function normRel_(s){
    return String(s||'')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  var relNorm=parentescos.map(normRel_);
  var out=[], seen={};

  // Estrategia 1: regex sobre texto aplanado.
  var relRegex='COMPAÑERO\\/A DE VIDA|COMPAÑERA\\/O DE VIDA|COMPAÑERO DE VIDA|COMPAÑERA DE VIDA|ESPOSO\\/A|ESPOSO|ESPOSA|C[ÓO]NYUGE|HIJASTRA|HIJASTRO|HIJA|HIJO|MADRE|PADRE|HERMANA|HERMANO|NIETA|NIETO|DEPENDIENTE';
  var re=new RegExp(
    '(?:^|\\s)(?:[0-9]{1,2}[.)-]?\\s+)?' +
    "([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ .'\\-]{2,100}?)\\s+" +
    '([0-9]{6,10})\\s+(' + relRegex + ')(?=\\s|$)',
    'gi'
  );

  var m;
  while((m=re.exec(section))!==null){
    var nss=String(m[2]||'').replace(/\D/g,'');
    if(!nss || seen[nss]) continue;

    var nombre=limpiarNombreSolicitud_(m[1])
      .replace(/^(?:NOMBRE|NSS|PARENTESCO)\s+/i,'')
      .trim();

    if(!nombre) continue;

    seen[nss]=true;
    out.push({
      nombre:nombre,
      nss:nss,
      parentesco:String(m[3]||'').toUpperCase()
    });
  }

  // Estrategia 2: reconstrucción por líneas para PDFs cuyo texto no queda
  // en el mismo orden al aplanarlo.
  if(!out.length){
    var lineas=original.split(/\n+/).map(function(x){
      return x.replace(/\s+/g,' ').trim();
    }).filter(Boolean);

    for(var li=0;li<lineas.length;li++){
      var linea=lineas[li];
      var lm=linea.match(/(?:^|\s)([0-9]{6,10})(?:\s|$)/);
      if(!lm) continue;

      var nssLinea=lm[1];
      if(seen[nssLinea]) continue;

      var norm=normRel_(linea);
      var relEncontrada='';
      for(var ri=0;ri<relNorm.length;ri++){
        if(norm.indexOf(relNorm[ri])!==-1){
          relEncontrada=parentescos[ri];
          break;
        }
      }
      if(!relEncontrada) continue;

      var antes=linea.slice(0,lm.index).replace(/^\s*[0-9]{1,2}[.)-]?\s*/,'').trim();
      var nombreLinea=limpiarNombreSolicitud_(antes);
      if(!nombreLinea) continue;

      seen[nssLinea]=true;
      out.push({
        nombre:nombreLinea,
        nss:nssLinea,
        parentesco:relEncontrada.toUpperCase()
      });
    }
  }

  // Estrategia 3: acepta NSS históricos/cortos (6 a 10 dígitos) dentro de la tabla,
  // conserva NSS únicos aunque OCR haya destruido nombre o parentesco.
  if(!out.length){
    var nssRe=/\b([0-9]{6,10})\b/g, x;
    while((x=nssRe.exec(section))!==null){
      var val=String(x[1]||'');
      if(seen[val]) continue;

      // Evita números que pertenezcan al titular cuando no se localizó
      // el encabezado exacto de la tabla.
      var alrededor=section.slice(Math.max(0,x.index-120),Math.min(section.length,x.index+120));
      if(/\bC[EÉ]DULA\s+DEL\s+TITULAR\b/i.test(alrededor) ||
         /\bNOMBRE\s+DEL\s+TITULAR\b/i.test(alrededor)){
        continue;
      }

      seen[val]=true;
      out.push({nombre:'',nss:val,parentesco:''});
    }
  }

  return out;
}




/* ============================================================
   APS BUSINESS COMMAND - CONFIGURACIÓN CENTRAL
   La versión NO se muestra en el login. Solo en Diagnóstico.
   ============================================================ */
var APS_BUILD_VERSION_='APS-PRO-V3.3.3-SYNC-SECRET-PROPERTY-2026.10.16';

var APS_CATALOGS_={
  AFP_ORIGEN:[
    'AFP Crecer',
    'AFP Popular',
    'AFP Reservas',
    'AFP Siembra',
    'AFP Atlántico',
    'AFP JMMB BDI',
    'OTROS'
  ],
  OBJECIONES_ARS:[
    {categoria:'DOCUMENTACIÓN',codigo:'4 / 34',causal:'Falta imagen de cédula.'},
    {categoria:'DOCUMENTACIÓN',codigo:'14',causal:'Formulario incompleto.'},
    {categoria:'DOCUMENTACIÓN',codigo:'15 / 36',causal:'Formulario o Cédula no legible.'},
    {categoria:'DOCUMENTACIÓN',codigo:'24 / 39',causal:'Cédula vencida.'},
    {categoria:'DOCUMENTACIÓN',codigo:'13',causal:'Imagen no visible.'},
    {categoria:'CONSENTIMIENTO',codigo:'30',causal:'Sin consentimiento expreso.'},
    {categoria:'CONSENTIMIENTO',codigo:'31',causal:'Video sin audio inteligible.'},
    {categoria:'IDENTIDAD',codigo:'6 / 35',causal:'Cédula no coincide.'},
    {categoria:'CONTACTO',codigo:'26 / 33',causal:'Teléfono inválido.'},
    {categoria:'CONTACTO',codigo:'32',causal:'Correo no pertenece al afiliado.'}
  ]
};

function getErrorLogHeaders_(){
  return [
    'Fecha Hora','Usuario','Nombre','Rol','Modulo','Funcion',
    'Mensaje','Detalle','Version'
  ];
}

function registrarErrorSistema_(session,modulo,funcion,error,detalle){
  try{
    var sh=ensureSheetHeaders_('LOG_ERRORES_APS',getErrorLogHeaders_());
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('Fecha Hora',new Date());
    put('Usuario',session&&session.usuario||'');
    put('Nombre',session&&session.nombre||'');
    put('Rol',session&&session.role||'');
    put('Modulo',safeText_(modulo||'SISTEMA'));
    put('Funcion',safeText_(funcion||''));
    put('Mensaje',safeText_(error&&error.message?error.message:String(error||'')));
    put('Detalle',safeText_(detalle||''));
    put('Version',APS_BUILD_VERSION_);

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

    // Evita que el log crezca sin límite: conserva encabezado + últimos 1500.
    var last=sh.getLastRow();
    if(last>1501){
      sh.deleteRows(2,last-1501);
    }
  }catch(ignore){}
}

function registrarErrorClienteGAS(token,contexto,mensaje){
  try{
    var session=requireSession_(token);
    registrarErrorSistema_(session,'FRONTEND',contexto||'callServer',new Error(mensaje||'Error de interfaz'),'');
    return {success:true};
  }catch(e){
    return {success:false};
  }
}

function leerErroresRecientes_(limit){
  limit=Math.max(1,Math.min(Number(limit||10),50));
  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('LOG_ERRORES_APS');
  if(!sh||sh.getLastRow()<2)return [];

  var last=sh.getLastRow();
  var start=Math.max(2,last-limit+1);
  var values=sh.getRange(start,1,last-start+1,sh.getLastColumn()).getValues();
  var map=headerMap_(sh);

  return values.reverse().map(function(r){
    var fh=valueByHeader_(r,map,['Fecha Hora']);
    return {
      fechaHora:fh instanceof Date
        ? Utilities.formatDate(fh,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm a')
        : String(fh||''),
      usuario:String(valueByHeader_(r,map,['Nombre','Usuario'])||''),
      modulo:String(valueByHeader_(r,map,['Modulo','Módulo'])||''),
      funcion:String(valueByHeader_(r,map,['Funcion','Función'])||''),
      mensaje:String(valueByHeader_(r,map,['Mensaje'])||'')
    };
  });
}

function obtenerDiagnosticoSistemaGAS(token){
  var session=requireSession_(token);
  if(session.role!=='DIRECTORA'){
    throw new Error('Solo Dirección puede ejecutar el diagnóstico del sistema.');
  }

  var started=Date.now();
  var ss=getSpreadsheet_();

  // Autorreparación segura de hojas de afiliaciones.
  try{
    ensureSheetHeaders_('AFILIACIONES_ARS',getAfiliacionesArsHeaders_());
    ensureSheetHeaders_('AFILIACIONES_EXTERNAS',getAfiliacionesExternasHeaders_());
    ensureSheetHeaders_('REPORTES_GENERADOS',getReportesGeneradosHeaders_());
    ensureSheetHeaders_('REPORTES_FAVORITOS',getReportesFavoritosHeaders_());
  }catch(e){
    try{registrarErrorSistema_(session,'DIAGNOSTICO','AUTOREPARAR_AFILIACIONES',e,'');}catch(ignore){}
  }

  var expected=[
    'USUARIOS_APS','PRODUCCION_ARS','DEPENDIENTES_ARS','AFILIACIONES_ARS','AFILIACIONES_EXTERNAS',
    'PRODUCCION_AFP','PRODUCCION_SEGUROS','REPORTES_GENERADOS','REPORTES_FAVORITOS','HISTORIAL_ESTRUCTURA',
    'HISTORIAL_ESTADOS_ARS','LOG_ERRORES_APS'
  ];

  var sheets=expected.map(function(name){
    var sh=ss.getSheetByName(name);
    return {
      nombre:name,
      existe:!!sh,
      filas:sh?Math.max(0,sh.getLastRow()-1):0
    };
  });

  var users=[];
  var performance=null;
  var error='';
  try{
    users=getUsers_();
    performance=diagnosticarRendimientoBaseGAS(token);
  }catch(e){
    error=e&&e.message?e.message:String(e);
    registrarErrorSistema_(session,'DIAGNOSTICO','obtenerDiagnosticoSistemaGAS',e,'');
  }

  return {
    success:true,
    version:APS_BUILD_VERSION_,
    database:{id:ss.getId(),name:ss.getName()},
    sheets:sheets,
    usuarios:{
      total:users.length,
      activos:users.filter(function(u){return u.activo!==false;}).length,
      gestores:users.filter(function(u){return u.activo!==false&&u.rol==='GESTOR';}).length
    },
    rendimiento:performance,
    erroresRecientes:leerErroresRecientes_(10),
    diagnosticoError:error,
    totalMs:Date.now()-started,
    fechaHora:Utilities.formatDate(new Date(),APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm:ss a')
  };
}



function obtenerResumenSoporteGAS(token){
  var session=requireSession_(token);
  var ss=getSpreadsheet_();
  var perf=null;
  try{perf=diagnosticarRendimientoBaseGAS(token);}catch(e){}

  function rows(name){
    var sh=ss.getSheetByName(name);
    return sh?Math.max(0,sh.getLastRow()-1):0;
  }

  return {
    success:true,
    version:typeof APS_BUILD_VERSION_!=='undefined'?APS_BUILD_VERSION_:'APS',
    base:ss.getName(),
    usuarios:rows('USUARIOS_APS'),
    ars:rows('PRODUCCION_ARS'),
    afiliaciones:rows('AFILIACIONES_ARS'),
    afiliacionesExternas:rows('AFILIACIONES_EXTERNAS'),
    afp:rows('PRODUCCION_AFP'),
    seguros:rows('PRODUCCION_SEGUROS'),
    rendimientoMs:perf&&perf.totalMs!=null?perf.totalMs:null,
    usuario:session.nombre||session.usuario||'',
    rol:session.role||'',
    fechaHora:Utilities.formatDate(new Date(),APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm:ss a')
  };
}

function obtenerManualPerfilGAS(token){
  var session=requireSession_(token);
  var role=String(session.role||'').toUpperCase();

  var commonIntro={
    titulo:'Antes de empezar',
    items:[
      'APS Business Command es el sistema interno para registrar, consultar y dar seguimiento a operaciones comerciales de ARS, AFP, Renta Vitalicia, Seguros y Fianzas.',
      'El sistema muestra opciones diferentes según tu perfil. Si no ves una función, puede ser porque tu rol no tiene permiso para utilizarla.',
      'La información guardada en el sistema se registra en la base oficial de Google Sheets. Cuando un guardado termina correctamente, el sistema debe confirmarlo.',
      'Todos los registros nuevos deben incluir un teléfono válido. El sistema no permitirá guardar una operación nueva sin teléfono.',
      'El botón “Actualizar base” vuelve a leer la información desde Google Sheets. Úsalo si acabas de guardar algo y todavía no lo ves en pantalla.',
      'Nunca cierres la ventana mientras el sistema indique “Guardando”, “Procesando” o “Actualizando”.'
    ]
  };

  var navigation={
    titulo:'Cómo navegar por el sistema',
    items:[
      'Producción: muestra la producción del día, estructura, alertas y pendientes según tu nivel de acceso.',
      'Operar / botón +: abre las acciones de registro disponibles para tu perfil.',
      'Registros: consulta operaciones ya guardadas y permite buscar, revisar, abrir documentos y ver estados.',
      'Administración: disponible para Dirección. Permite gestionar usuarios, estructura, diagnóstico y controles generales.',
      'Buscar: realiza una búsqueda global por nombre, cédula, NUCT, teléfono, gestor o proceso.',
      'Manual: abre esta guía y prioriza la sección relacionada con el módulo donde estás trabajando.'
    ]
  };

  var basicTerms={
    titulo:'Conceptos básicos que debes conocer',
    items:[
      'Traspaso ARS: movimiento de un afiliado desde una ARS de origen hacia ARS APS. Solo los Gestores realizan traspasos.',
      'NUCT: número único del traspaso. Debe provenir del formulario/documento y tener exactamente 8 dígitos. El sistema no debe inventarlo.',
      'Representante ARS Destino: persona que aparece en el formulario como representante. Si no pertenece a la estructura comercial, el caso queda pendiente de revisión.',
      'Traspaso revisado: estado que indica que un usuario autorizado corrigió o validó el representante del traspaso.',
      'Objetado por ARS Origen: significa que la ARS de origen rechazó el traspaso por una causa específica. El usuario solo registra la objeción en el sistema.',
      'CCI: capital o monto de referencia utilizado en AFP y Renta Vitalicia.',
      'AFP Origen: AFP desde la cual viene el afiliado en un traspaso AFP. Si no aparece en la lista, se utiliza “Otros”.',
      'Nueva Afiliación AFP: en este sistema se registra únicamente para AFP APS.',
      'Seguros: todas las ventas de seguros se registran únicamente para SEGUROS APS.',
      'Renta Vitalicia: APS no ofrece renta vitalicia con período garantizado.'
    ]
  };

  var troubleshooting={
    titulo:'Qué hacer si algo no funciona',
    items:[
      'Si no ves un registro recién guardado, pulsa “Actualizar base”.',
      'Si aparece “Error de conexión”, espera unos segundos y vuelve a actualizar la base.',
      'Si una opción no aparece, confirma primero tu perfil y permisos.',
      'Si un dato se guardó pero no se ve en pantalla, no vuelvas a registrarlo de inmediato: actualiza la base para evitar duplicados.',
      'Si un formulario muestra un campo en rojo, revisa ese dato antes de guardar.',
      'Si una operación queda “Por revisar”, entra al registro para ver la alerta y la acción requerida.',
      'Si persiste el problema, Dirección puede usar Administración > Diagnóstico del sistema para revisar conexión, hojas, tiempos y errores recientes.',
      'Si olvidaste tu contraseña, usa “¿Olvidaste tu contraseña?” en el login. El sistema enviará una clave temporal al responsable de tu estructura. La clave vence en 30 minutos y obliga a crear una nueva al entrar.'
    ]
  };

  var manuals={
    DIRECTORA:{
      titulo:'Manual completo de Dirección Comercial',
      resumen:'Guía para supervisar toda la operación comercial, estructura, producción, registros, alertas, cortes y administración del sistema.',
      secciones:[
        commonIntro,navigation,basicTerms,
        {titulo:'1. Revisar la Producción del día',items:[
          'Entra a Producción desde el menú inferior.',
          'La vista inicia con el consolidado comercial del día.',
          'Revisa Operaciones, Movimientos ARS y CCI total.',
          'El indicador “Equipo produciendo” muestra cuántos miembros de la estructura tienen producción registrada.',
          'Usa las pestañas Resumen, Estructura y Alertas para cambiar la forma de análisis.',
          'En Estructura puedes bajar de Gerencia a Coordinación, Supervisión y Gestor cuando esos niveles existan.',
          'Los niveles vacíos no deben mostrarse.'
        ]},
        {titulo:'2. Usar el Centro de pendientes',items:[
          'Por revisar: casos con alertas que requieren una corrección o validación.',
          'Objetados: traspasos rechazados por la ARS de origen.',
          'Sin teléfono: registros que no tienen número de contacto disponible.',
          'Sin NUCT: traspasos donde el NUCT no fue detectado o no estaba disponible.',
          'En curso: operaciones todavía abiertas o pendientes.',
          'Pulsa cualquiera de los indicadores para abrir directamente los registros relacionados.'
        ]},
        {titulo:'3. Revisar un Traspaso ARS',items:[
          'Abre Registros y localiza el traspaso por nombre, cédula o NUCT.',
          'Pulsa “Vista” para revisar titular, gestor, representante, documento, dependientes, alertas e historial.',
          'Si el representante no pertenece a la Dirección Comercial, el sistema puede haber asignado temporalmente la producción al usuario que registró el caso.',
          'Pulsa “Representante” o “CORREGIR” para seleccionar un Gestor válido dentro de la estructura.',
          'Al guardar la corrección, la producción y jerarquía deben actualizarse y el expediente debe mostrar “Traspaso revisado”.'
        ]},
        {titulo:'4. Registrar una objeción de ARS Origen',items:[
          'La objeción se registra sobre un Traspaso ARS ya existente.',
          'Pulsa “Objetar por ARS Origen”.',
          'Selecciona el código y causal informados por la ARS de origen.',
          'Añade una observación solo si necesitas ampliar el detalle.',
          'Confirma la operación.',
          'El sistema debe mostrar “OBJETADO POR ARS ORIGEN”, el código, la causal y quién registró la información.',
          'El usuario que registra la objeción no es quien la causó. El actor de la objeción siempre es “ARS ORIGEN”.',
          'Los traspasos objetados dejan de contar como producción efectiva, pero permanecen en el histórico.'
        ]},
        {titulo:'5. Administrar usuarios y estructura',items:[
          'Entra a Administración.',
          'Desde allí puedes revisar usuarios, roles, Gerencias, Coordinaciones, Supervisiones y Gestores.',
          'Puedes agregar, editar, mover, desactivar o reactivar usuarios según las reglas del sistema.',
          'Una Gerencia puede existir sin Coordinador.',
          'Una Gerencia puede tener Supervisores directos.',
          'Un Gestor puede depender directamente de Gerencia o Coordinación si no existe Supervisor.',
          'La cuenta principal de Dirección no debe eliminarse ni moverse de forma ordinaria.'
        ]},
        {titulo:'6. Cortes comerciales',items:[
          'Abre el panel de Cortes desde Producción.',
          'Revisa los datos acumulados del día antes de copiar o abrir WhatsApp.',
          'Abrir WhatsApp no significa que el corte fue enviado.',
          'Solo confirma el corte cuando realmente haya sido enviado.',
          'Las alertas operativas y las objeciones no se agregan al texto del corte.'
        ]},
        {titulo:'7. Diagnóstico del sistema',items:[
          'En Administración abre “Diagnóstico del sistema”.',
          'Ejecuta el diagnóstico para revisar base conectada, hojas principales, usuarios, tiempos de lectura y errores recientes.',
          'Usa “Copiar soporte” si necesitas compartir información técnica del sistema para revisión.',
          'La versión técnica se mantiene aquí y no se muestra en el login.'
        ]},
        troubleshooting
      ]
    },

    GERENTE:{
      titulo:'Manual completo de Gerencia',
      resumen:'Guía para controlar la producción de tu Gerencia, revisar operaciones y gestionar casos dentro de tu estructura.',
      secciones:[
        commonIntro,navigation,basicTerms,
        {titulo:'1. Qué puedes ver como Gerente',items:[
          'Solo puedes trabajar con información perteneciente a tu Gerencia.',
          'Puedes ver Supervisores, Coordinadores y Gestores asociados a tu estructura cuando existan.',
          'Puedes consultar producción, registros y alertas de tu equipo.',
          'Puedes asignar operaciones únicamente a Gestores permitidos dentro de tu Gerencia.'
        ]},
        {titulo:'2. Revisar producción',items:[
          'Entra a Producción.',
          'Revisa cuántos miembros están produciendo y cuáles tienen operaciones pendientes.',
          'Usa Estructura para bajar hasta el nivel de Gestor.',
          'Revisa especialmente “En curso” y “Por revisar”.',
          'Pulsa “Ver” para abrir el detalle del vendedor.'
        ]},
        {titulo:'3. Corregir representante de un Traspaso ARS',items:[
          'Abre Registros.',
          'Busca el traspaso.',
          'Si aparece una alerta de representante, pulsa “CORREGIR” o abre la Vista.',
          'Selecciona un Gestor válido dentro de tu Gerencia.',
          'Guarda la corrección.',
          'El expediente debe quedar identificado como “Traspaso revisado”.'
        ]},
        {titulo:'4. Registrar una objeción',items:[
          'Abre el Traspaso ARS correspondiente.',
          'Pulsa “Objetar por ARS Origen”.',
          'Selecciona el código y causal que informó la ARS de origen.',
          'Confirma el registro.',
          'Verifica que la tarjeta muestre el código, causal y usuario que registró la objeción.'
        ]},
        {titulo:'5. Asignar producción',items:[
          'En AFP, Renta Vitalicia, Seguros o Fianzas selecciona el Gestor responsable cuando el sistema lo permita.',
          'Solo aparecerán Gestores pertenecientes a tu alcance.',
          'Antes de guardar, verifica que el nombre seleccionado corresponda a quien debe recibir la producción.'
        ]},
        {titulo:'6. Cortes',items:[
          'Abre el panel de Cortes.',
          'Revisa los totales del día.',
          'Copia o abre el texto en WhatsApp.',
          'Marca el corte como confirmado solo después de enviarlo.'
        ]},
        troubleshooting
      ]
    },

    COORDINADOR:{
      titulo:'Manual completo de Coordinación',
      resumen:'Guía para seguimiento operativo de Supervisores y Gestores asignados a tu Coordinación.',
      secciones:[
        commonIntro,navigation,basicTerms,
        {titulo:'1. Qué puedes ver como Coordinador',items:[
          'Tu alcance se limita a tu Coordinación y a los Gestores/Supervisores vinculados a ella.',
          'Puedes revisar producción, registros y alertas de tu estructura.',
          'Puedes asignar operaciones a Gestores permitidos dentro de tu Coordinación.'
        ]},
        {titulo:'2. Seguimiento de producción',items:[
          'Abre Producción.',
          'Revisa quién está produciendo y quién no tiene actividad.',
          'Usa los indicadores En curso y Por revisar para detectar casos que requieren acción.',
          'Si existen Supervisores, puedes revisar la producción agrupada por Supervisor.'
        ]},
        {titulo:'3. Registros ARS',items:[
          'Abre Registros y busca por nombre, cédula o NUCT.',
          'Usa Vista para revisar expediente, documento, dependientes y alertas.',
          'Si existe una alerta de representante y tienes autorización, corrige el Gestor correspondiente.',
          'Después de la corrección el traspaso debe mostrar “Traspaso revisado”.'
        ]},
        {titulo:'4. Objeciones ARS',items:[
          'Solo registra una objeción cuando recibas la información de la ARS de origen.',
          'Selecciona exactamente el código/causal informado.',
          'No cambies la causal por una parecida.',
          'Verifica que el registro quede identificado como “OBJETADO POR ARS ORIGEN”.'
        ]},
        {titulo:'5. Antes de guardar cualquier operación',items:[
          'Confirma nombre y cédula.',
          'Confirma Gestor responsable.',
          'En AFP verifica AFP Origen y CCI.',
          'En Renta Vitalicia revisa CCI, fecha de nacimiento, edad, sexo y cesantía.',
          'En Seguros verifica cliente, producto y datos económicos.'
        ]},
        troubleshooting
      ]
    },

    SUPERVISOR:{
      titulo:'Manual completo de Supervisión',
      resumen:'Guía para seguimiento directo de Gestores y control de operaciones dentro de tu Supervisión.',
      secciones:[
        commonIntro,navigation,basicTerms,
        {titulo:'1. Tu responsabilidad principal',items:[
          'Dar seguimiento a los Gestores bajo tu Supervisión.',
          'Revisar la producción del día y detectar casos incompletos.',
          'Consultar expedientes dentro de tu alcance.',
          'Registrar objeciones cuando la ARS de origen las comunique.'
        ]},
        {titulo:'2. Revisar producción',items:[
          'Entra a Producción.',
          'Revisa cuántos Gestores tienen actividad.',
          'Prioriza casos “En curso” y “Por revisar”.',
          'Pulsa un Gestor para revisar el detalle de su producción.'
        ]},
        {titulo:'3. Revisar registros',items:[
          'Entra a Registros.',
          'Busca por nombre, cédula, NUCT o Gestor.',
          'Abre Vista para revisar información completa.',
          'Si falta teléfono o NUCT, confirma si el dato está disponible antes de realizar otra acción.'
        ]},
        {titulo:'4. Registrar objeción de ARS Origen',items:[
          'Ubica el traspaso.',
          'Pulsa “Objetar por ARS Origen”.',
          'Selecciona el código exacto informado.',
          'Agrega observación solo cuando sea necesaria.',
          'Confirma y verifica que el estado quede visible en la tarjeta.'
        ]},
        {titulo:'5. Buenas prácticas',items:[
          'No dupliques un registro porque no aparezca inmediatamente.',
          'Actualiza la base antes de repetir una carga.',
          'No registres datos estimados o inventados.',
          'Si un documento no permite leer el NUCT correctamente, déjalo vacío para revisión.'
        ]},
        troubleshooting
      ]
    },

    GESTOR:{
      titulo:'Manual completo del Gestor',
      resumen:'Guía paso a paso para registrar operaciones correctamente aunque sea tu primera vez usando APS Business Command.',
      secciones:[
        commonIntro,navigation,basicTerms,
        {titulo:'1. Registrar un Traspaso ARS desde PDF',items:[
          'Entra a ARS > Traspasos.',
          'Selecciona el modo de carga por PDF.',
          'Adjunta el formulario correcto.',
          'Espera a que el sistema termine de extraer la información.',
          'Revisa cuidadosamente nombre, cédula, NSS, NUCT, fecha de suscripción, representante y dependientes.',
          'El NUCT solo se acepta cuando aparece explícitamente en el documento y tiene 8 dígitos.',
          'Si el sistema muestra una advertencia del representante, puedes continuar; el caso quedará pendiente de revisión por un usuario autorizado.',
          'Guarda el traspaso y espera la confirmación antes de cerrar o iniciar otro.'
        ]},
        {titulo:'2. Registrar un Traspaso ARS manualmente',items:[
          'Usa la opción Manual cuando no trabajarás desde PDF.',
          'Completa los datos del titular.',
          'Agrega cada dependiente con Nombre, NSS y Parentesco.',
          'Revisa que la cédula del titular tenga 11 dígitos.',
          'No inventes NUCT, NSS, teléfono ni datos que no tengas disponibles.',
          'Guarda y espera el mensaje de confirmación.'
        ]},
        {titulo:'3. Registrar Nueva Afiliación ARS',items:[
          'Abre ARS > Afiliaciones nuevas / Dependientes.',
          'Selecciona Nueva Afiliación.',
          'Completa nombre, cédula/NUI, fecha y estado.',
          'Verifica la información antes de guardar.',
          'El sistema evita duplicados de la misma persona en la misma fecha.'
        ]},
        {titulo:'4. Registrar Carga de Dependiente',items:[
          'Selecciona Carga de Dependiente.',
          'Completa los datos del dependiente.',
          'Indica la cédula/NUI del titular.',
          'Selecciona parentesco.',
          'Guarda y espera confirmación.'
        ]},
        {titulo:'5. Registrar Traspaso AFP',items:[
          'Entra a AFP y Renta Vitalicia > Nuevo traspaso AFP.',
          'Completa nombre y cédula.',
          'Selecciona la AFP Origen.',
          'Las opciones disponibles incluyen AFP Crecer, Popular, Reservas, Siembra, Atlántico y JMMB BDI.',
          'Si la AFP no está en la lista, selecciona “Otros” y escribe el nombre.',
          'Indica el CCI.',
          'Verifica la fecha de operación y guarda.'
        ]},
        {titulo:'6. Registrar Nueva Afiliación AFP',items:[
          'Abre Nueva Afiliación AFP.',
          'Completa nombre y cédula.',
          'La AFP está fija como AFP APS; no debes seleccionar otra.',
          'Indica el CCI y la fecha.',
          'Guarda y espera la confirmación.'
        ]},
        {titulo:'7. Registrar Renta Vitalicia',items:[
          'Abre Renta Vitalicia.',
          'Completa nombre, cédula y Tipo de Renta.',
          'Indica CCI, fecha de nacimiento, sexo y si la persona es cesante.',
          'La edad se calcula a partir de la fecha de nacimiento cuando corresponde.',
          'Completa teléfono, estado, monto cotizado y observaciones si aplica.',
          'Adjunta el documento si está disponible.',
          'APS no ofrece renta vitalicia con período garantizado.'
        ]},
        {titulo:'8. Registrar Seguros y Fianzas',items:[
          'Entra a Seguros y Fianzas.',
          'Selecciona el producto correspondiente.',
          'Completa los datos del cliente.',
          'Todos los seguros registrados en este sistema pertenecen a SEGUROS APS.',
          'Revisa prima, cobrado, pendiente y estado antes de guardar.',
          'En Fianzas registra el producto correspondiente y verifica los datos antes de confirmar.'
        ]},
        {titulo:'9. Consultar tus registros',items:[
          'Abre Registros.',
          'Busca por nombre, cédula, NUCT o proceso.',
          'Pulsa Vista para revisar la información.',
          'Si existe documento, utiliza el botón correspondiente para abrirlo.',
          'Si un registro aparece objetado, podrás ver el código y la causal, pero la objeción fue realizada por la ARS de origen.'
        ]},
        {titulo:'10. Antes de repetir una operación',items:[
          'Si acabas de guardar y no ves el registro, pulsa Actualizar base.',
          'Busca el nombre o cédula en Registros.',
          'Solo vuelve a registrar si confirmaste que el guardado anterior realmente falló.',
          'Esto evita duplicados.'
        ]},
        troubleshooting
      ]
    }
  };

  var manual=manuals[role]||{
    titulo:'Manual completo de usuario',
    resumen:'Guía básica para utilizar APS Business Command.',
    secciones:[commonIntro,navigation,basicTerms,troubleshooting]
  };

  return {
    success:true,
    role:role,
    manual:manual
  };
}

function obtenerCatalogosSistemaGAS(token){
  requireSession_(token);
  return {
    success:true,
    version:APS_BUILD_VERSION_,
    afpOrigen:APS_CATALOGS_.AFP_ORIGEN.slice(),
    objecionesArs:APS_CATALOGS_.OBJECIONES_ARS.map(function(x){return Object.assign({},x);})
  };
}


function getMotivosObjecionArs_(){
  return APS_CATALOGS_.OBJECIONES_ARS.map(function(x){
    return Object.assign({},x);
  });
}

function obtenerMotivosObjecionArsGAS(token){
  requireSession_(token);
  return {success:true,motivos:getMotivosObjecionArs_()};
}

function getHistorialEstadosArsHeaders_(){
  return [
    'ID','Registro ARS ID','Fecha Hora','Estado','Codigo Objecion','Categoria',
    'Causal','Objetado Por','Registrado Por ID','Registrado Por','Rol',
    'Gerencia','Coordinador','Supervisor','Observacion'
  ];
}

function registrarHistorialEstadoARS_(session, registroId, estado, data){
  try{
    data=data||{};
    var sh=ensureSheetHeaders_('HISTORIAL_ESTADOS_ARS',getHistorialEstadosArsHeaders_());
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}
    put('ID','EST-'+Date.now()+'-'+Math.floor(Math.random()*100000));
    put('Registro ARS ID',registroId||'');
    put('Fecha Hora',new Date());
    put('Estado',estado||'');
    put('Codigo Objecion',data.codigo||'');
    put('Categoria',data.categoria||'');
    put('Causal',data.causal||'');
    put('Objetado Por',data.objetadoPor||'');
    put('Registrado Por ID',session&&session.usuario||'');
    put('Registrado Por',session&&session.nombre||'');
    put('Rol',session&&session.role||'');
    put('Gerencia',session&&session.gerenciaId||'');
    put('Coordinador',session&&session.coordinadorId||'');
    put('Supervisor',session&&session.supervisorId||'');
    put('Observacion',data.observacion||'');
    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();
  }catch(e){}
}

function listarHistorialEstadosArsGAS(token, registroId){
  var session=requireSession_(token);
  registroId=String(registroId||'').trim();
  if(!registroId) return {success:true,historial:[]};

  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('HISTORIAL_ESTADOS_ARS');
  if(!sh || sh.getLastRow()<2) return {success:true,historial:[]};

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  var rows=data.slice(1).filter(function(r){
    return String(valueByHeader_(r,map,['Registro ARS ID'])||'')===registroId;
  }).map(function(r){
    var fh=valueByHeader_(r,map,['Fecha Hora']);
    return {
      fechaHora:fh instanceof Date
        ? Utilities.formatDate(fh,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm a')
        : String(fh||''),
      estado:String(valueByHeader_(r,map,['Estado'])||''),
      codigo:String(valueByHeader_(r,map,['Codigo Objecion'])||''),
      categoria:String(valueByHeader_(r,map,['Categoria'])||''),
      causal:String(valueByHeader_(r,map,['Causal'])||''),
      objetadoPor:String(valueByHeader_(r,map,['Objetado Por'])||''),
      registradoPor:String(valueByHeader_(r,map,['Registrado Por'])||''),
      rol:String(valueByHeader_(r,map,['Rol'])||''),
      observacion:String(valueByHeader_(r,map,['Observacion'])||'')
    };
  }).reverse();

  return {success:true,historial:rows};
}

function objetarTraspasoArsGAS(token, registroId, codigo, observacion){
  var session=requireSession_(token);

  if(['DIRECTORA','GERENTE','COORDINADOR','SUPERVISOR'].indexOf(session.role)===-1){
    throw new Error('Tu rol no puede registrar objeciones de ARS Origen.');
  }

  registroId=String(registroId||'').trim();
  codigo=String(codigo||'').trim();
  observacion=safeText_(observacion||'');

  if(!registroId) throw new Error('Registro ARS requerido.');
  if(!codigo) throw new Error('Selecciona el código de objeción.');

  var motivo=getMotivosObjecionArs_().filter(function(x){return x.codigo===codigo;})[0];
  if(!motivo) throw new Error('Código de objeción no válido.');

  var sh=ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());
  if(sh.getLastRow()<2) throw new Error('No hay traspasos registrados.');

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var rowIndex=-1,row=null;

  for(var i=1;i<data.length;i++){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===registroId){
      rowIndex=i+1; row=data[i]; break;
    }
  }
  if(!row) throw new Error('No se encontró el traspaso.');

  // Scope check.
  var visible=filtrarPorSesion_(session,leerARS_(),'ARS').some(function(r){
    return String(r.id||'')===registroId;
  });
  if(session.role!=='DIRECTORA' && !visible){
    throw new Error('Este traspaso no pertenece a tu alcance.');
  }

  function setHeader_(header,value){
    var idx=map[normalizeHeader_(header)];
    if(idx===undefined) return;
    sh.getRange(rowIndex,idx+1).setValue(value);
  }

  var obsAnterior=String(valueByHeader_(row,map,['Observaciones'])||'');
  var marca='OBJETADO POR ARS ORIGEN · Código '+motivo.codigo+' · '+motivo.causal+
    ' · Registrado en sistema por '+(session.nombre||session.usuario);

  setHeader_('Estado','OBJETADO POR ARS ORIGEN');
  setHeader_('Estado Validacion','OBJETADO');
  setHeader_('Codigo Objecion',motivo.codigo);
  setHeader_('Categoria Objecion',motivo.categoria);
  setHeader_('Causal Objecion',motivo.causal);
  setHeader_('Objetado Por','ARS ORIGEN');
  setHeader_('Objecion Registrada Por',session.nombre||session.usuario||'');
  setHeader_('Fecha Hora Objecion',new Date());
  setHeader_('Observaciones',obsAnterior ? obsAnterior+' | '+marca+(observacion?' | '+observacion:'') : marca+(observacion?' | '+observacion:''));

  SpreadsheetApp.flush();

  registrarHistorialEstadoARS_(session,registroId,'OBJETADO POR ARS ORIGEN',{
    codigo:motivo.codigo,
    categoria:motivo.categoria,
    causal:motivo.causal,
    objetadoPor:'ARS ORIGEN',
    observacion:observacion
  });

  try{
    registrarAuditoria_('OBJETAR_TRASPASO_ARS',session,registroId+' | '+motivo.codigo+' | '+motivo.causal);
  }catch(e){}

  return {
    success:true,
    id:registroId,
    estado:'OBJETADO POR ARS ORIGEN',
    codigo:motivo.codigo,
    categoria:motivo.categoria,
    causal:motivo.causal,
    objetadoPor:'ARS ORIGEN',
    registradoPor:session.nombre||session.usuario||''
  };
}


function getArsHeaders_(){
  return [
    'ID','Fecha Registro','Fecha Suscripción','Hora Suscripción',
    'Gestor Traspaso','Cedula Gestor Traspaso',
    'Usuario Registro','Usuario Registro ID','Rol Usuario Registro',
    'Gerencia','Coordinador','Supervisor',
    'Titular','NUCT','Cedula','NSS','Fecha Nacimiento','Telefono','Email',
    'Cantidad Dep','Representante ARS Destino','Cedula Representante','ARS Destino','Codigo Seguridad',
    'Estado','Estado Validacion',
    'Codigo Objecion','Categoria Objecion','Causal Objecion','Objetado Por','Objecion Registrada Por','Fecha Hora Objecion',
    'Origen Extraccion','Observaciones','Archivo URL','Texto Extraido'
  ];
}

function getDependientesArsHeaders_(){
  return ['ID Dependiente','ID Registro','NUCT','Cedula Titular','Titular','Nombre Dependiente','NSS Dependiente','Parentesco'];
}

function ensureSheetHeaders_(name, requiredHeaders){
  var sh=getOrCreateSheet_(name, requiredHeaders);
  var lastCol=Math.max(sh.getLastColumn(),1);
  var current=sh.getRange(1,1,1,lastCol).getValues()[0].map(function(v){return String(v||'').trim();});
  var norm={};
  current.forEach(function(h,i){ if(h) norm[normalizeHeader_(h)]=i+1; });
  requiredHeaders.forEach(function(h){
    if(!norm[normalizeHeader_(h)]){
      var col=sh.getLastColumn()+1;
      sh.getRange(1,col).setValue(h).setFontWeight('bold');
      norm[normalizeHeader_(h)]=col;
    }
  });
  sh.setFrozenRows(1);
  return sh;
}

function headerMap_(sh){
  var headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var map={};
  headers.forEach(function(h,i){ map[normalizeHeader_(h)]=i; });
  return map;
}

function valueByHeader_(row,map,names){
  for(var i=0;i<names.length;i++){
    var k=normalizeHeader_(names[i]);
    if(Object.prototype.hasOwnProperty.call(map,k)) return row[map[k]];
  }
  return '';
}

function buildRowByHeaders_(sh, valuesByHeader){
  var headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  return headers.map(function(h){
    var key=normalizeHeader_(h);
    return Object.prototype.hasOwnProperty.call(valuesByHeader,key)?valuesByHeader[key]:'';
  });
}

function arsRecordToValues_(record, fileUrl, id){
  var obj={};
  function put(h,v){ obj[normalizeHeader_(h)]=v; }

  put('ID',id);
  put('Fecha Registro',record.fecha||record.fechaRegistro||fechaHoy_());
  put('Fecha',record.fecha||record.fechaRegistro||fechaHoy_());
  put('Fecha Suscripción',safeText_(record.fechaSuscripcion||''));
  put('Hora Suscripción',safeText_(record.horaSuscripcion||''));

  put('Gestor Traspaso',safeText_(record.gestor||''));
  put('Gestor',safeText_(record.gestor||''));
  put('Cedula Gestor Traspaso',safeText_(record.cedulaGestor||''));
  put('Usuario Registro',safeText_(record.usuarioRegistro||''));
  put('Usuario Registro ID',safeText_(record.usuarioRegistroId||''));
  put('Rol Usuario Registro',safeText_(record.rolUsuarioRegistro||''));
  put('Gerencia',safeText_(record.gerenciaId||''));
  put('Coordinador',safeText_(record.coordinadorId||''));
  put('Supervisor',safeText_(record.supervisorId||''));

  put('Titular',safeText_(record.titular||''));
  put('NUCT',safeText_(record.nuct||''));
  put('Cedula',safeText_(record.cedula||''));
  put('NSS',safeText_(record.nss||''));
  put('Fecha Nacimiento',safeText_(record.fechaNacimiento||''));
  put('Telefono',safeText_(record.telefono||''));
  put('Email',safeText_(record.email||''));
  put('Cantidad Dep',Number(record.cantidadDep!=null?record.cantidadDep:(record.dependientes||0)));

  put('Representante ARS Destino',safeText_(record.representanteNombre||''));
  put('Cedula Representante',safeText_(record.representanteCedula||''));
  put('ARS Destino',safeText_(record.arsDestino||''));
  put('Codigo Seguridad',safeText_(record.codigoSeguridad||''));

  put('Estado',safeText_(record.estado||'En curso'));
  put('Estado Validacion',safeText_(record.estadoValidacion||'REVISAR'));
  put('Origen Extraccion',safeText_(record.origenExtraccion||'MANUAL'));
  put('Observaciones',safeText_(record.observaciones||''));
  put('Archivo URL',fileUrl||'');
  put('Texto Extraido',safeText_(String(record.textoExtraido||'').slice(0,45000)));

  return obj;
}

function nuctExisteARS_(nuct, excludeId){
  nuct=String(nuct||'').trim();
  if(!nuct) return false;
  var sh=ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());
  if(sh.getLastRow()<2) return false;
  var data=sh.getDataRange().getValues(), map=headerMap_(sh);
  for(var i=1;i<data.length;i++){
    var id=String(valueByHeader_(data[i],map,['ID'])||'');
    var val=String(valueByHeader_(data[i],map,['NUCT'])||'').trim();
    if(val===nuct && (!excludeId || id!==String(excludeId))) return true;
  }
  return false;
}

function guardarDependientesARS_(recordId, record){
  var deps=Array.isArray(record.detalleDependientes)?record.detalleDependientes:[];
  if(!deps.length) return;
  var sh=ensureSheetHeaders_('DEPENDIENTES_ARS',getDependientesArsHeaders_());
  var rows=[];
  deps.forEach(function(dep,idx){
    var obj={};
    function put(h,v){ obj[normalizeHeader_(h)]=v; }
    put('ID Dependiente',recordId+'-D'+(idx+1));
    put('ID Registro',recordId);
    put('NUCT',safeText_(record.nuct||''));
    put('Cedula Titular',safeText_(record.cedula||''));
    put('Titular',safeText_(record.titular||''));
    put('Nombre Dependiente',safeText_(dep.nombre||''));
    put('NSS Dependiente',safeText_(dep.nss||''));
    put('Parentesco',safeText_(dep.parentesco||''));
    rows.push(buildRowByHeaders_(sh,obj));
  });
  if(rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
}

function leerDependientesARS_(){
  var ss=getSpreadsheet_(), sh=ss.getSheetByName('DEPENDIENTES_ARS');
  var byId={};
  if(!sh||sh.getLastRow()<2) return byId;
  var data=sh.getDataRange().getValues(), map=headerMap_(sh);
  for(var i=1;i<data.length;i++){
    var id=String(valueByHeader_(data[i],map,['ID Registro'])||'');
    if(!id) continue;
    if(!byId[id]) byId[id]=[];
    byId[id].push({
      nombre:String(valueByHeader_(data[i],map,['Nombre Dependiente'])||''),
      nss:String(valueByHeader_(data[i],map,['NSS Dependiente'])||''),
      parentesco:String(valueByHeader_(data[i],map,['Parentesco'])||'')
    });
  }
  return byId;
}


function repararConexionBaseAPS() {
  var configId = String(APS_CONFIG.SPREADSHEET_ID || '').trim();
  var ss = null;

  if (configId) {
    ss = SpreadsheetApp.openById(configId);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error(
      'No se pudo determinar la base APS. Configura APS_CONFIG.SPREADSHEET_ID.'
    );
  }

  if (!esBaseAPS_(ss)) {
    throw new Error(
      'El Spreadsheet seleccionado no parece ser la base de Productividad APS.'
    );
  }

  PropertiesService
    .getScriptProperties()
    .setProperty('APS_SPREADSHEET_ID', ss.getId());

  APS_RUNTIME_.spreadsheet = ss;

  prepararBaseDeDatos_();

  return {
    success:true,
    spreadsheetId:ss.getId(),
    spreadsheetName:ss.getName(),
    usuarios:ss.getSheetByName('USUARIOS_APS')
      ? Math.max(0,ss.getSheetByName('USUARIOS_APS').getLastRow()-1)
      : 0,
    traspasos:ss.getSheetByName('PRODUCCION_ARS')
      ? Math.max(0,ss.getSheetByName('PRODUCCION_ARS').getLastRow()-1)
      : 0,
    mensaje:'Base APS conectada correctamente y fijada para el Web App.'
  };
}

function diagnosticarBaseAPS() {
  var out={success:false};
  try{
    var ss=getSpreadsheet_();
    out.success=true;
    out.spreadsheetId=ss.getId();
    out.spreadsheetName=ss.getName();
    out.savedSpreadsheetId=PropertiesService.getScriptProperties().getProperty('APS_SPREADSHEET_ID')||'';
    out.rows={};
    ['USUARIOS_APS','PRODUCCION_ARS','DEPENDIENTES_ARS','AFILIACIONES_ARS','AFILIACIONES_EXTERNAS','PRODUCCION_AFP','PRODUCCION_SEGUROS'].forEach(function(n){
      var sh=ss.getSheetByName(n);
      out.rows[n]=sh?Math.max(0,sh.getLastRow()-1):-1;
    });
  }catch(e){
    out.error=e&&e.message?e.message:String(e);
  }
  return out;
}

function verificarRegistroArsGuardado_(id) {
  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('PRODUCCION_ARS');
  if(!sh||sh.getLastRow()<2) return false;

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  for(var i=1;i<data.length;i++){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===String(id||'')) return true;
  }
  return false;
}


/* ============================================================
   GUARDADO DE DATOS
   ============================================================ */



function getHistorialAlertasArsHeaders_(){
  return [
    'ID','Registro ARS ID','Fecha Hora','Tipo Alerta','Accion',
    'Valor Anterior','Valor Nuevo','Usuario ID','Usuario Nombre','Rol',
    'Gerencia','Coordinador','Supervisor','Detalle'
  ];
}

function registrarHistorialAlertaARS_(session, registroId, tipoAlerta, accion, anterior, nuevo, detalle){
  try{
    var sh=ensureSheetHeaders_('HISTORIAL_ALERTAS_ARS',getHistorialAlertasArsHeaders_());
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}
    put('ID','ALR-'+Date.now()+'-'+Math.floor(Math.random()*100000));
    put('Registro ARS ID',registroId||'');
    put('Fecha Hora',new Date());
    put('Tipo Alerta',tipoAlerta||'');
    put('Accion',accion||'');
    put('Valor Anterior',anterior||'');
    put('Valor Nuevo',nuevo||'');
    put('Usuario ID',session&&session.usuario||'');
    put('Usuario Nombre',session&&session.nombre||'');
    put('Rol',session&&session.role||'');
    put('Gerencia',session&&session.gerenciaId||'');
    put('Coordinador',session&&session.coordinadorId||'');
    put('Supervisor',session&&session.supervisorId||'');
    put('Detalle',detalle||'');
    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();
  }catch(e){}
}

function listarHistorialAlertasArsGAS(token, registroId){
  var session=requireSession_(token);
  registroId=String(registroId||'').trim();
  if(!registroId) return {success:true,historial:[]};

  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('HISTORIAL_ALERTAS_ARS');
  if(!sh || sh.getLastRow()<2) return {success:true,historial:[]};

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  var rows=data.slice(1).filter(function(r){
    return String(valueByHeader_(r,map,['Registro ARS ID'])||'')===registroId;
  }).map(function(r){
    var fh=valueByHeader_(r,map,['Fecha Hora']);
    return {
      fechaHora: fh instanceof Date
        ? Utilities.formatDate(fh,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm a')
        : String(fh||''),
      tipo:String(valueByHeader_(r,map,['Tipo Alerta'])||''),
      accion:String(valueByHeader_(r,map,['Accion'])||''),
      anterior:String(valueByHeader_(r,map,['Valor Anterior'])||''),
      nuevo:String(valueByHeader_(r,map,['Valor Nuevo'])||''),
      usuario:String(valueByHeader_(r,map,['Usuario Nombre'])||''),
      rol:String(valueByHeader_(r,map,['Rol'])||''),
      detalle:String(valueByHeader_(r,map,['Detalle'])||'')
    };
  }).reverse();

  return {success:true,historial:rows};
}


function actualizarRepresentanteTraspasoARS(token, registroId, vendedorNombre) {
  var session=requireSession_(token);

  if(['DIRECTORA','GERENTE','COORDINADOR'].indexOf(session.role)===-1){
    throw new Error('Tu rol no puede reasignar el representante de un traspaso.');
  }

  registroId=String(registroId||'').trim();
  vendedorNombre=String(vendedorNombre||'').trim();

  if(!registroId) throw new Error('Registro ARS requerido.');
  if(!vendedorNombre) throw new Error('Selecciona un vendedor de tu estructura.');

  var allowed=getAssignableSellersForSession_(session);
  var vendedor=allowed.filter(function(u){
    return sameName_(u.nombre,vendedorNombre);
  })[0];

  if(!vendedor){
    throw new Error('El vendedor seleccionado no pertenece a tu estructura o no está activo.');
  }

  var sh=ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());
  if(sh.getLastRow()<2) throw new Error('No hay traspasos registrados.');

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var rowIndex=-1;
  var row=null;

  for(var i=1;i<data.length;i++){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===registroId){
      rowIndex=i+1;
      row=data[i];
      break;
    }
  }

  if(!row) throw new Error('No se encontró el traspaso.');

  var currentGerencia=String(valueByHeader_(row,map,['Gerencia'])||'');

  if(session.role==='GERENTE' && currentGerencia && currentGerencia!==session.gerenciaId){
    throw new Error('Este traspaso no pertenece a tu gerencia.');
  }

  if(session.role==='COORDINADOR'){
    var registrosPermitidos=filtrarPorSesion_(session,leerARS_(),'ARS').filter(function(r){
      return String(r.id||'')===registroId;
    });
    if(!registrosPermitidos.length){
      throw new Error('Este traspaso no pertenece a tu coordinación.');
    }
  }

  var anteriorNombre=String(valueByHeader_(row,map,['Representante ARS Destino'])||'');
  var anteriorCedula=String(valueByHeader_(row,map,['Cedula Representante','Cédula Representante'])||'');
  var obs=String(valueByHeader_(row,map,['Observaciones'])||'');

  function setHeader_(header,value){
    var idx=map[normalizeHeader_(header)];
    if(idx===undefined) return;
    sh.getRange(rowIndex,idx+1).setValue(value);
  }

  function limpiarObservacionesAlerta_(text){
    var out=String(text||'');
    var fragments=[
      /⚠\s*El representante que aparece en el formulario no pertenece a la Dirección de Negocios de Maite\.\s*La producción fue asignada temporalmente a[^|]*/gi,
      /⚠\s*El representante que aparece en el formulario no pertenece a la Direccion de Negocios de Maite\.\s*La producción fue asignada temporalmente a[^|]*/gi,
      /⚠\s*El representante que aparece en el formulario no pertenece a la Dirección de Negocios de Maite\.\s*La producción fue asignada manualmente a[^|]*/gi,
      /⚠\s*El representante que aparece en el formulario no pertenece a la Direccion de Negocios de Maite\.\s*La producción fue asignada manualmente a[^|]*/gi,
      /⚠\s*No se detectó un representante perteneciente a la Dirección de Negocios de Maite\.\s*La producción fue asignada temporalmente a[^|]*/gi,
      /⚠\s*No se detectó un representante perteneciente a la Direccion de Negocios de Maite\.\s*La producción fue asignada temporalmente a[^|]*/gi
    ];
    fragments.forEach(function(rx){ out=out.replace(rx,''); });
    out=out.replace(/\s+\|\s+\|/g,' | ').replace(/^\s*\|\s*/,'').replace(/\s*\|\s*$/,'').trim();
    return out;
  }

  setHeader_('Representante ARS Destino',vendedor.nombre);
  setHeader_('Cedula Representante',vendedor.cedula||'');
  setHeader_('Gestor Traspaso',vendedor.nombre);
  setHeader_('Cedula Gestor Traspaso',vendedor.cedula||'');
  setHeader_('Gerencia',vendedor.gerenciaId||'');
  setHeader_('Coordinador',vendedor.coordinadorId||'');
  setHeader_('Supervisor',vendedor.supervisorId||'');

  // Estado explícito y visible luego de una corrección manual.
  setHeader_('Estado Validacion','TRASPASO REVISADO');

  var cambio='Traspaso revisado por '+(session.nombre||session.usuario)+
    ': representante '+(anteriorNombre||'SIN REPRESENTANTE')+
    (anteriorCedula?' ('+anteriorCedula+')':'')+
    ' → '+vendedor.nombre+
    (vendedor.cedula?' ('+vendedor.cedula+')':'');

  var limpio=limpiarObservacionesAlerta_(obs);
  var nuevaObs=limpio ? (limpio+' | '+cambio) : cambio;
  setHeader_('Observaciones',nuevaObs);

  SpreadsheetApp.flush();

  try{
    registrarAuditoria_(
      'ACTUALIZAR_REPRESENTANTE_ARS',
      session,
      registroId+' | '+cambio
    );
  }catch(e){}

  registrarHistorialAlertaARS_(
    session,
    registroId,
    'REPRESENTANTE',
    'TRASPASO REVISADO',
    anteriorNombre+(anteriorCedula?' | '+anteriorCedula:''),
    vendedor.nombre+(vendedor.cedula?' | '+vendedor.cedula:''),
    cambio
  );

  registrarHistorialEstadoARS_(session,registroId,'TRASPASO REVISADO',{
    observacion:cambio
  });

  return {
    success:true,
    id:registroId,
    representanteNombre:vendedor.nombre,
    representanteCedula:vendedor.cedula||'',
    gestor:vendedor.nombre,
    gerenciaId:vendedor.gerenciaId||'',
    coordinadorId:vendedor.coordinadorId||'',
    supervisorId:vendedor.supervisorId||'',
    estadoValidacion:'TRASPASO REVISADO',
    alertaRepresentanteResuelta:true,
    mensaje:'Representante actualizado. Traspaso marcado como revisado.'
  };
}


function guardarTraspasoARS(token, record) {
  record=Object.assign({},record||{});
  record.telefono=validarTelefonoObligatorio_(record.telefono);
  var lock=null;

  try{
    var session=requireSession_(token);
    record=Object.assign({},record||{});

    var nuct=String(record.nuct||'').trim();
    if(nuct && !/^\d{8}$/.test(nuct)) throw new Error('El NUCT debe tener exactamente 8 dígitos o quedar vacío.');
    if(nuct && nuctExisteARS_(nuct,record.id)) throw new Error('El NUCT '+nuct+' ya existe en la base de datos.');

    record.usuarioRegistro=session.nombre||session.usuario||'';
    record.usuarioRegistroId=session.usuario||'';
    record.rolUsuarioRegistro=session.role||'';

    var representante=resolverGestorARS_(record.representanteNombre,record.representanteCedula);
    var requestedAssignment=String(record.asignacionManual||'').trim();
    var tieneAsignacionManual=!!requestedAssignment && requestedAssignment!=='AUTO';

    if(tieneAsignacionManual){
      var nombreAsignado=resolverVendedorAsignado_(session,requestedAssignment);
      var assignedUser=getUsers_().filter(function(u){
        return u.activo!==false && sameName_(u.nombre,nombreAsignado);
      })[0];

      record.gestor=nombreAsignado;
      record.cedulaGestor=assignedUser ? assignedUser.cedula||'' : '';
      record.gerenciaId=assignedUser ? assignedUser.gerenciaId||session.gerenciaId||'' : session.gerenciaId||'';
      record.coordinadorId=assignedUser ? assignedUser.coordinadorId||'' : session.coordinadorId||'';
      record.supervisorId=assignedUser ? assignedUser.supervisorId||'' : session.supervisorId||'';
      record.estadoValidacion=representante.encontrado?'VALIDADO':'REVISAR REPRESENTANTE';

      if(!representante.encontrado){
        var avisoManual='⚠ '+representante.motivo+' La producción fue asignada manualmente a '+record.gestor+'.';
        record.observaciones=record.observaciones ? record.observaciones+' | '+avisoManual : avisoManual;
      }
    }else if(String(record.origenExtraccion||'').toUpperCase()==='MANUAL' && record.gestor){
      var manualName=resolverVendedorAsignado_(session,record.gestor);
      var manualUser=getUsers_().filter(function(u){
        return u.activo!==false && sameName_(u.nombre,manualName);
      })[0];

      record.gestor=manualName;
      record.cedulaGestor=manualUser ? manualUser.cedula||'' : '';
      record.gerenciaId=manualUser ? manualUser.gerenciaId||session.gerenciaId||'' : session.gerenciaId||'';
      record.coordinadorId=manualUser ? manualUser.coordinadorId||'' : session.coordinadorId||'';
      record.supervisorId=manualUser ? manualUser.supervisorId||'' : session.supervisorId||'';
      record.estadoValidacion='VALIDADO';

      if(!record.representanteNombre) record.representanteNombre=record.gestor;
      if(!record.representanteCedula) record.representanteCedula=record.cedulaGestor;
    }else if(representante.encontrado){
      record.gestor=representante.gestor;
      record.cedulaGestor=representante.cedula;
      record.gerenciaId=representante.gerenciaId;
      record.coordinadorId=representante.coordinadorId;
      record.supervisorId=representante.supervisorId||'';
      record.estadoValidacion='VALIDADO';
    }else{
      var owner=getUsuarioActual_(session);
      record.gestor=owner.nombre||session.nombre||session.usuario||'';
      record.cedulaGestor=owner.cedula||'';
      record.gerenciaId=owner.gerenciaId||session.gerenciaId||'';
      record.coordinadorId=owner.coordinadorId||session.coordinadorId||'';
      record.supervisorId=owner.supervisorId||session.supervisorId||'';
      record.estadoValidacion='REVISAR REPRESENTANTE';

      var aviso='⚠ '+representante.motivo+' La producción fue asignada temporalmente a '+record.gestor+'.';
      if(String(record.observaciones||'').indexOf(representante.motivo)===-1){
        record.observaciones=record.observaciones ? record.observaciones+' | '+aviso : aviso;
      }
    }

    var id=record.id||('ARS-'+Date.now()+'-'+Math.floor(Math.random()*100000));
    var fileUrl=record.archivoAdjunto&&record.archivoAdjunto.base64
      ? subirArchivoBase64_(record.archivoAdjunto,'ARS')
      : '';

    lock=LockService.getScriptLock();
    try{lock.waitLock(15000);}
    catch(lockError){throw new Error('BASE OCUPADA: otro usuario está guardando. Intenta nuevamente.');}

    if(nuct && nuctExisteARS_(nuct,record.id)) throw new Error('El NUCT '+nuct+' ya existe en la base de datos.');

    var sh=ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());
    var values=arsRecordToValues_(record,fileUrl,id);
    var row=buildRowByHeaders_(sh,values);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

    guardarDependientesARS_(id,record);
    SpreadsheetApp.flush();

    if(!verificarRegistroArsGuardado_(id)){
      throw new Error('El servidor no pudo confirmar el registro en PRODUCCION_ARS.');
    }

    try{
      registrarAuditoria_('GUARDAR_TRASPASO_ARS',session,(record.titular||'')+' | '+(record.nuct||'SIN NUCT')+' | Producción: '+(record.gestor||''));
    }catch(e){}

    return {
      success:true,
      id:id,
      fileUrl:fileUrl,
      persistido:true,
      gestorAsignado:record.gestor||'',
      estadoValidacion:record.estadoValidacion||'',
      aviso:record.estadoValidacion==='REVISAR REPRESENTANTE'
        ? 'El representante del formulario no pertenece a la Dirección de Negocios de Maite. Producción asignada a '+(record.gestor||'dueño de la sesión')+'.'
        : '',
      databaseId:getSpreadsheet_().getId(),
      databaseName:getSpreadsheet_().getName()
    };
  }catch(error){
    return {success:false,error:error&&error.message?error.message:String(error)};
  }finally{
    if(lock){try{lock.releaseLock();}catch(e){}}
  }
}

function guardarLoteTraspasosARS(token, records) {
  try {
    requireSession_(token);
    if(!Array.isArray(records)||!records.length) throw new Error('El lote está vacío.');
    if(records.length>20) throw new Error('El máximo permitido es de 20 solicitudes por lote.');
    var ok=0, errores=[];
    records.forEach(function(record,idx){
      var r=guardarTraspasoARS(token,record);
      if(r&&r.success) ok++; else errores.push({indice:idx,error:r&&r.error?r.error:'Error desconocido'});
    });
    return {success:errores.length===0,count:ok,errores:errores,error:errores.length?(errores.length+' registro(s) no se guardaron.') : ''};
  } catch(error){
    return {success:false,error:error.message};
  }
}

function cambiarEstadoTraspasoARS(token, id, estado) {
  try {
    var session=requireSession_(token);
    if(['DIRECTORA','GERENTE','COORDINADOR'].indexOf(session.role)===-1) throw new Error('No autorizado para cambiar estados.');
    var sh=ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());
    var data=sh.getDataRange().getValues(), map=headerMap_(sh);
    var idCol=map[normalizeHeader_('ID')], estadoCol=map[normalizeHeader_('Estado')];
    for(var i=1;i<data.length;i++){
      if(String(data[i][idCol])===String(id)){
        sh.getRange(i+1,estadoCol+1).setValue(safeText_(estado));
        registrarAuditoria_('CAMBIAR_ESTADO_ARS',session,id+' -> '+estado);
        return {success:true};
      }
    }
    throw new Error('Registro no encontrado.');
  } catch(error){ return {success:false,error:error.message}; }
}


function getAfpHeaders_() {
  return [
    'ID','Fecha','Gestor','Afiliado','Cedula','Tipo','Estado','Archivo URL',
    'AFP Origen','Monto',
    'Tipo Renta','CCI','Fecha Nacimiento','Edad','Sexo','Cesante',
    'Telefono','Observaciones'
  ];
}


function obtenerCatalogoAfpOrigenGAS(token){
  requireSession_(token);
  return {
    success:true,
    version:APS_BUILD_VERSION_,
    catalogo:APS_CATALOGS_.AFP_ORIGEN.slice()
  };
}

function guardarTraspasoAFP(token, record) { return guardarRegistroAFP_(requireSession_(token), record, 'Traspaso', 'Emitido'); }
function guardarAfiliacionAFP(token, record) {
  try {
    var session=requireSession_(token);
    record=Object.assign({},record||{});
    record.origen='AFP APS';
    record.tipo='Afiliación AFP';
    record.estado=record.estado||'Pendiente';
    return guardarRegistroAFP_(session,record,'Afiliación AFP','Pendiente');
  } catch(error) {
    return {success:false,error:error.message};
  }
}
function guardarRentaVitalicia(token, record) { return guardarRegistroAFP_(requireSession_(token), record, 'Renta Vitalicia', record && record.estado ? record.estado : 'Validar si cumple'); }

function guardarRegistroAFP_(session, record, tipoDefault, estadoDefault) {
  try {
    record = protegerRegistro_(session, record, 'AFP');
    record.telefono=validarTelefonoObligatorio_(record.telefono);
    var sh = ensureSheetHeaders_('PRODUCCION_AFP', getAfpHeaders_());

    var fileUrl = record.archivoAdjunto && record.archivoAdjunto.base64
      ? subirArchivoBase64_(record.archivoAdjunto, 'AFP')
      : '';

    var obj = {};
    function put(h,v){ obj[normalizeHeader_(h)] = v; }

    put('ID', record.id || ('AFP-' + Date.now()));
    put('Fecha', record.fecha || fechaHoy_());
    put('Gestor', safeText_(record.gestor || ''));
    put('Afiliado', safeText_(record.afiliado || record.nombre || ''));
    put('Cedula', safeText_(record.cedula || ''));
    put('Tipo', safeText_(record.tipo || tipoDefault));
    put('Estado', safeText_(record.estado || estadoDefault));
    put('Archivo URL', fileUrl);
    put('AFP Origen', safeText_(record.origen || ''));

    // La columna Monto se conserva solo por compatibilidad histórica.
    // En nuevos traspasos AFP se utiliza CCI.
    put('Monto', Number(record.monto || 0));

    put('Tipo Renta', safeText_(record.tipoRenta || ''));
    put('CCI', Number(record.cci || 0));
    put('Fecha Nacimiento', safeText_(record.fechaNacimiento || ''));
    put('Edad', Number(record.edad || 0));
    put('Sexo', safeText_(record.sexo || ''));
    put('Cesante', safeText_(record.cesante || ''));
    put('Telefono', safeText_(record.telefono || ''));
    put('Observaciones', safeText_(record.observaciones || ''));

    var row = buildRowByHeaders_(sh, obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    try {
      registrarAuditoria_(
        'GUARDAR_'+normalizeHeader_(record.tipo||tipoDefault).toUpperCase(),
        session,
        (record.afiliado||record.nombre||'')+' | Asignado a: '+(record.gestor||'')
      );
    } catch(e) {}

    return { success: true, fileUrl: fileUrl, asignadoA:record.gestor||'' };
  } catch (error) {
    try{registrarErrorSistema_(session,'AFP','guardarRegistroAFP_',error,record&&record.tipo||tipoDefault||'');}catch(ignore){}
    return { success: false, error: error.message };
  }
}


function aseguradoraAPS_() {
  return 'SEGUROS APS';
}

function obtenerVersionSegurosAPS() {
  return {
    success:true,
    version:'APS-SEGUROS-ONLY-20260920-V2',
    aseguradora:aseguradoraAPS_()
  };
}

function guardarSeguro(token, record) {
  try{
    var session=requireSession_(token);
    record=protegerRegistro_(session,record,'SEGURO');

    record.telefono=validarTelefonoObligatorio_(record.telefono);

    // REGLA FIJA DEL NEGOCIO:
    // Este sistema solo registra ventas de SEGUROS APS.
    record.insurer=aseguradoraAPS_();

    var sh=ensureSheetHeaders_(
      'PRODUCCION_SEGUROS',
      ['ID','Fecha','Cliente','Cédula/RNC','Telefono','Producto','Aseguradora','Póliza','Prima','Cobrado','Pendiente','Estado','Gestor']
    );

    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('ID',record.id||('SALE-'+Date.now()));
    put('Fecha',record.date||fechaHoy_());
    put('Cliente',safeText_(record.client||''));
    put('Cédula/RNC',safeText_(record.identifier||''));
    put('Telefono',record.telefono);
    put('Producto',safeText_(record.product||''));
    put('Aseguradora',aseguradoraAPS_());
    put('Póliza',safeText_(record.policy||''));
    put('Prima',Number(record.amount||0));
    put('Cobrado',Number(record.collected||0));
    put('Pendiente',Number(record.pending||0));
    put('Estado',safeText_(record.status||'Pendiente'));
    put('Gestor',safeText_(record.seller||''));

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    return {
      success:true,
      asignadoA:record.seller||'',
      aseguradora:aseguradoraAPS_(),
      databaseId:getSpreadsheet_().getId()
    };

  }catch(error){
    try{registrarErrorSistema_(typeof session!=='undefined'?session:null,'SEGUROS','guardarSeguro',error,'');}catch(ignore){}
    return {success:false,error:error.message};
  }
}




/* ============================================================
   CORTES COMERCIALES PARA WHATSAPP
   ============================================================ */

function getCortesComercialesHeaders_() {
  return [
    'ID','Fecha','Tipo','Usuario ID','Responsable','Rol',
    'Gerencia','Coordinador','Supervisor','Alcance',
    'Traspasos ARS','Dependientes en Traspasos','Total Movimientos',
    'Afiliaciones Nuevas','Cargas Dependientes',
    'AFP','CCI AFP','Renta Vitalicia','CCI Renta Vitalicia','CCI Total',
    'Seguros','Detalle Seguros','Fianzas',
    'Detalle Produccion por Gestor','Detalle Supervisiones',
    'Total Operaciones','Pendientes',
    'Nota','Texto','Estado',
    'Fecha Hora Generacion','Fecha Hora Copiado','Fecha Hora Abierto WhatsApp','Fecha Hora Confirmado'
  ];
}

function puedeGenerarCortes_(session) {
  return !!session && ['DIRECTORA','GERENTE','COORDINADOR','SUPERVISOR'].indexOf(session.role) !== -1;
}

function nombreAlcanceCorte_(session) {
  if (session.role === 'DIRECTORA') return 'DIRECCIÓN COMERCIAL';
  if (session.role === 'GERENTE') return 'GERENCIA · ' + (session.nombre || '');
  if (session.role === 'COORDINADOR') return 'COORDINACIÓN · ' + (session.nombre || '');
  if (session.role === 'SUPERVISOR') return 'SUPERVISIÓN · ' + (session.nombre || '');
  return session.nombre || '';
}

function esFianzaProducto_(producto) {
  var p = normalizeHeader_(producto || '');
  return p.indexOf('fianza') !== -1 || p.indexOf('garant') !== -1;
}

function esPendienteCorte_(estado) {
  var e = normalizeHeader_(estado || '');
  return e.indexOf('pend') !== -1 ||
         e.indexOf('curso') !== -1 ||
         e === 'pe' ||
         e.indexOf('validar') !== -1 ||
         e.indexOf('revision') !== -1 ||
         e.indexOf('revisar') !== -1 ||
         e.indexOf('proceso') !== -1;
}

function agruparProductosSeguros_(records) {
  var map = {};
  (records || []).forEach(function(r){
    var raw = safeText_(r.product || '').trim() || 'Sin especificar';
    var key = normalizeHeader_(raw);
    if (!map[key]) map[key] = {nombre:raw, cantidad:0};
    map[key].cantidad++;
  });
  return Object.keys(map).map(function(k){return map[k];})
    .sort(function(a,b){ return b.cantidad-a.cantidad || a.nombre.localeCompare(b.nombre); });
}

function formatoDineroCorte_(n) {
  n=Number(n||0);
  if(!isFinite(n))n=0;

  var sign=n<0?'-':'';
  var parts=Math.abs(n).toFixed(2).split('.');
  var integer=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return 'RD$ '+sign+integer+'.'+parts[1];
}


function indexarUsuariosCorte_(){
  var users=getUsers_();
  var byId={},byName={};

  users.forEach(function(u){
    byId[String(u.usuario||'')]=u;
    var key=normalizarNombrePersona_(u.nombre||'');
    if(key&&!byName[key])byName[key]=u;
  });

  return {users:users,byId:byId,byName:byName};
}

function resolverUsuarioCortePorNombre_(index,nombre){
  var key=normalizarNombrePersona_(nombre||'');
  return key?(index.byName[key]||null):null;
}

function nombreUsuarioCorte_(index,userId){
  var u=index.byId[String(userId||'')];
  return u&&u.nombre?u.nombre:'';
}

function supervisionLabelCorte_(index,gestor,recordSupervisorId,recordCoordinadorId){
  var supId=String(recordSupervisorId||'');
  var coordId=String(recordCoordinadorId||'');

  if(!supId&&gestor)supId=String(gestor.supervisorId||'');
  if(!coordId&&gestor)coordId=String(gestor.coordinadorId||'');

  if(supId){
    var sup=index.byId[supId];
    return sup&&sup.nombre
      ? 'SUPERVISIÓN · '+sup.nombre
      : 'SUPERVISIÓN · '+supId;
  }

  if(coordId){
    var coord=index.byId[coordId];
    return 'SIN SUPERVISOR · COORDINACIÓN · '+(coord&&coord.nombre?coord.nombre:coordId);
  }

  if(gestor&&gestor.gerenciaId){
    var gerente=index.users.filter(function(u){
      return u.activo!==false&&u.rol==='GERENTE'&&u.gerenciaId===gestor.gerenciaId;
    })[0];
    return 'SIN SUPERVISOR · DIRECTO DE GERENCIA'+(gerente&&gerente.nombre?' · '+gerente.nombre:'');
  }

  return 'SUPERVISIÓN NO IDENTIFICADA';
}

function crearDetalleGestoresCorte_(ars,afi,afp,seg){
  var index=indexarUsuariosCorte_();
  var map={};

  function ensure(gestorNombre,gestorObj,supervision){
    var nombre=String(gestorNombre||'').trim()||'SIN GESTOR ASIGNADO';
    var key=normalizarNombrePersona_(nombre)||nombre;
    if(!map[key]){
      map[key]={
        gestor:nombre,
        gestorId:gestorObj?gestorObj.usuario:'',
        supervision:supervision||'SUPERVISIÓN NO IDENTIFICADA',
        traspasos:0,
        dependientesTraspasos:0,
        afiliaciones:0,
        cargasDependientes:0,
        afp:0,
        renta:0,
        seguros:0,
        fianzas:0,
        cciAfp:0,
        cciRenta:0,
        totalOperaciones:0,
        totalMovimientosArs:0
      };
    }
    return map[key];
  }

  (ars||[]).forEach(function(r){
    var nombre=r.gestorName||'';
    var gestor=resolverUsuarioCortePorNombre_(index,nombre);
    var sup=supervisionLabelCorte_(index,gestor,r.supervisorId,r.coordinadorId);
    var x=ensure(nombre,gestor,sup);
    x.traspasos++;
    x.dependientesTraspasos+=Number(r.dependientes||0);
    x.totalMovimientosArs+=1+Number(r.dependientes||0);
    x.totalOperaciones++;
  });

  (afi||[]).forEach(function(r){
    // AFILIACIONES_ARS no tiene un campo de "Gestor de producción" separado.
    // Solo atribuimos como Gestor si quien registró realmente tiene rol GESTOR.
    var gestor=index.byId[String(r.vendedorAsignadoId||'')]||
      resolverUsuarioCortePorNombre_(index,r.vendedorAsignado||'')||
      index.byId[String(r.usuarioRegistroId||'')]||
      resolverUsuarioCortePorNombre_(index,r.cargadoPor||'');

    var nombre=r.vendedorAsignado||(gestor&&gestor.nombre)||r.cargadoPor||'SIN PRODUCTOR ASIGNADO';
    var sup=gestor
      ? supervisionLabelCorte_(index,gestor,r.supervisorId,r.coordinadorId)
      : 'SUPERVISIÓN NO IDENTIFICADA';
    var x=ensure(nombre,gestor,sup);

    if(r.tipoAfiliado==='Dependiente')x.cargasDependientes++;
    else x.afiliaciones++;
    x.totalOperaciones++;
  });

  (afp||[]).forEach(function(r){
    var nombre=r.gestor||'';
    var gestor=resolverUsuarioCortePorNombre_(index,nombre);
    var sup=supervisionLabelCorte_(index,gestor,'','');
    var x=ensure(nombre,gestor,sup);
    if(normalizeHeader_(r.tipo||'').indexOf('renta')!==-1){
      x.renta++;
      x.cciRenta+=Number(r.cci||0);
    }else{
      x.afp++;
      x.cciAfp+=Number(r.cci||0);
    }
    x.totalOperaciones++;
  });

  (seg||[]).forEach(function(r){
    var nombre=r.seller||'';
    var gestor=resolverUsuarioCortePorNombre_(index,nombre);
    var sup=supervisionLabelCorte_(index,gestor,'','');
    var x=ensure(nombre,gestor,sup);
    if(esFianzaProducto_(r.product))x.fianzas++;
    else x.seguros++;
    x.totalOperaciones++;
  });

  return Object.keys(map).map(function(k){return map[k];})
    .filter(function(x){return x.totalOperaciones>0;})
    .sort(function(a,b){
      var s=String(a.supervision||'').localeCompare(String(b.supervision||''));
      if(s!==0)return s;
      return b.totalOperaciones-a.totalOperaciones||String(a.gestor).localeCompare(String(b.gestor));
    });
}

function agruparSupervisionesCorte_(detalleGestores){
  var map={};

  (detalleGestores||[]).forEach(function(g){
    var key=g.supervision||'SUPERVISIÓN NO IDENTIFICADA';
    if(!map[key]){
      map[key]={
        supervision:key,
        gestores:0,
        totalOperaciones:0,
        movimientosArs:0
      };
    }
    map[key].gestores++;
    map[key].totalOperaciones+=Number(g.totalOperaciones||0);
    map[key].movimientosArs+=Number(g.totalMovimientosArs||0);
  });

  return Object.keys(map).map(function(k){return map[k];})
    .sort(function(a,b){return b.totalOperaciones-a.totalOperaciones||a.supervision.localeCompare(b.supervision);});
}

function resumenProcesosGestorCorte_(g){
  var parts=[];
  if(g.traspasos)parts.push('ARS '+g.traspasos+(g.dependientesTraspasos?' + '+g.dependientesTraspasos+' dep.':''));
  if(g.afiliaciones)parts.push('Afiliaciones '+g.afiliaciones);
  if(g.cargasDependientes)parts.push('Cargas dep. '+g.cargasDependientes);
  if(g.afp)parts.push('AFP '+g.afp+(g.cciAfp?' ('+formatoDineroCorte_(g.cciAfp)+')':''));
  if(g.renta)parts.push('Renta '+g.renta+(g.cciRenta?' ('+formatoDineroCorte_(g.cciRenta)+')':''));
  if(g.seguros)parts.push('Seguros '+g.seguros);
  if(g.fianzas)parts.push('Fianzas '+g.fianzas);
  return parts.join(' · ')||'Sin detalle';
}



function probarFormatoDineroCorte_(){
  return {
    cero:formatoDineroCorte_(0),
    mil:formatoDineroCorte_(1000),
    ejemplo:formatoDineroCorte_(1250000.5)
  };
}

function construirTextoCorte_(session, tipo, d, nota) {
  var fecha=Utilities.formatDate(new Date(),APS_CONFIG.TIMEZONE,'dd/MM/yyyy');
  var hora=Utilities.formatDate(new Date(),APS_CONFIG.TIMEZONE,'hh:mm a');
  var titulo=tipo==='CIERRE'
    ? '✅ CIERRE COMERCIAL'
    : '📊 '+(tipo==='CORTE_1'?'CORTE 1':'CORTE 2');

  var lines=[
    titulo+' – '+nombreAlcanceCorte_(session),
    'Fecha: '+fecha,
    'Hora: '+hora,
    'Responsable: '+(session.nombre||''),
    '',
    'ARS',
    'Traspasos: '+d.traspasos,
    'Dependientes en traspasos: '+d.depTraspasos,
    'Total de movimientos: '+d.movimientos,
    'Afiliaciones nuevas: '+d.afiliaciones,
    'Cargas de dependientes: '+d.cargasDependientes,
    '',
    'AFP Y RENTA VITALICIA',
    'AFP: '+d.afp,
    'CCI AFP: '+formatoDineroCorte_(d.cciAfp),
    'Renta Vitalicia: '+d.renta,
    'CCI Renta Vitalicia: '+formatoDineroCorte_(d.cciRenta),
    'CCI total: '+formatoDineroCorte_(d.cciTotal),
    '',
    'SEGUROS Y FIANZAS',
    'Seguros: '+d.seguros
  ];

  d.detalleSeguros.forEach(function(x){
    lines.push('• '+x.nombre+': '+x.cantidad);
  });

  lines.push('Fianzas: '+d.fianzas);

  lines.push('');
  lines.push('PRODUCCIÓN POR GESTOR Y SUPERVISIÓN');

  if(!d.detalleGestores||!d.detalleGestores.length){
    lines.push('Sin producción registrada.');
  }else{
    var actual='';
    d.detalleGestores.forEach(function(g){
      if(g.supervision!==actual){
        actual=g.supervision;
        lines.push('');
        lines.push('▸ '+actual);
      }
      lines.push('• '+g.gestor+' — '+resumenProcesosGestorCorte_(g));
    });
  }

  lines.push('');
  lines.push('RESUMEN');
  lines.push('Total de operaciones: '+d.totalOperaciones);
  lines.push('Pendientes: '+d.pendientes);

  if(nota){
    lines.push('');
    lines.push('Observación: '+nota);
  }

  return lines.join('\n');
}

function calcularCorteActual_(session) {
  var hoy=fechaHoy_();

  var ars=filtrarPorSesion_(session,leerARS_(),'ARS').filter(function(r){
    return String(r.fecha||'')===hoy &&
           String(r.estado||'').toUpperCase().indexOf('OBJETADO')===-1;
  });

  var afi=filtrarAfiliacionesPorSesion_(session,leerAfiliacionesARS_()).filter(function(r){
    return String(r.fechaCarga||'')===hoy;
  });

  var afp=filtrarPorSesion_(session,leerAFP_(),'AFP').filter(function(r){
    return String(r.fecha||'')===hoy;
  });

  var seg=filtrarPorSesion_(session,leerSeguros_(),'SEGURO').filter(function(r){
    return String(r.date||'')===hoy;
  });

  var depTraspasos=ars.reduce(function(s,r){return s+Number(r.dependientes||0);},0);
  var afNuevas=afi.filter(function(r){return r.tipoAfiliado==='Titular';});
  var cargasDep=afi.filter(function(r){return r.tipoAfiliado==='Dependiente';});
  var renta=afp.filter(function(r){return normalizeHeader_(r.tipo||'').indexOf('renta')!==-1;});
  var afpNormal=afp.filter(function(r){return normalizeHeader_(r.tipo||'').indexOf('renta')===-1;});
  var fianzas=seg.filter(function(r){return esFianzaProducto_(r.product);});
  var seguros=seg.filter(function(r){return !esFianzaProducto_(r.product);});

  var cciAfp=afpNormal.reduce(function(s,r){return s+Number(r.cci||0);},0);
  var cciRenta=renta.reduce(function(s,r){return s+Number(r.cci||0);},0);

  var pendientes=
    ars.filter(function(r){return esPendienteCorte_(r.estado);}).length+
    afi.filter(function(r){return esPendienteCorte_(r.estado);}).length+
    afp.filter(function(r){return esPendienteCorte_(r.estado);}).length+
    seg.filter(function(r){return esPendienteCorte_(r.status);}).length;

  var detalleGestores=crearDetalleGestoresCorte_(ars,afi,afp,seg);
  var detalleSupervisiones=agruparSupervisionesCorte_(detalleGestores);

  return {
    traspasos:ars.length,
    depTraspasos:depTraspasos,
    movimientos:ars.length+depTraspasos,
    afiliaciones:afNuevas.length,
    cargasDependientes:cargasDep.length,
    afp:afpNormal.length,
    cciAfp:cciAfp,
    renta:renta.length,
    cciRenta:cciRenta,
    cciTotal:cciAfp+cciRenta,
    seguros:seguros.length,
    detalleSeguros:agruparProductosSeguros_(seguros),
    fianzas:fianzas.length,
    totalOperaciones:ars.length+afNuevas.length+cargasDep.length+afpNormal.length+renta.length+seguros.length+fianzas.length,
    pendientes:pendientes,
    detalleGestores:detalleGestores,
    detalleSupervisiones:detalleSupervisiones
  };
}

function generarCorteComercialGAS(token, tipo, nota) {
  var session = requireSession_(token);
  if (!puedeGenerarCortes_(session)) throw new Error('Tu rol no genera cortes comerciales.');

  tipo = String(tipo || '').toUpperCase();
  if (['CORTE_1','CORTE_2','CIERRE'].indexOf(tipo) === -1) throw new Error('Tipo de corte inválido.');

  nota = safeText_(nota || '');
  var d = calcularCorteActual_(session);
  var texto = construirTextoCorte_(session, tipo, d, nota);
  var sh = ensureSheetHeaders_('CORTES_COMERCIALES', getCortesComercialesHeaders_());
  var map = headerMap_(sh);
  var data = sh.getDataRange().getValues();
  var hoy = fechaHoy_();
  var rowIndex = -1;
  var id = '';

  for (var i=1;i<data.length;i++) {
    if (dateToYmd_(valueByHeader_(data[i],map,['Fecha'])) === hoy &&
        String(valueByHeader_(data[i],map,['Tipo'])||'') === tipo &&
        String(valueByHeader_(data[i],map,['Usuario ID'])||'') === String(session.usuario||'')) {
      rowIndex = i+1;
      id = String(valueByHeader_(data[i],map,['ID'])||'');
      break;
    }
  }

  if (!id) id = 'CORTE-' + Date.now() + '-' + Math.floor(Math.random()*10000);
  var now = new Date();
  var detalle = d.detalleSeguros.map(function(x){return x.nombre+':'+x.cantidad;}).join(' | ');
  var obj = {};
  function put(h,v){obj[normalizeHeader_(h)]=v;}

  put('ID',id); put('Fecha',hoy); put('Tipo',tipo);
  put('Usuario ID',session.usuario||''); put('Responsable',session.nombre||''); put('Rol',session.role||'');
  put('Gerencia',session.gerenciaId||''); put('Coordinador',session.coordinadorId||''); put('Supervisor',session.supervisorId||'');
  put('Alcance',nombreAlcanceCorte_(session));
  put('Traspasos ARS',d.traspasos); put('Dependientes en Traspasos',d.depTraspasos); put('Total Movimientos',d.movimientos);
  put('Afiliaciones Nuevas',d.afiliaciones); put('Cargas Dependientes',d.cargasDependientes);
  put('AFP',d.afp); put('CCI AFP',d.cciAfp); put('Renta Vitalicia',d.renta); put('CCI Renta Vitalicia',d.cciRenta); put('CCI Total',d.cciTotal);
  put('Seguros',d.seguros); put('Detalle Seguros',detalle); put('Fianzas',d.fianzas);
  put('Detalle Produccion por Gestor',JSON.stringify(d.detalleGestores||[]));
  put('Detalle Supervisiones',JSON.stringify(d.detalleSupervisiones||[]));
  put('Total Operaciones',d.totalOperaciones); put('Pendientes',d.pendientes);
  put('Nota',nota); put('Texto',texto); put('Estado','GENERADO'); put('Fecha Hora Generacion',now);
  put('Fecha Hora Copiado',''); put('Fecha Hora Abierto WhatsApp',''); put('Fecha Hora Confirmado','');

  var row = buildRowByHeaders_(sh,obj);
  if (rowIndex > 0) sh.getRange(rowIndex,1,1,row.length).setValues([row]);
  else sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

  registrarAuditoria_('GENERAR_'+tipo,session,nombreAlcanceCorte_(session)+' | '+d.totalOperaciones+' operaciones');

  return {success:true,id:id,tipo:tipo,texto:texto,estado:'GENERADO',datos:d};
}

function actualizarEstadoCorteGAS(token, corteId, estado) {
  var session = requireSession_(token);
  estado = String(estado || '').toUpperCase();
  var validos = ['COPIADO','ABIERTO_WHATSAPP','CONFIRMADO_ENVIADO'];
  if (validos.indexOf(estado) === -1) throw new Error('Estado inválido.');

  var sh = ensureSheetHeaders_('CORTES_COMERCIALES', getCortesComercialesHeaders_());
  if (sh.getLastRow() < 2) throw new Error('Corte no encontrado.');
  var data = sh.getDataRange().getValues(), map = headerMap_(sh), rowIndex=-1, row=null;

  for(var i=1;i<data.length;i++){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===String(corteId||'')){rowIndex=i+1;row=data[i];break;}
  }
  if(!row) throw new Error('Corte no encontrado.');

  var owner = String(valueByHeader_(row,map,['Usuario ID'])||'');
  if(session.role!=='DIRECTORA' && owner!==String(session.usuario||'')) throw new Error('No puedes modificar este corte.');

  var now=new Date();
  sh.getRange(rowIndex, map[normalizeHeader_('Estado')]+1).setValue(estado);
  var targetHeader = estado==='COPIADO' ? 'Fecha Hora Copiado'
    : estado==='ABIERTO_WHATSAPP' ? 'Fecha Hora Abierto WhatsApp' : 'Fecha Hora Confirmado';
  sh.getRange(rowIndex, map[normalizeHeader_(targetHeader)]+1).setValue(now);

  return {success:true,estado:estado};
}

function listarCortesHoyGAS(token) {
  var session=requireSession_(token);
  if(!puedeGenerarCortes_(session)) return {success:true,cortes:[]};

  var sh=ensureSheetHeaders_('CORTES_COMERCIALES',getCortesComercialesHeaders_());
  if(sh.getLastRow()<2) return {success:true,cortes:[]};
  var data=sh.getDataRange().getValues(), map=headerMap_(sh), hoy=fechaHoy_();

  var rows=data.slice(1).filter(function(r){
    if(dateToYmd_(valueByHeader_(r,map,['Fecha']))!==hoy) return false;
    if(session.role==='DIRECTORA') return true;
    return String(valueByHeader_(r,map,['Usuario ID'])||'')===String(session.usuario||'');
  }).map(function(r){
    function dt(h){
      var v=valueByHeader_(r,map,[h]);
      return v instanceof Date ? Utilities.formatDate(v,APS_CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss') : String(v||'');
    }
    return {
      id:String(valueByHeader_(r,map,['ID'])||''),
      tipo:String(valueByHeader_(r,map,['Tipo'])||''),
      responsable:String(valueByHeader_(r,map,['Responsable'])||''),
      rol:String(valueByHeader_(r,map,['Rol'])||''),
      alcance:String(valueByHeader_(r,map,['Alcance'])||''),
      estado:String(valueByHeader_(r,map,['Estado'])||''),
      totalOperaciones:Number(valueByHeader_(r,map,['Total Operaciones'])||0),
      movimientos:Number(valueByHeader_(r,map,['Total Movimientos'])||0),
      detalleGestores:(function(){
        try{return JSON.parse(String(valueByHeader_(r,map,['Detalle Produccion por Gestor'])||'[]'));}
        catch(e){return [];}
      })(),
      detalleSupervisiones:(function(){
        try{return JSON.parse(String(valueByHeader_(r,map,['Detalle Supervisiones'])||'[]'));}
        catch(e){return [];}
      })(),
      texto:String(valueByHeader_(r,map,['Texto'])||''),
      generado:dt('Fecha Hora Generacion'),
      confirmado:dt('Fecha Hora Confirmado')
    };
  });

  return {success:true,cortes:rows};
}


/* ============================================================
   ESTRUCTURA COMERCIAL, TRANSICIONES Y CONFIGURACIÓN
   ============================================================ */

function getEstructuraHeaders_() {
  return [
    'ID Estructura','Nombre','Tipo','Estado','Gerente Usuario',
    'Coordinador Usuario','Responsable Temporal','Fecha Inicio Transicion',
    'Motivo Transicion','Modificado Por','Ultima Modificacion'
  ];
}

function getCatalogoProductosHeaders_() {
  return ['Codigo','Modulo','Proceso','Activo','Unidad','Orden'];
}

function getMetasHeaders_() {
  return [
    'ID','Periodo','Nivel','Referencia','Proceso',
    'Meta Cantidad','Meta Monto','Activo','Modificado Por','Ultima Modificacion'
  ];
}


/* ============================================================
   REPORTES COMERCIALES
   ============================================================ */

function getReportesGeneradosHeaders_(){
  return [
    'ID Reporte','Fecha Hora','Usuario ID','Usuario','Rol',
    'Nivel','Referencia','Periodo','Fecha Desde','Fecha Hasta',
    'Procesos','Estado','Estructura','Detalle','Filtros JSON'
  ];
}

function getReportesFavoritosHeaders_(){
  return [
    'ID Favorito','Usuario ID','Nombre','Configuracion JSON',
    'Fecha Hora Creacion','Fecha Hora Modificacion'
  ];
}

function leerMetasReportes_(session){
  var sh=ensureSheetHeaders_('METAS_COMERCIALES',getMetasHeaders_());
  if(sh.getLastRow()<2)return [];

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var allowed={};

  function add(v){
    var s=normalizeHeader_(v||'');
    if(s)allowed[s]=true;
  }

  add(session.usuario);
  add(session.nombre);
  add(session.gerenciaId);
  add('DIRECCION_COMERCIAL');

  (getStructureUsersForSession_(session)||[]).forEach(function(u){
    add(u.id);add(u.nombre);add(u.gerenciaId);add(u.coordinadorId);add(u.supervisorId);
  });

  return data.slice(1).filter(function(r){
    if(session.role==='DIRECTORA')return true;
    var ref=valueByHeader_(r,map,['Referencia']);
    return !ref || !!allowed[normalizeHeader_(ref)];
  }).map(function(r){
    return {
      id:String(valueByHeader_(r,map,['ID'])||''),
      periodo:String(valueByHeader_(r,map,['Periodo'])||''),
      nivel:String(valueByHeader_(r,map,['Nivel'])||''),
      referencia:String(valueByHeader_(r,map,['Referencia'])||''),
      proceso:String(valueByHeader_(r,map,['Proceso'])||''),
      metaCantidad:Number(valueByHeader_(r,map,['Meta Cantidad'])||0),
      metaMonto:Number(valueByHeader_(r,map,['Meta Monto'])||0),
      activo:normalizeHeader_(valueByHeader_(r,map,['Activo'])||'SI')!=='no'
    };
  });
}


function listarMetasComercialesGAS(token){
  var session=requireSession_(token);
  if(session.role!=='DIRECTORA')throw new Error('Solo Dirección puede administrar metas comerciales.');

  var sh=ensureSheetHeaders_('METAS_COMERCIALES',getMetasHeaders_());
  if(sh.getLastRow()<2)return {success:true,metas:[]};

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  var metas=data.slice(1).map(function(r){
    return {
      id:String(valueByHeader_(r,map,['ID'])||''),
      periodo:String(valueByHeader_(r,map,['Periodo'])||''),
      nivel:String(valueByHeader_(r,map,['Nivel'])||''),
      referencia:String(valueByHeader_(r,map,['Referencia'])||''),
      proceso:String(valueByHeader_(r,map,['Proceso'])||'TOTAL'),
      metaCantidad:Number(valueByHeader_(r,map,['Meta Cantidad'])||0),
      metaMonto:Number(valueByHeader_(r,map,['Meta Monto'])||0),
      activo:normalizeHeader_(valueByHeader_(r,map,['Activo'])||'SI')!=='no',
      modificadoPor:String(valueByHeader_(r,map,['Modificado Por'])||''),
      ultimaModificacion:valueByHeader_(r,map,['Ultima Modificacion'])||''
    };
  });

  metas.sort(function(a,b){
    return String(b.periodo||'').localeCompare(String(a.periodo||'')) ||
      String(a.nivel||'').localeCompare(String(b.nivel||'')) ||
      String(a.referencia||'').localeCompare(String(b.referencia||'')) ||
      String(a.proceso||'').localeCompare(String(b.proceso||''));
  });

  return {success:true,metas:metas};
}

function validarMetaReferencia_(nivel,referencia){
  nivel=String(nivel||'').toUpperCase();
  referencia=String(referencia||'').trim();

  if(nivel==='DIRECCION'){
    if(referencia!=='DIRECCION_COMERCIAL')throw new Error('La referencia de Dirección debe ser DIRECCION_COMERCIAL.');
    return true;
  }

  var users=getUsers_().filter(function(u){return u.activo!==false;});

  if(nivel==='GERENCIA'){
    if(!referencia)throw new Error('Selecciona una gerencia.');
    if(!users.some(function(u){return String(u.gerenciaId||'')===referencia;}))throw new Error('La gerencia seleccionada no existe o no está activa.');
    return true;
  }

  var roleByLevel={PRODUCTOR:['GERENTE','COORDINADOR','GESTOR'],COORDINACION:['COORDINADOR'],SUPERVISION:['SUPERVISOR']};
  var roles=roleByLevel[nivel]||[];
  var found=users.some(function(u){
    return String(u.usuario||'')===referencia && roles.indexOf(String(u.rol||''))!==-1;
  });
  if(!found)throw new Error('La referencia seleccionada no corresponde al nivel indicado.');
  return true;
}

function guardarMetaComercialGAS(token,data){
  var session=requireSession_(token);
  if(session.role!=='DIRECTORA')throw new Error('Solo Dirección puede administrar metas comerciales.');
  data=data||{};

  var periodo=String(data.periodo||'').trim();
  if(!/^\d{4}-\d{2}$/.test(periodo))throw new Error('Selecciona un período mensual válido.');

  var nivel=String(data.nivel||'').toUpperCase().trim();
  var niveles=['DIRECCION','GERENCIA','COORDINACION','SUPERVISION','PRODUCTOR'];
  if(niveles.indexOf(nivel)===-1)throw new Error('Nivel de meta no válido.');

  var referencia=String(data.referencia||'').trim();
  validarMetaReferencia_(nivel,referencia);

  var procesosPermitidos=[
    'TOTAL','Traspasos','Afiliaciones nuevas','Carga de dependientes',
    'AFP','Renta Vitalicia','Seguros','Fianzas'
  ];
  var proceso=String(data.proceso||'TOTAL').trim();
  if(procesosPermitidos.indexOf(proceso)===-1)throw new Error('Proceso de meta no válido.');

  var metaCantidad=Number(data.metaCantidad||0);
  var metaMonto=Number(data.metaMonto||0);
  if(!isFinite(metaCantidad)||metaCantidad<0)throw new Error('Meta cantidad inválida.');
  if(!isFinite(metaMonto)||metaMonto<0)throw new Error('Meta monto inválida.');
  if(metaCantidad===0&&metaMonto===0)throw new Error('Indica una meta de cantidad, monto o ambas.');

  var activo=data.activo===false?false:true;
  var sh=ensureSheetHeaders_('METAS_COMERCIALES',getMetasHeaders_());
  var map=headerMap_(sh);
  var rows=sh.getLastRow()>=2?sh.getDataRange().getValues():[];
  var id=String(data.id||'').trim();
  var rowIndex=-1;

  for(var i=1;i<rows.length;i++){
    var rid=String(valueByHeader_(rows[i],map,['ID'])||'');
    if(id&&rid===id)rowIndex=i+1;

    var same=
      String(valueByHeader_(rows[i],map,['Periodo'])||'')===periodo &&
      String(valueByHeader_(rows[i],map,['Nivel'])||'').toUpperCase()===nivel &&
      String(valueByHeader_(rows[i],map,['Referencia'])||'')===referencia &&
      String(valueByHeader_(rows[i],map,['Proceso'])||'TOTAL')===proceso;

    if(same && (!id || rid!==id)){
      throw new Error('Ya existe una meta para ese período, nivel, referencia y proceso.');
    }
  }

  if(!id)id='META-'+periodo.replace('-','')+'-'+Date.now()+'-'+Math.floor(Math.random()*10000);

  var obj={};
  function put(h,v){obj[normalizeHeader_(h)]=v;}
  put('ID',id);
  put('Periodo',periodo);
  put('Nivel',nivel);
  put('Referencia',referencia);
  put('Proceso',proceso);
  put('Meta Cantidad',metaCantidad);
  put('Meta Monto',metaMonto);
  put('Activo',activo?'SI':'NO');
  put('Modificado Por',session.nombre||session.usuario||'');
  put('Ultima Modificacion',new Date());

  var row=buildRowByHeaders_(sh,obj);
  if(rowIndex>0)sh.getRange(rowIndex,1,1,row.length).setValues([row]);
  else sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

  SpreadsheetApp.flush();
  registrarAuditoria_('GUARDAR_META_COMERCIAL',session,
    id+' | '+periodo+' | '+nivel+' | '+referencia+' | '+proceso+' | Cant '+metaCantidad+' | Monto '+metaMonto
  );

  return {success:true,id:id,metas:listarMetasComercialesGAS(token).metas};
}

function cambiarEstadoMetaComercialGAS(token,id,activo){
  var session=requireSession_(token);
  if(session.role!=='DIRECTORA')throw new Error('Solo Dirección puede administrar metas comerciales.');

  var sh=ensureSheetHeaders_('METAS_COMERCIALES',getMetasHeaders_());
  if(sh.getLastRow()<2)throw new Error('Meta no encontrada.');
  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  for(var i=1;i<data.length;i++){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===String(id||'')){
      var rowObj={};
      for(var c=0;c<sh.getLastColumn();c++){
        var h=String(data[0][c]||'');
        rowObj[normalizeHeader_(h)]=data[i][c];
      }
      rowObj[normalizeHeader_('Activo')]=activo?'SI':'NO';
      rowObj[normalizeHeader_('Modificado Por')]=session.nombre||session.usuario||'';
      rowObj[normalizeHeader_('Ultima Modificacion')]=new Date();
      sh.getRange(i+1,1,1,sh.getLastColumn()).setValues([buildRowByHeaders_(sh,rowObj)]);
      SpreadsheetApp.flush();
      registrarAuditoria_(activo?'ACTIVAR_META_COMERCIAL':'DESACTIVAR_META_COMERCIAL',session,String(id||''));
      return {success:true,metas:listarMetasComercialesGAS(token).metas};
    }
  }
  throw new Error('Meta no encontrada.');
}

function eliminarMetaComercialGAS(token,id){
  var session=requireSession_(token);
  if(session.role!=='DIRECTORA')throw new Error('Solo Dirección puede administrar metas comerciales.');

  var sh=ensureSheetHeaders_('METAS_COMERCIALES',getMetasHeaders_());
  if(sh.getLastRow()<2)return {success:true,metas:[]};
  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  for(var i=data.length-1;i>=1;i--){
    if(String(valueByHeader_(data[i],map,['ID'])||'')===String(id||'')){
      sh.deleteRow(i+1);
      SpreadsheetApp.flush();
      registrarAuditoria_('ELIMINAR_META_COMERCIAL',session,String(id||''));
      return {success:true,metas:listarMetasComercialesGAS(token).metas};
    }
  }
  return {success:true,metas:listarMetasComercialesGAS(token).metas};
}

function listarFavoritosReportes_(session){
  var sh=ensureSheetHeaders_('REPORTES_FAVORITOS',getReportesFavoritosHeaders_());
  if(sh.getLastRow()<2)return [];

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  return data.slice(1).filter(function(r){
    return String(valueByHeader_(r,map,['Usuario ID'])||'')===String(session.usuario||'');
  }).map(function(r){
    var raw=String(valueByHeader_(r,map,['Configuracion JSON'])||'{}');
    var cfg={};
    try{cfg=JSON.parse(raw);}catch(e){cfg={};}
    return {
      id:String(valueByHeader_(r,map,['ID Favorito'])||''),
      nombre:String(valueByHeader_(r,map,['Nombre'])||'Reporte favorito'),
      config:cfg
    };
  });
}

function listarFavoritosReportesGAS(token){
  var session=requireSession_(token);
  return {success:true,favoritos:listarFavoritosReportes_(session)};
}

function guardarFavoritoReporteGAS(token,data){
  var session=requireSession_(token);
  data=data||{};

  var nombre=safeText_(data.nombre||'').trim();
  if(!nombre)throw new Error('Escribe un nombre para el reporte favorito.');

  var config=data.config&&typeof data.config==='object'?data.config:{};
  var sh=ensureSheetHeaders_('REPORTES_FAVORITOS',getReportesFavoritosHeaders_());
  var now=new Date();
  var id=String(data.id||'').trim();
  var map=headerMap_(sh);
  var rowIndex=-1;

  if(id&&sh.getLastRow()>=2){
    var rows=sh.getDataRange().getValues();
    for(var i=1;i<rows.length;i++){
      if(String(valueByHeader_(rows[i],map,['ID Favorito'])||'')===id &&
         String(valueByHeader_(rows[i],map,['Usuario ID'])||'')===String(session.usuario||'')){
        rowIndex=i+1;break;
      }
    }
  }

  if(!id)id='RFAV-'+Date.now()+'-'+Math.floor(Math.random()*100000);

  var obj={};
  function put(h,v){obj[normalizeHeader_(h)]=v;}
  put('ID Favorito',id);
  put('Usuario ID',session.usuario||'');
  put('Nombre',nombre);
  put('Configuracion JSON',JSON.stringify(config));
  put('Fecha Hora Creacion',rowIndex>0?valueByHeader_(sh.getRange(rowIndex,1,1,sh.getLastColumn()).getValues()[0],map,['Fecha Hora Creacion']):now);
  put('Fecha Hora Modificacion',now);

  var row=buildRowByHeaders_(sh,obj);
  if(rowIndex>0)sh.getRange(rowIndex,1,1,row.length).setValues([row]);
  else sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

  SpreadsheetApp.flush();
  registrarAuditoria_('GUARDAR_REPORTE_FAVORITO',session,id+' | '+nombre);
  return {success:true,id:id};
}

function eliminarFavoritoReporteGAS(token,id){
  var session=requireSession_(token);
  var sh=ensureSheetHeaders_('REPORTES_FAVORITOS',getReportesFavoritosHeaders_());
  if(sh.getLastRow()<2)return {success:true};

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);

  for(var i=data.length-1;i>=1;i--){
    if(String(valueByHeader_(data[i],map,['ID Favorito'])||'')===String(id||'') &&
       String(valueByHeader_(data[i],map,['Usuario ID'])||'')===String(session.usuario||'')){
      sh.deleteRow(i+1);
      registrarAuditoria_('ELIMINAR_REPORTE_FAVORITO',session,String(id||''));
      return {success:true};
    }
  }
  return {success:true};
}

function registrarGeneracionReporteGAS(token,spec){
  var session=requireSession_(token);
  spec=spec||{};
  var sh=ensureSheetHeaders_('REPORTES_GENERADOS',getReportesGeneradosHeaders_());
  var now=new Date();
  var stamp=Utilities.formatDate(now,APS_CONFIG.TIMEZONE,'yyyyMMdd-HHmmss');
  var id='REP-'+stamp+'-'+String(Math.floor(Math.random()*1000)).padStart(3,'0');

  sh.appendRow([
    id,now,session.usuario||'',session.nombre||'',session.role||'',
    safeText_(spec.nivel||''),safeText_(spec.referencia||''),
    safeText_(spec.periodo||''),safeText_(spec.desde||''),safeText_(spec.hasta||''),
    Array.isArray(spec.procesos)?spec.procesos.join(', '):safeText_(spec.procesos||''),
    safeText_(spec.estado||''),safeText_(spec.estructura||''),
    safeText_(spec.detalle||''),JSON.stringify(spec)
  ]);

  registrarAuditoria_('GENERAR_REPORTE',session,id+' | '+safeText_(spec.nivel||'')+' | '+safeText_(spec.desde||'')+' a '+safeText_(spec.hasta||''));
  return {
    success:true,
    id:id,
    fechaHora:Utilities.formatDate(now,APS_CONFIG.TIMEZONE,'dd/MM/yyyy hh:mm:ss a')
  };
}


function getCierreDiarioHeaders_() {
  return [
    'Fecha','Traspasos ARS','Afiliaciones nuevas','Dependientes',
    'AFP','Renta Vitalicia','Seguros','Fianzas','Total Operaciones',
    'Pendientes','Generado Por','Fecha Hora Generacion'
  ];
}

function ensureCatalogoProductos_() {
  var sh = ensureSheetHeaders_('CATALOGO_PRODUCTOS', getCatalogoProductosHeaders_());
  if (sh.getLastRow() >= 2) return sh;

  var rows = [
    ['ARS_TRASPASOS','ARS','Traspasos','SI','OPERACIONES',10],
    ['ARS_AFILIACIONES_NUEVAS','ARS','Afiliaciones nuevas','SI','OPERACIONES',20],
    ['ARS_DEPENDIENTES','ARS','Carga de dependientes','SI','OPERACIONES',30],
    ['AFP','AFP_Y_RENTA_VITALICIA','AFP','SI','OPERACIONES',40],
    ['RENTA_VITALICIA','AFP_Y_RENTA_VITALICIA','Renta Vitalicia','SI','MONTO_Y_OPERACIONES',50],
    ['SEGUROS','SEGUROS_Y_FIANZAS','Seguros','SI','MONTO_Y_OPERACIONES',60],
    ['FIANZAS','SEGUROS_Y_FIANZAS','Fianzas','SI','MONTO_Y_OPERACIONES',70]
  ];
  sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
  return sh;
}

function ensureEstructuraBase_() {
  var sh = ensureSheetHeaders_('ESTRUCTURA_APS', getEstructuraHeaders_());
  var users = getUsers_();
  var gerencias = {};
  users.forEach(function(u){
    if (u.gerenciaId) gerencias[u.gerenciaId] = true;
  });

  var existing = {};
  if (sh.getLastRow() >= 2) {
    var data = sh.getDataRange().getValues();
    var map = headerMap_(sh);
    data.slice(1).forEach(function(r){
      var id = String(valueByHeader_(r,map,['ID Estructura'])||'');
      if (id) existing[id] = true;
    });
  }

  Object.keys(gerencias).forEach(function(gid){
    if (existing[gid]) return;
    var gerente = users.filter(function(u){
      return u.activo !== false && u.rol === 'GERENTE' && u.gerenciaId === gid;
    })[0];
    var coord = users.filter(function(u){
      return u.activo !== false && u.rol === 'COORDINADOR' && u.gerenciaId === gid;
    })[0];

    sh.appendRow([
      gid,
      gid,
      'GERENCIA',
      gerente ? 'ACTIVA' : 'EN TRANSICIÓN',
      gerente ? gerente.usuario : '',
      coord ? coord.usuario : '',
      gerente ? '' : 'DIRECCION_COMERCIAL',
      gerente ? '' : new Date(),
      gerente ? '' : 'Inicialización sin gerente activo',
      'SISTEMA',
      new Date()
    ]);
  });
  return sh;
}

function leerEstructuras_() {
  var sh = ensureEstructuraBase_();
  if (sh.getLastRow() < 2) return [];

  var data = sh.getDataRange().getValues();
  var map = headerMap_(sh);

  function serializarFecha_(value) {
    if (!value) return '';
    if (value instanceof Date && !isNaN(value.getTime())) {
      return Utilities.formatDate(value, APS_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    }
    return String(value);
  }

  return data.slice(1)
    .filter(function(r){
      return r.some(function(v){ return v !== ''; });
    })
    .map(function(r){
      return {
        id:String(valueByHeader_(r,map,['ID Estructura'])||''),
        nombre:String(valueByHeader_(r,map,['Nombre'])||''),
        tipo:String(valueByHeader_(r,map,['Tipo'])||'GERENCIA'),
        estado:String(valueByHeader_(r,map,['Estado'])||'ACTIVA'),
        gerenteUsuario:String(valueByHeader_(r,map,['Gerente Usuario'])||''),
        coordinadorUsuario:String(valueByHeader_(r,map,['Coordinador Usuario'])||''),
        responsableTemporal:String(valueByHeader_(r,map,['Responsable Temporal'])||''),
        fechaInicioTransicion:serializarFecha_(valueByHeader_(r,map,['Fecha Inicio Transicion'])),
        motivoTransicion:String(valueByHeader_(r,map,['Motivo Transicion'])||''),
        modificadoPor:String(valueByHeader_(r,map,['Modificado Por'])||''),
        ultimaModificacion:serializarFecha_(valueByHeader_(r,map,['Ultima Modificacion']))
      };
    });
}

function actualizarEstadoEstructura_(gerenciaId, patch, session) {
  var sh = ensureEstructuraBase_();
  var data = sh.getDataRange().getValues();
  var map = headerMap_(sh);
  var rowIndex = -1;

  for (var i=1;i<data.length;i++) {
    if (String(valueByHeader_(data[i],map,['ID Estructura'])||'') === String(gerenciaId||'')) {
      rowIndex=i+1; break;
    }
  }

  if (rowIndex < 0) {
    sh.appendRow([
      gerenciaId,gerenciaId,'GERENCIA','ACTIVA','','','','','','',new Date()
    ]);
    rowIndex=sh.getLastRow();
    data=sh.getDataRange().getValues();
    map=headerMap_(sh);
  }

  var row=sh.getRange(rowIndex,1,1,sh.getLastColumn()).getValues()[0];
  var obj={};
  sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].forEach(function(h,idx){
    obj[normalizeHeader_(h)] = row[idx];
  });
  Object.keys(patch||{}).forEach(function(k){
    obj[normalizeHeader_(k)] = patch[k];
  });
  obj[normalizeHeader_('Modificado Por')] = session ? session.nombre : 'SISTEMA';
  obj[normalizeHeader_('Ultima Modificacion')] = new Date();

  var headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  sh.getRange(rowIndex,1,1,headers.length).setValues([headers.map(function(h){
    var v=obj[normalizeHeader_(h)];
    return v===undefined?'':v;
  })]);
}

function desactivarUsuariosConTransicionGAS(token, data) {
  var session=requireSession_(token);
  assertCanManageUsers_(session);
  data=data||{};

  var ids=Array.isArray(data.userIds)?data.userIds.map(String):[];
  ids=ids.filter(function(v,i,a){return v&&a.indexOf(v)===i;});
  if(!ids.length) throw new Error('Selecciona al menos un usuario.');

  var modo=String(data.modo||'TRANSICION').toUpperCase();
  if(['TRANSICION','REASIGNAR'].indexOf(modo)===-1) throw new Error('Modo de salida inválido.');

  var users=getUsers_();
  var targets=ids.map(function(id){
    return users.filter(function(u){return u.usuario===id;})[0];
  });

  if(targets.some(function(u){return !u;})) throw new Error('Uno de los usuarios no existe.');
  if(targets.some(function(u){return u.usuario==='maite.veras'||u.rol==='DIRECTORA';})) {
    throw new Error('Dirección no puede desactivarse.');
  }

  var gerencias={};
  targets.forEach(function(u){if(u.gerenciaId) gerencias[u.gerenciaId]=true;});

  if(modo==='REASIGNAR'){
    var nuevaGerencia=safeText_(data.nuevaGerenciaId||'');
    if(!nuevaGerencia) throw new Error('Selecciona la gerencia de destino.');

    Object.keys(gerencias).forEach(function(gid){
      users.forEach(function(u){
        if(u.activo!==false && u.gerenciaId===gid && ids.indexOf(u.usuario)===-1){
          var anterior=u.gerenciaId;
          u.gerenciaId=nuevaGerencia;
          if(u.rol==='GESTOR') u.coordinadorId='';
          u.versionSesion=Number(u.versionSesion||1)+1;
          u.modificadoPor=session.nombre;
          u.ultimaModificacion=new Date();
          registrarCambioEstructura_(session,u,'REASIGNACION',anterior,nuevaGerencia,'GERENCIA');
        }
      });
      actualizarEstadoEstructura_(gid,{
        'Estado':'INACTIVA',
        'Gerente Usuario':'',
        'Coordinador Usuario':'',
        'Responsable Temporal':'',
        'Fecha Inicio Transicion':'',
        'Motivo Transicion':'Estructura reasignada a '+nuevaGerencia
      },session);
    });
  } else {
    Object.keys(gerencias).forEach(function(gid){
      var desactivaGerente=targets.some(function(u){return u.gerenciaId===gid&&u.rol==='GERENTE';});
      var desactivaCoord=targets.some(function(u){return u.gerenciaId===gid&&u.rol==='COORDINADOR';});
      var motivo=safeText_(data.motivo||'Vacante temporal mientras se designa responsable.');
      var patch={
        'Estado':'EN TRANSICIÓN',
        'Responsable Temporal':'DIRECCION_COMERCIAL',
        'Fecha Inicio Transicion':new Date(),
        'Motivo Transicion':motivo
      };
      if(desactivaGerente) patch['Gerente Usuario']='';
      if(desactivaCoord) patch['Coordinador Usuario']='';
      actualizarEstadoEstructura_(gid,patch,session);
    });
  }

  targets.forEach(function(target){
    var anterior=target.activo!==false?'ACTIVO':'INACTIVO';
    target.activo=false;
    target.versionSesion=Number(target.versionSesion||1)+1;
    target.modificadoPor=session.nombre;
    target.ultimaModificacion=new Date();
    registrarCambioEstructura_(session,target,'ESTADO',anterior,'INACTIVO');
    revocarDispositivosUsuario_(target.usuario);
  });

  saveUsers_(users);
  registrarAuditoria_('DESACTIVACION_ESTRUCTURA',session,
    ids.join(', ')+' | '+modo+' | '+safeText_(data.motivo||''));

  return {success:true,modo:modo,desactivados:ids.length};
}

function cerrarTransicionGAS(token, data) {
  var session=requireSession_(token);
  assertCanManageUsers_(session);
  data=data||{};

  var gid=safeText_(data.gerenciaId||'');
  if(!gid) throw new Error('Gerencia requerida.');

  var users=getUsers_();
  var gerenteId=safeText_(data.gerenteUsuario||'');
  var coordId=safeText_(data.coordinadorUsuario||'');

  if(gerenteId){
    var ger=users.filter(function(u){return u.usuario===gerenteId&&u.activo!==false;})[0];
    if(!ger||ger.rol!=='GERENTE') throw new Error('El gerente seleccionado no es válido.');
    ger.gerenciaId=gid;
    ger.coordinadorId='';
    ger.versionSesion=Number(ger.versionSesion||1)+1;
    ger.modificadoPor=session.nombre;
    ger.ultimaModificacion=new Date();
  }

  if(coordId){
    var coord=users.filter(function(u){return u.usuario===coordId&&u.activo!==false;})[0];
    if(!coord||coord.rol!=='COORDINADOR') throw new Error('El coordinador seleccionado no es válido.');
    coord.gerenciaId=gid;
    coord.coordinadorId='';
    coord.versionSesion=Number(coord.versionSesion||1)+1;
    coord.modificadoPor=session.nombre;
    coord.ultimaModificacion=new Date();
  }

  saveUsers_(users);
  actualizarEstadoEstructura_(gid,{
    'Estado':'ACTIVA',
    'Gerente Usuario':gerenteId,
    'Coordinador Usuario':coordId,
    'Responsable Temporal':'',
    'Fecha Inicio Transicion':'',
    'Motivo Transicion':''
  },session);

  registrarAuditoria_('CERRAR_TRANSICION',session,gid+' | Gerente '+gerenteId+' | Coord '+coordId);
  return {success:true};
}

function listarConfiguracionComercialGAS(token) {
  var session=requireSession_(token);
  var estructuras=leerEstructuras_();
  var catalogo=[];
  var sh=ensureCatalogoProductos_();
  if(sh.getLastRow()>=2){
    var vals=sh.getDataRange().getValues();
    var map=headerMap_(sh);
    catalogo=vals.slice(1).filter(function(r){
      return String(valueByHeader_(r,map,['Activo'])||'SI').toUpperCase()!=='NO';
    }).map(function(r){
      return {
        codigo:String(valueByHeader_(r,map,['Codigo'])||''),
        modulo:String(valueByHeader_(r,map,['Modulo'])||''),
        proceso:String(valueByHeader_(r,map,['Proceso'])||''),
        unidad:String(valueByHeader_(r,map,['Unidad'])||'OPERACIONES'),
        orden:Number(valueByHeader_(r,map,['Orden'])||0)
      };
    }).sort(function(a,b){return a.orden-b.orden;});
  }
  return {success:true,estructuras:estructuras,catalogo:catalogo};
}

function generarCierreDiarioGAS(token, fecha) {
  var session=requireSession_(token);
  assertCanManageUsers_(session);
  fecha=String(fecha||fechaHoy_());

  var ars=leerARS_();
  var afi=leerAfiliacionesARS_();
  var afp=leerAFP_();
  var seg=leerSeguros_();

  function same(v){return dateToYmd_(v)===fecha;}
  function norm(v){return normalizeHeader_(v||'');}

  var t=ars.filter(function(r){return same(r.fecha);}).length;
  var an=afi.filter(function(r){return same(r.fechaCarga)&&r.tipoAfiliado==='Titular';}).length;
  var dep=afi.filter(function(r){return same(r.fechaCarga)&&r.tipoAfiliado==='Dependiente';}).length;
  var afpDia=afp.filter(function(r){return same(r.fecha);});
  var renta=afpDia.filter(function(r){return norm(r.tipo).indexOf('renta')>=0;}).length;
  var afpN=afpDia.length-renta;
  var segDia=seg.filter(function(r){return same(r.date);});
  var fianzas=segDia.filter(function(r){
    var p=norm(r.product);
    return p.indexOf('fianza')>=0||p.indexOf('garant')>=0;
  }).length;
  var seguros=segDia.length-fianzas;
  var pendientes=afi.filter(function(r){return same(r.fechaCarga)&&r.estado==='PE';}).length;

  var sh=ensureSheetHeaders_('CIERRE_DIARIO',getCierreDiarioHeaders_());
  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var row=-1;
  for(var i=1;i<data.length;i++){
    if(dateToYmd_(valueByHeader_(data[i],map,['Fecha']))===fecha){row=i+1;break;}
  }

  var values=[fecha,t,an,dep,afpN,renta,seguros,fianzas,t+an+dep+afpN+renta+seguros+fianzas,pendientes,session.nombre,new Date()];
  if(row>0) sh.getRange(row,1,1,values.length).setValues([values]);
  else sh.appendRow(values);

  registrarAuditoria_('CIERRE_DIARIO',session,fecha);
  return {success:true,fecha:fecha,total:values[8]};
}

/* ============================================================
   ARS - AFILIACIONES NUEVAS Y CARGA DE DEPENDIENTES
   ============================================================ */

function getAfiliacionesArsHeaders_() {
  return [
    'ID','Fecha de carga','Tipo de afiliado','Nombre','Cedula NUI','Telefono',
    'Nombre Titular','Cedula NUI Titular','Parentesco','Estado',
    'Vendedor Asignado ID','Vendedor Asignado','Codigo Vendedor','Rol Vendedor',
    'Gerencia','Coordinador','Supervisor',
    'Usuario Registro ID','Cargado Por','Rol Registro',
    'Observaciones','Fecha Hora Registro','Fecha Hora Modificacion','Modificado Por'
  ];
}

function getUsuarioActual_(session) {
  var users = getUsers_();
  return users.filter(function(u) {
    return u.usuario === session.usuario && u.activo !== false;
  })[0] || {
    usuario: session.usuario || '',
    nombre: session.nombre || '',
    rol: session.role || '',
    gerenciaId: session.gerenciaId || '',
    coordinadorId: session.coordinadorId || '',
    supervisorId: session.supervisorId || ''
  };
}

function normalizarIdentificadorAfiliacion_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .trim();
}

function afiliacionArsDuplicada_(tipo, cedulaNui, fechaCarga, excludeId) {
  var sh = ensureSheetHeaders_('AFILIACIONES_ARS', getAfiliacionesArsHeaders_());
  if (sh.getLastRow() < 2) return false;

  var data = sh.getDataRange().getValues();
  var map = headerMap_(sh);
  var tipoNorm = normalizeHeader_(tipo);
  var idNorm = normalizarIdentificadorAfiliacion_(cedulaNui);
  var fechaNorm = String(fechaCarga || '');

  for (var i = 1; i < data.length; i++) {
    var rowId = String(valueByHeader_(data[i], map, ['ID']) || '');
    if (excludeId && rowId === String(excludeId)) continue;

    var rowTipo = normalizeHeader_(valueByHeader_(data[i], map, ['Tipo de afiliado']));
    var rowCed = normalizarIdentificadorAfiliacion_(valueByHeader_(data[i], map, ['Cedula NUI','Cédula/NUI']));
    var rowFecha = dateToYmd_(valueByHeader_(data[i], map, ['Fecha de carga']));

    if (rowTipo === tipoNorm && rowCed === idNorm && rowFecha === fechaNorm) return true;
  }
  return false;
}


function getAfiliacionAsignablesForSession_(session){
  var users=getUsers_().filter(function(u){
    return u.activo!==false && ['GERENTE','COORDINADOR','GESTOR'].indexOf(u.rol)!==-1;
  });

  if(session.role==='DIRECTORA')return users;

  if(session.role==='GERENTE'){
    return users.filter(function(u){
      return u.usuario===session.usuario || u.gerenciaId===session.gerenciaId;
    });
  }

  if(session.role==='COORDINADOR'){
    var all=getUsers_().filter(function(u){return u.activo!==false;});
    var supervisorIds=all.filter(function(u){
      return u.rol==='SUPERVISOR' &&
             u.gerenciaId===session.gerenciaId &&
             u.coordinadorId===session.usuario;
    }).map(function(u){return u.usuario;});

    return users.filter(function(u){
      if(u.usuario===session.usuario)return true;
      return u.rol==='GESTOR' &&
             u.gerenciaId===session.gerenciaId &&
             (u.coordinadorId===session.usuario || supervisorIds.indexOf(u.supervisorId)!==-1);
    });
  }

  if(session.role==='SUPERVISOR'){
    return users.filter(function(u){
      return u.rol==='GESTOR' &&
             u.gerenciaId===session.gerenciaId &&
             u.supervisorId===session.usuario;
    });
  }

  if(session.role==='GESTOR'){
    return users.filter(function(u){return u.usuario===session.usuario;});
  }

  return [];
}

function resolverAsignacionAfiliacionARS_(session,requestedUserId){
  var allowed=getAfiliacionAsignablesForSession_(session);
  var requested=String(requestedUserId||'').trim();

  if(!requested){
    var self=allowed.filter(function(u){return u.usuario===session.usuario;})[0];
    if(self)return self;

    if(allowed.length===1)return allowed[0];

    throw new Error('Selecciona a quién se cargará la afiliación.');
  }

  var found=allowed.filter(function(u){return u.usuario===requested;})[0];
  if(!found){
    throw new Error('La persona seleccionada no pertenece a la estructura permitida para esta afiliación.');
  }
  return found;
}

function guardarAfiliacionNuevaARS(token, record) {
  return guardarMovimientoAfiliacionARS_(token, record, 'Titular');
}

function guardarCargaDependienteARS(token, record) {
  return guardarMovimientoAfiliacionARS_(token, record, 'Dependiente');
}

function guardarMovimientoAfiliacionARS_(token, record, tipoForzado) {
  var lock=null;

  try{
    var session=requireSession_(token);
    var currentUser=getUsuarioActual_(session);
    record=Object.assign({},record||{});

    var tipo=tipoForzado==='Dependiente'?'Dependiente':'Titular';
    var fechaCarga=String(record.fechaCarga||fechaHoy_());
    var nombre=safeText_(record.nombre||'').toUpperCase();
    var cedulaNui=normalizarIdentificadorAfiliacion_(record.cedulaNui||record.cedula||'');
    var estado=safeText_(record.estado||'PE');
    var observaciones=safeText_(record.observaciones||'');
    var telefono=validarTelefonoObligatorio_(record.telefono);

    if(!cedulaNui)throw new Error('La Cédula/NUI es obligatoria.');

    var estadosValidos=['PE','OK','Traspaso por Unificación'];
    if(estadosValidos.indexOf(estado)===-1)throw new Error('Estado no válido.');

    var nombreTitular='';
    var cedulaNuiTitular='';
    var parentesco='';

    if(tipo==='Dependiente'){
      nombreTitular=safeText_(record.nombreTitular||'').toUpperCase();
      cedulaNuiTitular=normalizarIdentificadorAfiliacion_(record.cedulaNuiTitular||'');
      parentesco=safeText_(record.parentesco||'');
      if(!cedulaNuiTitular){
        throw new Error('Para una carga de dependiente debes indicar la Cédula/NUI del titular.');
      }
    }

    var vendedor=resolverAsignacionAfiliacionARS_(session,record.vendedorAsignadoId);

    lock=LockService.getScriptLock();
    try{lock.waitLock(15000);}
    catch(e){throw new Error('BASE OCUPADA: otro usuario está guardando. Intenta nuevamente.');}

    if(afiliacionArsDuplicada_(tipo,cedulaNui,fechaCarga,record.id)){
      throw new Error('Ya existe un registro de '+tipo+' con esa Cédula/NUI en la misma fecha.');
    }

    var sh=ensureSheetHeaders_('AFILIACIONES_ARS',getAfiliacionesArsHeaders_());
    var id=record.id||('AFI-ARS-'+Date.now()+'-'+Math.floor(Math.random()*100000));
    var now=new Date();
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('ID',id);
    put('Fecha de carga',fechaCarga);
    put('Tipo de afiliado',tipo);
    put('Nombre',nombre);
    put('Cedula NUI',cedulaNui);
    put('Telefono',telefono);
    put('Nombre Titular',nombreTitular);
    put('Cedula NUI Titular',cedulaNuiTitular);
    put('Parentesco',parentesco);
    put('Estado',estado);

    // Atribución comercial: puede ser distinta de quien digitó.
    put('Vendedor Asignado ID',vendedor.usuario||'');
    put('Vendedor Asignado',vendedor.nombre||'');
    put('Codigo Vendedor',vendedor.codigoVendedor||'');
    put('Rol Vendedor',vendedor.rol||'');
    put('Gerencia',vendedor.gerenciaId||'');
    put('Coordinador',vendedor.coordinadorId||'');
    put('Supervisor',vendedor.supervisorId||'');

    // Trazabilidad operativa.
    put('Usuario Registro ID',currentUser.usuario||session.usuario||'');
    put('Cargado Por',currentUser.nombre||session.nombre||'');
    put('Rol Registro',currentUser.rol||session.role||'');

    put('Observaciones',observaciones);
    put('Fecha Hora Registro',now);
    put('Fecha Hora Modificacion',now);
    put('Modificado Por',currentUser.nombre||session.nombre||'');

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    registrarAuditoria_(
      tipo==='Titular'?'AFILIACIONES_NUEVAS_ARS':'CARGA_DEPENDIENTE_ARS',
      session,
      id+' | '+cedulaNui+' | '+estado+' | Producción: '+(vendedor.nombre||'')+' | Código: '+(vendedor.codigoVendedor||'')
    );

    return {
      success:true,
      id:id,
      vendedorAsignado:vendedor.nombre||'',
      codigoVendedor:vendedor.codigoVendedor||''
    };

  }catch(error){
    try{registrarErrorSistema_(typeof session!=='undefined'?session:null,'ARS_AFILIACIONES','guardarMovimientoAfiliacionARS_',error,tipoForzado||'');}catch(ignore){}
    return {success:false,error:error&&error.message?error.message:String(error)};
  }finally{
    if(lock){try{lock.releaseLock();}catch(e){}}
  }
}

function actualizarAfiliacionARS(token, record) {
  var lock=null;

  try{
    var session=requireSession_(token);
    var currentUser=getUsuarioActual_(session);
    record=Object.assign({},record||{});
    var id=String(record.id||'').trim();
    if(!id)throw new Error('Registro requerido.');

    lock=LockService.getScriptLock();
    try{lock.waitLock(15000);}
    catch(e){throw new Error('BASE OCUPADA: otro usuario está guardando. Intenta nuevamente.');}

    var sh=ensureSheetHeaders_('AFILIACIONES_ARS',getAfiliacionesArsHeaders_());
    var data=sh.getDataRange().getValues();
    var map=headerMap_(sh);
    var rowIndex=-1;

    for(var i=1;i<data.length;i++){
      if(String(valueByHeader_(data[i],map,['ID'])||'')===id){
        rowIndex=i+1;break;
      }
    }
    if(rowIndex<0)throw new Error('Registro no encontrado.');

    var current=leerFilaAfiliacionARS_(sh.getRange(rowIndex,1,1,sh.getLastColumn()).getValues()[0],map);
    if(!puedeEditarAfiliacionARS_(session,current)){
      throw new Error('No tienes permiso para modificar este registro.');
    }

    var estado=safeText_(record.estado||current.estado||'PE');
    if(['PE','OK','Traspaso por Unificación'].indexOf(estado)===-1){
      throw new Error('Estado no válido.');
    }

    var vendedorId=record.vendedorAsignadoId!==undefined
      ? String(record.vendedorAsignadoId||'')
      : String(current.vendedorAsignadoId||'');

    var vendedor;
    if(vendedorId){
      vendedor=resolverAsignacionAfiliacionARS_(session,vendedorId);
    }else{
      // Compatibilidad con registros históricos sin vendedor asignado.
      vendedor={
        usuario:current.usuarioRegistroId||'',
        nombre:current.cargadoPor||'',
        codigoVendedor:current.codigoVendedor||'',
        rol:current.rolRegistro||'',
        gerenciaId:current.gerenciaId||'',
        coordinadorId:current.coordinadorId||'',
        supervisorId:current.supervisorId||''
      };
    }

    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('ID',current.id);
    put('Fecha de carga',record.fechaCarga||current.fechaCarga);
    put('Tipo de afiliado',current.tipoAfiliado);
    put('Nombre',safeText_(record.nombre!==undefined?record.nombre:current.nombre).toUpperCase());
    put('Cedula NUI',normalizarIdentificadorAfiliacion_(record.cedulaNui!==undefined?record.cedulaNui:current.cedulaNui));
    put('Telefono',validarTelefonoObligatorio_(record.telefono!==undefined?record.telefono:current.telefono));
    put('Nombre Titular',safeText_(record.nombreTitular!==undefined?record.nombreTitular:current.nombreTitular).toUpperCase());
    put('Cedula NUI Titular',normalizarIdentificadorAfiliacion_(record.cedulaNuiTitular!==undefined?record.cedulaNuiTitular:current.cedulaNuiTitular));
    put('Parentesco',safeText_(record.parentesco!==undefined?record.parentesco:current.parentesco));
    put('Estado',estado);

    put('Vendedor Asignado ID',vendedor.usuario||'');
    put('Vendedor Asignado',vendedor.nombre||'');
    put('Codigo Vendedor',vendedor.codigoVendedor||'');
    put('Rol Vendedor',vendedor.rol||'');
    put('Gerencia',vendedor.gerenciaId||'');
    put('Coordinador',vendedor.coordinadorId||'');
    put('Supervisor',vendedor.supervisorId||'');

    put('Usuario Registro ID',current.usuarioRegistroId);
    put('Cargado Por',current.cargadoPor);
    put('Rol Registro',current.rolRegistro);

    put('Observaciones',safeText_(record.observaciones!==undefined?record.observaciones:current.observaciones));
    put('Fecha Hora Registro',current.fechaHoraRegistro||'');
    put('Fecha Hora Modificacion',new Date());
    put('Modificado Por',currentUser.nombre||session.nombre||'');

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(rowIndex,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    registrarAuditoria_(
      'ACTUALIZAR_AFILIACION_ARS',
      session,
      id+' -> '+estado+' | Producción: '+(vendedor.nombre||'')+' | Código: '+(vendedor.codigoVendedor||'')
    );
    return {success:true};

  }catch(error){
    return {success:false,error:error&&error.message?error.message:String(error)};
  }finally{
    if(lock){try{lock.releaseLock();}catch(e){}}
  }
}

function leerFilaAfiliacionARS_(r,map) {
  return {
    id:String(valueByHeader_(r,map,['ID'])||''),
    fechaCarga:dateToYmd_(valueByHeader_(r,map,['Fecha de carga'])),
    tipoAfiliado:String(valueByHeader_(r,map,['Tipo de afiliado'])||''),
    nombre:String(valueByHeader_(r,map,['Nombre'])||''),
    cedulaNui:String(valueByHeader_(r,map,['Cedula NUI','Cédula/NUI'])||''),
    telefono:String(valueByHeader_(r,map,['Telefono','Teléfono'])||''),
    nombreTitular:String(valueByHeader_(r,map,['Nombre Titular'])||''),
    cedulaNuiTitular:String(valueByHeader_(r,map,['Cedula NUI Titular'])||''),
    parentesco:String(valueByHeader_(r,map,['Parentesco'])||''),
    estado:String(valueByHeader_(r,map,['Estado'])||'PE'),

    vendedorAsignadoId:String(valueByHeader_(r,map,['Vendedor Asignado ID'])||''),
    vendedorAsignado:String(valueByHeader_(r,map,['Vendedor Asignado'])||''),
    codigoVendedor:String(valueByHeader_(r,map,['Codigo Vendedor','Código Vendedor'])||''),
    rolVendedor:String(valueByHeader_(r,map,['Rol Vendedor'])||''),

    usuarioRegistroId:String(valueByHeader_(r,map,['Usuario Registro ID'])||''),
    cargadoPor:String(valueByHeader_(r,map,['Cargado Por'])||''),
    rolRegistro:String(valueByHeader_(r,map,['Rol Registro'])||''),

    gerenciaId:String(valueByHeader_(r,map,['Gerencia'])||''),
    coordinadorId:String(valueByHeader_(r,map,['Coordinador'])||''),
    supervisorId:String(valueByHeader_(r,map,['Supervisor'])||''),

    observaciones:String(valueByHeader_(r,map,['Observaciones'])||''),
    fechaHoraRegistro:valueByHeader_(r,map,['Fecha Hora Registro'])||'',
    fechaHoraModificacion:valueByHeader_(r,map,['Fecha Hora Modificacion'])||'',
    modificadoPor:String(valueByHeader_(r,map,['Modificado Por'])||'')
  };
}

function leerAfiliacionesARS_() {
  // La hoja se crea automáticamente aunque todavía no tenga registros.
  // Así Diagnóstico no la marca como faltante en instalaciones nuevas.
  var sh=ensureSheetHeaders_('AFILIACIONES_ARS',getAfiliacionesArsHeaders_());

  if(sh.getLastRow()<2)return [];

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  data.shift();

  return data.filter(function(r){
    return r.some(function(v){return v!=='';});
  }).map(function(r){
    return leerFilaAfiliacionARS_(r,map);
  });
}

function filtrarAfiliacionesPorSesion_(session, records) {
  if(!Array.isArray(records))return [];
  if(session.role==='DIRECTORA')return records;

  if(session.role==='GERENTE'){
    return records.filter(function(r){
      return String(r.gerenciaId||'')===String(session.gerenciaId||'') ||
             String(r.vendedorAsignadoId||'')===String(session.usuario||'') ||
             String(r.usuarioRegistroId||'')===String(session.usuario||'');
    });
  }

  if(session.role==='COORDINADOR'||session.role==='SUPERVISOR'){
    var allowed=getAfiliacionAsignablesForSession_(session).map(function(u){return u.usuario;});
    return records.filter(function(r){
      var owner=String(r.vendedorAsignadoId||r.usuarioRegistroId||'');
      return allowed.indexOf(owner)!==-1 ||
             String(r.usuarioRegistroId||'')===String(session.usuario||'') ||
             (session.role==='SUPERVISOR'&&String(r.supervisorId||'')===String(session.usuario||'')) ||
             (session.role==='COORDINADOR'&&String(r.coordinadorId||'')===String(session.usuario||''));
    });
  }

  if(session.role==='GESTOR'){
    return records.filter(function(r){
      return String(r.vendedorAsignadoId||r.usuarioRegistroId||'')===String(session.usuario||'');
    });
  }

  return [];
}

function puedeEditarAfiliacionARS_(session, record) {
  if (session.role === 'DIRECTORA') return true;
  if (String(record.usuarioRegistroId||'') === String(session.usuario||'')) return true;

  if (session.role === 'GERENTE') {
    return String(record.gerenciaId||'') === String(session.gerenciaId||'');
  }
  if (session.role === 'COORDINADOR') {
    return filtrarAfiliacionesPorSesion_(session, [record]).length === 1;
  }
  if (session.role === 'SUPERVISOR') {
    return filtrarAfiliacionesPorSesion_(session, [record]).length === 1;
  }
  return false;
}


function getAfiliacionesExternasHeaders_(){
  return [
    'ID','Fecha de carga','Tipo de afiliado','Nombre','Cedula NUI','Telefono',
    'Estado','Origen Externo',
    'Usuario Registro ID','Cargado Por','Rol Registro',
    'Observaciones','Fecha Hora Registro','Fecha Hora Modificacion','Modificado Por'
  ];
}

function puedeVerAfiliacionesExternas_(session){
  if(!session)return false;
  return ['maite.veras','ariel.aguilera','jose.angel'].indexOf(String(session.usuario||''))!==-1;
}

function exigirAccesoAfiliacionesExternas_(session){
  if(!puedeVerAfiliacionesExternas_(session)){
    throw new Error('No tienes acceso a Afiliaciones Externas.');
  }
}

function afiliacionExternaDuplicada_(tipo,cedulaNui,fechaCarga,excludeId){
  var sh=ensureSheetHeaders_('AFILIACIONES_EXTERNAS',getAfiliacionesExternasHeaders_());
  if(sh.getLastRow()<2)return false;

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  var tipoNorm=normalizeHeader_(tipo);
  var idNorm=normalizarIdentificadorAfiliacion_(cedulaNui);
  var fechaNorm=String(fechaCarga||'');

  for(var i=1;i<data.length;i++){
    var rowId=String(valueByHeader_(data[i],map,['ID'])||'');
    if(excludeId&&rowId===String(excludeId))continue;

    var rowTipo=normalizeHeader_(valueByHeader_(data[i],map,['Tipo de afiliado']));
    var rowCed=normalizarIdentificadorAfiliacion_(valueByHeader_(data[i],map,['Cedula NUI','Cédula/NUI']));
    var rowFecha=dateToYmd_(valueByHeader_(data[i],map,['Fecha de carga']));

    if(rowTipo===tipoNorm&&rowCed===idNorm&&rowFecha===fechaNorm)return true;
  }
  return false;
}

function guardarAfiliacionExternaGAS(token,record){
  var lock=null;
  try{
    var session=requireSession_(token);
    exigirAccesoAfiliacionesExternas_(session);
    var currentUser=getUsuarioActual_(session);
    record=Object.assign({},record||{});

    var fechaCarga=String(record.fechaCarga||fechaHoy_());
    var nombre=safeText_(record.nombre||'').toUpperCase();
    var cedulaNui=normalizarIdentificadorAfiliacion_(record.cedulaNui||'');
    var telefono=validarTelefonoObligatorio_(record.telefono);
    var estado=safeText_(record.estado||'PE');
    var origenExterno=safeText_(record.origenExterno||'');
    var observaciones=safeText_(record.observaciones||'');

    if(!cedulaNui)throw new Error('La Cédula/NUI es obligatoria.');
    if(['PE','OK','Traspaso por Unificación'].indexOf(estado)===-1)throw new Error('Estado no válido.');

    lock=LockService.getScriptLock();
    try{lock.waitLock(15000);}
    catch(e){throw new Error('BASE OCUPADA: otro usuario está guardando. Intenta nuevamente.');}

    if(afiliacionExternaDuplicada_('Titular',cedulaNui,fechaCarga,record.id)){
      throw new Error('Ya existe una afiliación externa con la misma Cédula/NUI en la fecha indicada.');
    }

    var sh=ensureSheetHeaders_('AFILIACIONES_EXTERNAS',getAfiliacionesExternasHeaders_());
    var id='AFI-EXT-'+Date.now()+'-'+Math.floor(Math.random()*100000);
    var now=new Date();
    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('ID',id);
    put('Fecha de carga',fechaCarga);
    put('Tipo de afiliado','Titular');
    put('Nombre',nombre);
    put('Cedula NUI',cedulaNui);
    put('Telefono',telefono);
    put('Estado',estado);
    put('Origen Externo',origenExterno);
    put('Usuario Registro ID',currentUser.usuario||session.usuario||'');
    put('Cargado Por',currentUser.nombre||session.nombre||'');
    put('Rol Registro',currentUser.rol||session.role||'');
    put('Observaciones',observaciones);
    put('Fecha Hora Registro',now);
    put('Fecha Hora Modificacion',now);
    put('Modificado Por',currentUser.nombre||session.nombre||'');

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    registrarAuditoria_('AFILIACION_EXTERNA',session,id+' | '+cedulaNui+' | '+estado);
    return {success:true,id:id};

  }catch(error){
    try{registrarErrorSistema_(typeof session!=='undefined'?session:null,'AFILIACIONES_EXTERNAS','guardarAfiliacionExternaGAS',error,'');}catch(ignore){}
    return {success:false,error:error&&error.message?error.message:String(error)};
  }finally{
    if(lock){try{lock.releaseLock();}catch(e){}}
  }
}

function leerFilaAfiliacionExterna_(r,map){
  return {
    id:String(valueByHeader_(r,map,['ID'])||''),
    fechaCarga:dateToYmd_(valueByHeader_(r,map,['Fecha de carga'])),
    tipoAfiliado:'Titular',
    nombre:String(valueByHeader_(r,map,['Nombre'])||''),
    cedulaNui:String(valueByHeader_(r,map,['Cedula NUI','Cédula/NUI'])||''),
    telefono:String(valueByHeader_(r,map,['Telefono','Teléfono'])||''),
    estado:String(valueByHeader_(r,map,['Estado'])||'PE'),
    origenExterno:String(valueByHeader_(r,map,['Origen Externo'])||''),
    usuarioRegistroId:String(valueByHeader_(r,map,['Usuario Registro ID'])||''),
    cargadoPor:String(valueByHeader_(r,map,['Cargado Por'])||''),
    rolRegistro:String(valueByHeader_(r,map,['Rol Registro'])||''),
    observaciones:String(valueByHeader_(r,map,['Observaciones'])||''),
    fechaHoraRegistro:valueByHeader_(r,map,['Fecha Hora Registro'])||'',
    fechaHoraModificacion:valueByHeader_(r,map,['Fecha Hora Modificacion'])||'',
    modificadoPor:String(valueByHeader_(r,map,['Modificado Por'])||'')
  };
}

function leerAfiliacionesExternas_(session){
  exigirAccesoAfiliacionesExternas_(session);
  var sh=ensureSheetHeaders_('AFILIACIONES_EXTERNAS',getAfiliacionesExternasHeaders_());
  if(sh.getLastRow()<2)return [];

  var data=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  data.shift();

  return data.filter(function(r){
    return r.some(function(v){return v!=='';});
  }).map(function(r){
    return leerFilaAfiliacionExterna_(r,map);
  });
}

function actualizarAfiliacionExternaGAS(token,record){
  var lock=null;
  try{
    var session=requireSession_(token);
    exigirAccesoAfiliacionesExternas_(session);
    var currentUser=getUsuarioActual_(session);
    record=Object.assign({},record||{});
    var id=String(record.id||'').trim();
    if(!id)throw new Error('Registro requerido.');

    lock=LockService.getScriptLock();
    try{lock.waitLock(15000);}
    catch(e){throw new Error('BASE OCUPADA: otro usuario está guardando. Intenta nuevamente.');}

    var sh=ensureSheetHeaders_('AFILIACIONES_EXTERNAS',getAfiliacionesExternasHeaders_());
    var data=sh.getDataRange().getValues();
    var map=headerMap_(sh);
    var rowIndex=-1;

    for(var i=1;i<data.length;i++){
      if(String(valueByHeader_(data[i],map,['ID'])||'')===id){rowIndex=i+1;break;}
    }
    if(rowIndex<0)throw new Error('Registro no encontrado.');

    var current=leerFilaAfiliacionExterna_(sh.getRange(rowIndex,1,1,sh.getLastColumn()).getValues()[0],map);
    var estado=safeText_(record.estado||current.estado||'PE');
    if(['PE','OK','Traspaso por Unificación'].indexOf(estado)===-1)throw new Error('Estado no válido.');

    var obj={};
    function put(h,v){obj[normalizeHeader_(h)]=v;}

    put('ID',current.id);
    put('Fecha de carga',record.fechaCarga||current.fechaCarga);
    put('Tipo de afiliado','Titular');
    put('Nombre',safeText_(record.nombre!==undefined?record.nombre:current.nombre).toUpperCase());
    put('Cedula NUI',normalizarIdentificadorAfiliacion_(record.cedulaNui!==undefined?record.cedulaNui:current.cedulaNui));
    put('Telefono',validarTelefonoObligatorio_(record.telefono!==undefined?record.telefono:current.telefono));
    put('Estado',estado);
    put('Origen Externo',safeText_(record.origenExterno!==undefined?record.origenExterno:current.origenExterno));
    put('Usuario Registro ID',current.usuarioRegistroId);
    put('Cargado Por',current.cargadoPor);
    put('Rol Registro',current.rolRegistro);
    put('Observaciones',safeText_(record.observaciones!==undefined?record.observaciones:current.observaciones));
    put('Fecha Hora Registro',current.fechaHoraRegistro||'');
    put('Fecha Hora Modificacion',new Date());
    put('Modificado Por',currentUser.nombre||session.nombre||'');

    var row=buildRowByHeaders_(sh,obj);
    sh.getRange(rowIndex,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();

    registrarAuditoria_('ACTUALIZAR_AFILIACION_EXTERNA',session,id+' -> '+estado);
    return {success:true};

  }catch(error){
    return {success:false,error:error&&error.message?error.message:String(error)};
  }finally{
    if(lock){try{lock.releaseLock();}catch(e){}}
  }
}

function listarAfiliacionesExternasGAS(token){
  var session=requireSession_(token);
  exigirAccesoAfiliacionesExternas_(session);
  return {
    success:true,
    registros:leerAfiliacionesExternas_(session)
  };
}


/* ============================================================
   CARGA DE DATOS (con manejo controlado de sesión vencida)
   ============================================================ */


function getStructureUsersForSession_(session) {
  var users = getUsers_().filter(function(u){ return u.activo !== false; });

  function pub(u) {
    return {
      id:u.usuario,
      nombre:u.nombre,
      codigoVendedor:u.codigoVendedor||'',
      role:u.rol,
      gerenciaId:u.gerenciaId||'',
      coordinadorId:u.coordinadorId||'',
      supervisorId:u.supervisorId||''
    };
  }

  if (session.role === 'DIRECTORA') return users.map(pub);

  if (session.role === 'GERENTE') {
    return users.filter(function(u){
      return u.gerenciaId === session.gerenciaId;
    }).map(pub);
  }

  if (session.role === 'COORDINADOR') {
    var supervisors = users.filter(function(u){
      return u.role === 'SUPERVISOR' &&
             u.gerenciaId === session.gerenciaId &&
             u.coordinadorId === session.usuario;
    }).map(function(u){ return u.usuario; });

    return users.filter(function(u){
      if (u.usuario === session.usuario) return true;
      if (u.role === 'GERENTE' && u.gerenciaId === session.gerenciaId) return true;
      if (u.role === 'SUPERVISOR' &&
          u.gerenciaId === session.gerenciaId &&
          u.coordinadorId === session.usuario) return true;
      if (u.role === 'GESTOR' &&
          u.gerenciaId === session.gerenciaId &&
          (u.coordinadorId === session.usuario ||
           supervisors.indexOf(u.supervisorId) !== -1)) return true;
      return false;
    }).map(pub);
  }

  if (session.role === 'SUPERVISOR') {
    return users.filter(function(u){
      if (u.usuario === session.usuario) return true;
      if (u.role === 'GERENTE' && u.gerenciaId === session.gerenciaId) return true;
      if (session.coordinadorId && u.usuario === session.coordinadorId) return true;
      return u.role === 'GESTOR' &&
             u.gerenciaId === session.gerenciaId &&
             u.supervisorId === session.usuario;
    }).map(pub);
  }

  return users.filter(function(u){
    return u.usuario === session.usuario ||
           (u.role === 'GERENTE' && u.gerenciaId === session.gerenciaId) ||
           (session.coordinadorId && u.usuario === session.coordinadorId) ||
           (session.supervisorId && u.usuario === session.supervisorId);
  }).map(pub);
}


function diagnosticarRendimientoBaseGAS(token){
  requireSession_(token);
  resetRuntimeCache_();

  var t0=Date.now();
  var users=getUsers_();
  var tUsers=Date.now();

  var ars=leerARS_();
  var tArs=Date.now();

  var afi=leerAfiliacionesARS_();
  var tAfi=Date.now();

  var afp=leerAFP_();
  var tAfp=Date.now();

  var seg=leerSeguros_();
  var tSeg=Date.now();

  return {
    success:true,
    usuarios:{filas:users.length,ms:tUsers-t0},
    ars:{filas:ars.length,ms:tArs-tUsers},
    afiliacionesArs:{filas:afi.length,ms:tAfi-tArs},
    afp:{filas:afp.length,ms:tAfp-tAfi},
    seguros:{filas:seg.length,ms:tSeg-tAfp},
    totalMs:tSeg-t0,
    estrategia:'Memoización por ejecución; sin caché persistente de producción.'
  };
}


function cargarDatosIniciales(token) {
  var t0=Date.now();

  try{
    var session=requireSession_(token);

    // FAST:
    // La Administración Central ya sincroniza Código Vendedor.
    // Antes esta rutina recorría USUARIOS_APS en CADA inicio.
    // Se elimina del arranque para no castigar la carga.
    // repararCodigosVendedorConocidos_();

    // Una sola lectura de usuarios por ejecución; los demás helpers reutilizan memoria.
    APS_RUNTIME_.users=null;
    getUsers_();

    session.gestores=getAllowedGestores_(session);

    var ss=getSpreadsheet_();
    var readErrors=[];
    var arsData=[],afiliacionesArsData=[],afiliacionesExternasData=[],afpData=[],segurosData=[];

    var tReads=Date.now();
    try{arsData=leerARS_();}catch(e){readErrors.push('PRODUCCION_ARS: '+(e.message||e));}
    try{afiliacionesArsData=leerAfiliacionesARS_();}catch(e){readErrors.push('AFILIACIONES_ARS: '+(e.message||e));}
    if(puedeVerAfiliacionesExternas_(session)){
      try{afiliacionesExternasData=leerAfiliacionesExternas_(session);}catch(e){readErrors.push('AFILIACIONES_EXTERNAS: '+(e.message||e));}
    }
    try{afpData=leerAFP_();}catch(e){readErrors.push('PRODUCCION_AFP: '+(e.message||e));}
    try{segurosData=leerSeguros_();}catch(e){readErrors.push('PRODUCCION_SEGUROS: '+(e.message||e));}
    var readMs=Date.now()-tReads;

    var vendedoresAsignables=getAssignableSellersForSession_(session).map(function(u){
      return {
        usuario:u.usuario,
        nombre:u.nombre,
        cedula:u.cedula||'',
        codigoVendedor:u.codigoVendedor||'',
        gerenciaId:u.gerenciaId||'',
        coordinadorId:u.coordinadorId||'',
        supervisorId:u.supervisorId||''
      };
    });

    var response={
      success:true,
      user:session,
      readErrors:readErrors,
      database:{
        id:ss.getId(),
        name:ss.getName(),
        arsRows:ss.getSheetByName('PRODUCCION_ARS')?Math.max(0,ss.getSheetByName('PRODUCCION_ARS').getLastRow()-1):-1
      },
      vendedoresAsignables:vendedoresAsignables,
      afiliacionAsignables:getAfiliacionAsignablesForSession_(session).map(function(u){
        return {
          usuario:u.usuario,
          nombre:u.nombre,
          codigoVendedor:u.codigoVendedor||'',
          role:u.rol,
          gerenciaId:u.gerenciaId||'',
          coordinadorId:u.coordinadorId||'',
          supervisorId:u.supervisorId||''
        };
      }),
      puedeVerAfiliacionesExternas:puedeVerAfiliacionesExternas_(session),
      metasReportes:leerMetasReportes_(session),
      favoritosReportes:listarFavoritosReportes_(session),
      structureUsers:typeof getStructureUsersForSession_==='function'?getStructureUsersForSession_(session):[],
      arsGestores:getAllowedArsGestores_(session).map(function(u){
        return {
          usuario:u.usuario,
          nombre:u.nombre,
          cedula:u.cedula||'',
          gerenciaId:u.gerenciaId||'',
          coordinadorId:u.coordinadorId||'',
          supervisorId:u.supervisorId||''
        };
      }),
      ars:filtrarPorSesion_(session,arsData,'ARS'),
      afiliacionesArs:filtrarAfiliacionesPorSesion_(session,afiliacionesArsData),
      afiliacionesExternas:puedeVerAfiliacionesExternas_(session)?afiliacionesExternasData:[],
      afp:filtrarPorSesion_(session,afpData,'AFP'),
      seguros:filtrarPorSesion_(session,segurosData,'SEGURO')
    };

    response.performance={
      totalMs:Date.now()-t0,
      sheetReadsMs:readMs,
      usersMemoized:true,
      persistentProductionCache:false
    };

    return response;

  }catch(e){
    try{registrarErrorSistema_(null,'INICIO','cargarDatosIniciales',e,'');}catch(ignore){}
    return {
      success:false,
      error:e&&e.message?e.message:String(e),
      sessionExpired:/sesión|sesion|desactivado|permisos/i.test(String(e&&e.message||e)),
      databaseError:true,
      performance:{totalMs:Date.now()-t0}
    };
  }
}

function filtrarPorSesion_(session, records, tipo) {
  if (!Array.isArray(records)) return [];
  if (session.role === 'DIRECTORA') return records;

  if (tipo === 'ARS') {
    if (session.role === 'GESTOR') {
      return records.filter(function(r) {
        return sameName_(r.gestorName || '', session.nombre || '') ||
               String(r.usuarioRegistroId || '') === String(session.usuario || '');
      });
    }

    if (session.role === 'GERENTE') {
      return records.filter(function(r) {
        return String(r.gerenciaId || '') === String(session.gerenciaId || '') ||
               String(r.usuarioRegistroId || '') === String(session.usuario || '');
      });
    }

    if (session.role === 'COORDINADOR' || session.role === 'SUPERVISOR') {
      var permitidos = getAllowedArsGestores_(session).map(function(u){ return u.nombre; });
      return records.filter(function(r) {
        return String(r.coordinadorId || '') === String(session.usuario || '') ||
               String(r.supervisorId || '') === String(session.usuario || '') ||
               permitidos.some(function(n){ return sameName_(n, r.gestorName || ''); }) ||
               String(r.usuarioRegistroId || '') === String(session.usuario || '');
      });
    }

    return [];
  }

  if (session.role === 'GESTOR') {
    return records.filter(function(r) {
      return sameName_(getOwnerName_(r, tipo), session.nombre);
    });
  }

  if (['GERENTE', 'COORDINADOR', 'SUPERVISOR'].indexOf(session.role) !== -1) {
    var managers = getAllowedGestores_(session);
    return records.filter(function(r) {
      return managers.some(function(name) {
        return sameName_(name, getOwnerName_(r, tipo));
      });
    });
  }

  return [];
}

function getOwnerName_(record, tipo) {
  if (tipo === 'ARS') return String(record.gestorName || '');
  if (tipo === 'AFP') return String(record.gestor || '');
  return String(record.seller || '');
}

function sameName_(a, b) { return normalizeHeader_(a) === normalizeHeader_(b); }



function getAssignableSellersForSession_(session) {
  var users=getUsers_().filter(function(u){
    return u.activo!==false && u.rol==='GESTOR';
  });

  if(session.role==='DIRECTORA'){
    return users;
  }

  if(session.role==='GERENTE'){
    return users.filter(function(u){
      return u.gerenciaId===session.gerenciaId;
    });
  }

  if(session.role==='COORDINADOR'){
    var all=getUsers_().filter(function(u){return u.activo!==false;});
    var supervisorIds=all.filter(function(u){
      return u.rol==='SUPERVISOR' &&
             u.gerenciaId===session.gerenciaId &&
             u.coordinadorId===session.usuario;
    }).map(function(u){return u.usuario;});

    return users.filter(function(u){
      return u.gerenciaId===session.gerenciaId &&
             (
               u.coordinadorId===session.usuario ||
               supervisorIds.indexOf(u.supervisorId)!==-1
             );
    });
  }

  return [];
}


function resolverVendedorAsignado_(session, requestedName) {
  var ownName=String(session.nombre||'').trim();
  var requested=String(requestedName||'').trim();

  if(['DIRECTORA','GERENTE','COORDINADOR'].indexOf(session.role)===-1){
    return ownName;
  }

  if(!requested || sameName_(requested,ownName)){
    return ownName;
  }

  var allowed=getAssignableSellersForSession_(session);
  var found=allowed.filter(function(u){
    return sameName_(u.nombre,requested);
  })[0];

  if(!found){
    throw new Error('El vendedor seleccionado no pertenece a tu estructura o no está activo.');
  }

  return found.nombre;
}

function protegerRegistro_(session, source, tipo) {
  var record = Object.assign({}, source || {});

  if (tipo === 'ARS') return record;

  var requestedOwner = tipo === 'SEGURO' ? record.seller : record.gestor;
  var owner = resolverVendedorAsignado_(session, requestedOwner);

  if (tipo === 'SEGURO') record.seller = owner;
  else record.gestor = owner;

  return record;
}

function leerARS_() {
  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('PRODUCCION_ARS');
  if(!sh||sh.getLastRow()<2) return [];

  ensureSheetHeaders_('PRODUCCION_ARS',getArsHeaders_());

  var values=sh.getDataRange().getValues();
  var map=headerMap_(sh), depsById=leerDependientesARS_();
  values.shift();

  return values.filter(function(r){
    return r.some(function(v){return v!=='';});
  }).map(function(r){
    var id=String(valueByHeader_(r,map,['ID'])||'');
    var detalle=depsById[id]||[];
    var depNum=Number(valueByHeader_(r,map,['Cantidad Dep'])||detalle.length||0);

    var gestor=String(valueByHeader_(r,map,['Gestor Traspaso','Gestor'])||'');
    var gerencia=String(valueByHeader_(r,map,['Gerencia'])||'');
    var coordinador=String(valueByHeader_(r,map,['Coordinador'])||'');
    var supervisor=String(valueByHeader_(r,map,['Supervisor'])||'');

    if(gestor && (!gerencia || !coordinador || !supervisor)){
      var rr=resolverGestorARS_(gestor,'');
      if(rr.encontrado){
        if(!gerencia) gerencia=rr.gerenciaId||'';
        if(!coordinador) coordinador=rr.coordinadorId||'';
        if(!supervisor) supervisor=rr.supervisorId||'';
      }
    }

    var fechaHoraObj=valueByHeader_(r,map,[
      'Fecha Hora Objecion',
      'Fecha Hora Objeción',
      'Fecha Hora Obj',
      'Fecha Objecion',
      'Fecha Objeción'
    ]);

    return {
      id:id,
      fecha:dateToYmd_(valueByHeader_(r,map,['Fecha Registro','Fecha'])),
      fechaSuscripcion:String(valueByHeader_(r,map,['Fecha Suscripción','Fecha Suscripcion'])||''),
      horaSuscripcion:String(valueByHeader_(r,map,['Hora Suscripción','Hora Suscripcion'])||''),

      gestorName:gestor,
      cedulaGestor:String(valueByHeader_(r,map,['Cedula Gestor Traspaso','Cédula Gestor Traspaso'])||''),
      usuarioRegistro:String(valueByHeader_(r,map,['Usuario Registro'])||''),
      usuarioRegistroId:String(valueByHeader_(r,map,['Usuario Registro ID'])||''),
      rolUsuarioRegistro:String(valueByHeader_(r,map,['Rol Usuario Registro'])||''),
      gerenciaId:gerencia,
      coordinadorId:coordinador,
      supervisorId:supervisor,

      titular:String(valueByHeader_(r,map,['Titular'])||''),
      nuct:String(valueByHeader_(r,map,['NUCT'])||''),
      cedula:String(valueByHeader_(r,map,['Cedula','Cédula'])||''),
      nss:String(valueByHeader_(r,map,['NSS'])||''),
      fechaNacimiento:String(valueByHeader_(r,map,['Fecha Nacimiento'])||''),
      telefono:String(valueByHeader_(r,map,['Telefono','Teléfono'])||''),
      email:String(valueByHeader_(r,map,['Email'])||''),
      dependientes:depNum,
      detalleDependientes:detalle,

      representanteNombre:String(valueByHeader_(r,map,['Representante ARS Destino'])||''),
      representanteCedula:String(valueByHeader_(r,map,['Cedula Representante','Cédula Representante'])||''),
      arsDestino:String(valueByHeader_(r,map,['ARS Destino'])||''),
      codigoSeguridad:String(valueByHeader_(r,map,['Codigo Seguridad','Código Seguridad'])||''),

      estado:String(valueByHeader_(r,map,['Estado'])||'En curso'),
      estadoValidacion:String(valueByHeader_(r,map,['Estado Validacion','Estado Validación'])||''),

      // CAMPOS DE OBJECIÓN: se leen desde la misma fila que ya está guardada en PRODUCCION_ARS.
      codigoObjecion:String(valueByHeader_(r,map,['Codigo Objecion','Código Objeción','Codigo Objecio'])||''),
      categoriaObjecion:String(valueByHeader_(r,map,['Categoria Objecion','Categoría Objeción','Categoria Objecio'])||''),
      causalObjecion:String(valueByHeader_(r,map,['Causal Objecion','Causal Objeción'])||''),
      objetadoPor:String(valueByHeader_(r,map,['Objetado Por'])||''),
      objecionRegistradaPor:String(valueByHeader_(r,map,[
        'Objecion Registrada Por',
        'Objeción Registrada Por',
        'Objecion Registrada Por Usuario'
      ])||''),
      fechaHoraObjecion:(function(v){
        if(v instanceof Date && !isNaN(v)){
          return Utilities.formatDate(v,APS_CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss');
        }
        return String(v||'');
      })(fechaHoraObj),

      origenExtraccion:String(valueByHeader_(r,map,['Origen Extraccion','Origen Extracción'])||''),
      observaciones:String(valueByHeader_(r,map,['Observaciones'])||''),
      fileUrl:String(valueByHeader_(r,map,['Archivo URL'])||''),
      textoExtraido:String(valueByHeader_(r,map,['Texto Extraido','Texto Extraído'])||'')
    };
  });
}

function leerAFP_() {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName('PRODUCCION_AFP');
  if (!sh || sh.getLastRow() < 2) return [];

  ensureSheetHeaders_('PRODUCCION_AFP', getAfpHeaders_());

  var values = sh.getDataRange().getValues();
  var map = headerMap_(sh);
  values.shift();

  return values.filter(function(r) {
    return r.some(function(v) { return v !== ''; });
  }).map(function(r) {
    var nombre = String(valueByHeader_(r,map,['Afiliado']) || '');
    return {
      id: String(valueByHeader_(r,map,['ID']) || ''),
      fecha: dateToYmd_(valueByHeader_(r,map,['Fecha'])),
      gestor: String(valueByHeader_(r,map,['Gestor']) || ''),
      nombre: nombre,
      afiliado: nombre,
      cedula: String(valueByHeader_(r,map,['Cedula','Cédula']) || ''),
      tipo: String(valueByHeader_(r,map,['Tipo']) || 'Traspaso'),
      estado: String(valueByHeader_(r,map,['Estado']) || 'Emitido'),
      fileUrl: String(valueByHeader_(r,map,['Archivo URL']) || ''),
      origen: String(valueByHeader_(r,map,['AFP Origen']) || ''),
      monto: Number(valueByHeader_(r,map,['Monto']) || 0),

      tipoRenta: String(valueByHeader_(r,map,['Tipo Renta']) || ''),
      cci: Number(valueByHeader_(r,map,['CCI']) || 0),
      fechaNacimiento: dateToYmd_(valueByHeader_(r,map,['Fecha Nacimiento'])),
      edad: Number(valueByHeader_(r,map,['Edad']) || 0),
      sexo: String(valueByHeader_(r,map,['Sexo']) || ''),
      cesante: String(valueByHeader_(r,map,['Cesante']) || ''),
      telefono: String(valueByHeader_(r,map,['Telefono','Teléfono']) || ''),
      observaciones: String(valueByHeader_(r,map,['Observaciones']) || '')
    };
  });
}

function leerSeguros_() {
  var ss=getSpreadsheet_();
  var sh=ss.getSheetByName('PRODUCCION_SEGUROS');
  if(!sh||sh.getLastRow()<2)return [];

  sh=ensureSheetHeaders_('PRODUCCION_SEGUROS',[
    'ID','Fecha','Cliente','Cédula/RNC','Telefono','Producto','Aseguradora',
    'Póliza','Prima','Cobrado','Pendiente','Estado','Gestor'
  ]);

  var values=sh.getDataRange().getValues();
  var map=headerMap_(sh);
  values.shift();

  return values.filter(function(r){
    return r.some(function(v){return v!=='';});
  }).map(function(r){
    return {
      id:String(valueByHeader_(r,map,['ID'])||''),
      date:dateToYmd_(valueByHeader_(r,map,['Fecha'])),
      client:String(valueByHeader_(r,map,['Cliente'])||''),
      identifier:String(valueByHeader_(r,map,['Cédula/RNC','Cedula/RNC'])||''),
      telefono:String(valueByHeader_(r,map,['Telefono','Teléfono'])||''),
      product:String(valueByHeader_(r,map,['Producto'])||''),
      insurer:String(valueByHeader_(r,map,['Aseguradora'])||''),
      policy:String(valueByHeader_(r,map,['Póliza','Poliza'])||''),
      amount:Number(valueByHeader_(r,map,['Prima'])||0),
      collected:Number(valueByHeader_(r,map,['Cobrado'])||0),
      pending:Number(valueByHeader_(r,map,['Pendiente'])||0),
      status:String(valueByHeader_(r,map,['Estado'])||'Pendiente'),
      seller:String(valueByHeader_(r,map,['Gestor'])||'')
    };
  });
}

/* ============================================================
   HELPERS
   ============================================================ */

function fechaHoy_() { return Utilities.formatDate(new Date(), APS_CONFIG.TIMEZONE, 'yyyy-MM-dd'); }

function dateToYmd_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, APS_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}


function normalizarTelefono_(value){
  var digits=String(value||'').replace(/\D/g,'');
  if(digits.length===11 && digits.charAt(0)==='1') digits=digits.slice(1);
  return digits;
}

function validarTelefonoObligatorio_(value){
  var digits=normalizarTelefono_(value);
  if(!/^\d{10,15}$/.test(digits)){
    throw new Error('El teléfono es obligatorio y debe contener entre 10 y 15 dígitos.');
  }
  return digits;
}


function normalizeUsername_(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ''); }

function normalizeRole_(value) {
  var role = String(value || '').trim().toUpperCase();
  if (role === String.fromCharCode(86,69,78,68,69,68,79,82)) role = 'GESTOR';
  var allowed = ['DIRECTORA', 'GERENTE', 'COORDINADOR', 'SUPERVISOR', 'GESTOR'];
  return allowed.indexOf(role) !== -1 ? role : 'GESTOR';
}

function normalizeCedula_(value) { return String(value || '').replace(/\D/g, ''); }

function isValidCedula_(value) {
  var cedula = normalizeCedula_(value);
  if (!/^\d{11}$/.test(cedula)) return false;
  var sum = 0;
  for (var i = 0; i < 10; i++) {
    var product = Number(cedula.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += product > 9 ? product - 9 : product;
  }
  return ((10 - (sum % 10)) % 10) === Number(cedula.charAt(10));
}

function hashClave_(clave, salt) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + '|' + String(clave),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest);
}

function normalizeHeader_(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml_(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeText_(value) {
  var text = String(value === null || value === undefined ? '' : value).trim();
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function sanitizeFileName_(value) {
  var name = String(value || 'archivo').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/\.{2,}/g, '.').trim();
  return name.slice(0, 120) || ('archivo_' + Date.now());
}

function registrarAuditoria_(accion, session, detalle) {
  try {
    var sh = getOrCreateSheet_('AUDITORIA_APS', ['Fecha Hora', 'Accion', 'Usuario', 'Nombre', 'Rol', 'Detalle']);
    sh.appendRow([new Date(), safeText_(accion), safeText_(session.usuario || ''), safeText_(session.nombre || ''), safeText_(session.role || ''), safeText_(detalle)]);
  } catch (error) {
    console.warn('Auditoría no guardada: ' + error.message);
  }
}

/** Ejecuta una vez desde el editor para crear/actualizar las hojas sin borrar datos existentes. */
function prepararBaseDeDatos_() {
  ensureSheetHeaders_('USUARIOS_APS', getUsuariosHeaders_());
  ensureSheetHeaders_('AFILIACIONES_EXTERNAS', getAfiliacionesExternasHeaders_());
  ensureSheetHeaders_('HISTORIAL_ESTRUCTURA', getHistorialEstructuraHeaders_());
  ensureSheetHeaders_('DISPOSITIVOS_APS', getDispositivosHeaders_());

  // Primero usuarios. Después estructura para evitar recursión.
  migrarUsuariosASheets_();

  ensureSheetHeaders_('ESTRUCTURA_APS', getEstructuraHeaders_());
  ensureCatalogoProductos_();
  ensureSheetHeaders_('METAS_COMERCIALES', getMetasHeaders_());
  ensureSheetHeaders_('REPORTES_GENERADOS', getReportesGeneradosHeaders_());
  ensureSheetHeaders_('REPORTES_FAVORITOS', getReportesFavoritosHeaders_());
  ensureSheetHeaders_('CIERRE_DIARIO', getCierreDiarioHeaders_());
  ensureSheetHeaders_('CORTES_COMERCIALES', getCortesComercialesHeaders_());
  ensureEstructuraBase_();

  ensureSheetHeaders_('PRODUCCION_ARS', getArsHeaders_());
  ensureSheetHeaders_('DEPENDIENTES_ARS', getDependientesArsHeaders_());
  ensureSheetHeaders_('AFILIACIONES_ARS', getAfiliacionesArsHeaders_());
  ensureSheetHeaders_('PRODUCCION_AFP', getAfpHeaders_());
  ensureSheetHeaders_('PRODUCCION_SEGUROS', ['ID','Fecha','Cliente','Cédula/RNC','Telefono','Producto','Aseguradora','Póliza','Prima','Cobrado','Pendiente','Estado','Gestor']);
  getOrCreateSheet_('AUDITORIA_APS', ['Fecha Hora','Accion','Usuario','Nombre','Rol','Detalle']);

  return 'Base lista. USUARIOS_APS es la fuente oficial de usuarios y estructura.';
}

/* ============================================================
   APS ADMIN CENTRAL · SINCRONIZACIÓN PRODUCTIVIDAD
   FASE B
   ============================================================ */

var APS_PRODUCTIVIDAD_SYNC_SECRET_PROPERTY_ = 'APS_PRODUCTIVIDAD_SYNC_SECRET';

function getProductividadSyncSecret_() {
  var secret = String(
    PropertiesService.getScriptProperties().getProperty(
      APS_PRODUCTIVIDAD_SYNC_SECRET_PROPERTY_
    ) || ''
  ).trim();

  if (secret.length < 32) {
    throw new Error(
      'Configura la propiedad APS_PRODUCTIVIDAD_SYNC_SECRET con un secreto de al menos 32 caracteres.'
    );
  }

  return secret;
}

function configurarProductividadSyncSecret(secret) {
  var value = String(secret || '').trim();
  if (value.length < 32) {
    throw new Error('El secreto debe tener al menos 32 caracteres.');
  }
  PropertiesService.getScriptProperties().setProperty(
    APS_PRODUCTIVIDAD_SYNC_SECRET_PROPERTY_,
    value
  );
  return {ok:true, configurado:true};
}

/**
 * Endpoint interno para que Negocios 2.5 sincronice un usuario
 * administrado desde APS AUTH CENTRAL.
 *
 * POST JSON:
 * {
 *   "action":"SYNC_USER",
 *   "secret":"...",
 *   "user":{...},
 *   "tempPassword":"opcional"
 * }
 */
function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents
      ? e.postData.contents
      : '{}';

    var p = JSON.parse(raw || '{}');

    if (String(p.secret || '') !== getProductividadSyncSecret_()) {
      return jsonOutputSync_({
        ok:false,
        message:'Sincronización no autorizada.'
      });
    }

    var action = String(p.action || '').toUpperCase();

    if (action === 'SYNC_USER') {
      return jsonOutputSync_(
        sincronizarUsuarioCentralProductividad_(
          p.user || {},
          String(p.tempPassword || '')
        )
      );
    }

    if (action === 'PING') {
      return jsonOutputSync_({
        ok:true,
        module:'PRODUCTIVIDAD',
        message:'Endpoint de sincronización disponible.'
      });
    }

    return jsonOutputSync_({
      ok:false,
      message:'Acción de sincronización no válida.'
    });

  } catch (err) {
    return jsonOutputSync_({
      ok:false,
      message:err && err.message
        ? err.message
        : String(err)
    });
  }
}


function jsonOutputSync_(obj) {
  return ContentService
    .createTextOutput(
      JSON.stringify(obj || {})
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * APS AUTH CENTRAL = maestro.
 * Productividad = copia operativa.
 *
 * Conserva credenciales locales existentes salvo que
 * tempPassword venga informado desde Administración Central.
 */
function sincronizarUsuarioCentralProductividad_(data, tempPassword) {
  data = data || {};

  var usuarioId = String(
    data.usuarioId ||
    data.usuario ||
    ''
  ).trim().toLowerCase();

  var cedula = normalizeCedula_(
    data.cedula || ''
  );

  var nombre = safeText_(
    data.nombre || ''
  ).toUpperCase();

  var rol = normalizeRole_(
    data.rol ||
    data.role ||
    'GESTOR'
  );

  var gerenciaId = safeText_(
    data.gerenciaId || ''
  );

  var coordinadorId = safeText_(
    data.coordinadorId || ''
  );

  var supervisorId = safeText_(
    data.supervisorId || ''
  );

  var codigoVendedor = safeText_(
    data.codigoVendedor || ''
  );

  var activo =
    data.activo !== false &&
    String(data.activo || 'SI').toUpperCase() !== 'NO';

  if (!usuarioId) {
    throw new Error(
      'El usuario central no tiene Usuario ID.'
    );
  }

  if (!nombre) {
    throw new Error(
      'El usuario central no tiene nombre.'
    );
  }

  if (
    rol !== 'DIRECTORA' &&
    ['GERENTE','COORDINADOR','SUPERVISOR','GESTOR']
      .indexOf(rol) === -1
  ) {
    throw new Error(
      'Rol central no compatible con Productividad: ' + rol
    );
  }

  var users = getUsers_();

  var target = users.filter(function(u) {
    return String(u.usuario || '').toLowerCase() === usuarioId;
  })[0];

  if (!target && cedula) {
    target = users.filter(function(u) {
      return normalizeCedula_(u.cedula || '') === cedula;
    })[0];
  }

  var nuevo = false;

  if (!target) {
    nuevo = true;

    var salt = Utilities.getUuid();

    target = {
      usuario: usuarioId,
      nombre: nombre,
      cedula: cedula,
      codigoVendedor: codigoVendedor,
      rol: rol,
      gerenciaId: gerenciaId,
      coordinadorId: coordinadorId,
      supervisorId: supervisorId,
      direccion: data.direccionId ||
                 data.direccion ||
                 'DIRECCION_COMERCIAL',
      gestores: [],
      activo: activo,
      tipoClave: 'CEDULA',
      salt: salt,
      claveHash: hashClave_(
        cedula || Utilities.getUuid(),
        salt
      ),
      versionSesion: 1,
      requiereCambioClave: false,
      fechaIngreso: data.fechaIngreso || new Date(),
      modificadoPor: 'APS AUTH CENTRAL',
      ultimaModificacion: new Date()
    };

    users.push(target);

  } else {
    target.nombre = nombre;
    if (cedula) target.cedula = cedula;
    target.codigoVendedor = codigoVendedor;
    target.rol = rol;
    target.gerenciaId = gerenciaId;
    target.coordinadorId = coordinadorId;
    target.supervisorId = supervisorId;
    target.direccion =
      data.direccionId ||
      data.direccion ||
      target.direccion ||
      'DIRECCION_COMERCIAL';

    if (target.activo !== activo) {
      target.versionSesion =
        Number(target.versionSesion || 1) + 1;
    }

    target.activo = activo;
    target.modificadoPor = 'APS AUTH CENTRAL';
    target.ultimaModificacion = new Date();
  }

  if (String(tempPassword || '').trim()) {
    var expira = new Date(
      Date.now() +
      24 * 60 * 60 * 1000
    );

    aplicarClaveTemporal_(
      target,
      String(tempPassword).trim(),
      expira,
      'APS AUTH CENTRAL'
    );
  }

  saveUsers_(users);

  // Refrescar caché/runtime local para que la modificación
  // sea visible inmediatamente.
  try {
    APS_RUNTIME_.users = null;
  } catch(e) {}

  if (!activo || String(tempPassword || '').trim()) {
    try {
      revocarDispositivosUsuario_(target.usuario);
    } catch(e) {}
  }

  try {
    registrarAuditoria_(
      nuevo ? 'SYNC_CENTRAL_CREAR_USUARIO'
            : 'SYNC_CENTRAL_ACTUALIZAR_USUARIO',
      {
        usuario:'aps.auth.central',
        nombre:'APS AUTH CENTRAL',
        role:'SISTEMA'
      },
      target.usuario +
      ' | ' +
      target.nombre +
      ' | ' +
      (activo ? 'ACTIVO' : 'INACTIVO')
    );
  } catch(e) {}

  return {
    ok:true,
    success:true,
    creado:nuevo,
    usuarioId:target.usuario,
    nombre:target.nombre,
    rol:target.rol,
    gerenciaId:target.gerenciaId || '',
    activo:target.activo !== false,
    tempPasswordAplicada:!!String(tempPassword || '').trim()
  };
}


/**
 * Diagnóstico manual desde el editor de Productividad.
 * No modifica datos.
 */
function diagnosticoSyncCentralProductividad() {
  return {
    ok:true,
    module:'PRODUCTIVIDAD',
    endpoint:ScriptApp.getService().getUrl(),
    usuarios:getUsers_().length,
    syncConfigurado:String(PropertiesService.getScriptProperties().getProperty(APS_PRODUCTIVIDAD_SYNC_SECRET_PROPERTY_) || '').trim().length >= 32
  };
}


/**
 * Diagnóstico integral de inicio.
 * Ejecutar manualmente desde Apps Script.
 */
function diagnosticoInicioProductividad() {
  var out = {
    success:false,
    spreadsheetId:'',
    spreadsheetName:'',
    authCentralUrl:APS_AUTH_CENTRAL_URL,
    usuarios:0,
    hojas:{},
    errores:[]
  };

  try {
    resetRuntimeCache_();

    var ss = getSpreadsheet_();
    out.spreadsheetId = ss.getId();
    out.spreadsheetName = ss.getName();

    [
      'USUARIOS_APS',
      'PRODUCCION_ARS',
      'AFILIACIONES_ARS',
      'PRODUCCION_AFP',
      'PRODUCCION_SEGUROS'
    ].forEach(function(nombre) {
      var sh = ss.getSheetByName(nombre);
      out.hojas[nombre] = sh
        ? Math.max(0, sh.getLastRow() - 1)
        : -1;
    });

    try {
      out.usuarios = getUsers_().length;
    } catch (e) {
      out.errores.push(
        'USUARIOS_APS: ' +
        (e && e.message ? e.message : String(e))
      );
    }

    out.success = out.errores.length === 0;
    return out;

  } catch (e) {
    out.errores.push(
      e && e.message ? e.message : String(e)
    );
    return out;
  }
}

