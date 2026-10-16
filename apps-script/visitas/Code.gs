/**
 * APS PRO · VISITAS A EMPRESAS V10
 * Backend seguro para Google Apps Script / Google Sheets
 *
 * Base actual:
 *   Spreadsheet: Visitas a empresas 2.5
 *   ID: 1zdDQ_SZDd6B4U7tdNefJ8f7X4aoeRwWmVqtVp6Q0JNs
 *
 * Evidencias / firmas:
 *   Folder ID: 1-CBDnJHjEK84XqM4vMiRPp0bdJMHOd6Q
 *
 * Principios:
 * - doGet SOLO sirve la interfaz. No existen endpoints GET/POST públicos de datos.
 * - Cédula + contraseña, hash + salt, cambio obligatorio de clave inicial.
 * - Seguridad y alcance jerárquico en backend.
 * - Responsable de la gestión != persona que digitó.
 * - Históricos se conservan; nuevas columnas se agregan al final.
 * - Evidencias privadas en Drive.
 * - Caché versionada y paginación.
 */

const APSV = Object.freeze({
  VERSION: 'APS-VISITAS-V15.3-SYNC-SECRET-PROPERTY-2026.10.16',
  SPREADSHEET_ID: '1zdDQ_SZDd6B4U7tdNefJ8f7X4aoeRwWmVqtVp6Q0JNs',
  DRIVE_FOLDER_ID: '1-CBDnJHjEK84XqM4vMiRPp0bdJMHOd6Q',
  TIME_ZONE: 'America/Santo_Domingo',
  DIRECTION_ID: 'DIRECCION_COMERCIAL',
  SESSION_TTL: 21600,
  PAGE_SIZE: 20,
  CACHE_TTL: 180,
  SHEETS: {
    VISITAS: 'BD_VISITAS',
    CITAS: 'BD_CITAS',
    PREVISITAS: 'BD_PREVISITAS',
    EMPRESAS: 'EMPRESAS_APS',
    USUARIOS: 'USUARIOS_APS',
    SEGUIMIENTOS: 'SEGUIMIENTOS_APS',
    AUDITORIA: 'Auditoria',
    ERRORES: 'LogsErrores'
  }
});


/* ============================================================
   NEGOCIOS 2.5 · AUTH CENTRAL / ADMIN CENTRAL
   ============================================================ */
const APS_AUTH_CENTRAL_URL = 'https://script.google.com/macros/s/AKfycbxV3ms4ylr5vPd-UCR22hJ0ZhKxtjOE4tdcOcELdoIK9O33PxbSxkX6oCMSh_EkTUNEGw/exec';
const APS_VISITAS_SYNC_SECRET_PROPERTY = 'APS_VISITAS_SYNC_SECRET';

function getVisitasSyncSecret_() {
  const secret = String(
    PropertiesService.getScriptProperties().getProperty(
      APS_VISITAS_SYNC_SECRET_PROPERTY
    ) || ''
  ).trim();

  if (secret.length < 32) {
    throw new Error(
      'Configura la propiedad APS_VISITAS_SYNC_SECRET con un secreto de al menos 32 caracteres.'
    );
  }

  return secret;
}

function configurarVisitasSyncSecret(secret) {
  const value = String(secret || '').trim();
  if (value.length < 32) {
    throw new Error('El secreto debe tener al menos 32 caracteres.');
  }
  PropertiesService.getScriptProperties().setProperty(
    APS_VISITAS_SYNC_SECRET_PROPERTY,
    value
  );
  return {ok:true, configurado:true};
}

const VISIT_HEADERS_BASE = [
  'ID_SISTEMA','FECHA_REGISTRO','NOMBRE_RAZON_SOCIAL','RNC','PROVINCIA_MUNICIPIO',
  'PERSONA_ATENDIO','TELEFONO','CORREO','FECHA_VISITA','GERENCIA_NOMBRE',
  'GESTOR_ID','REPRESENTANTE_ARS','TIPO_GESTION','FECHA_PROXIMO_SEGUIMIENTO',
  'CANT_EMPLEADOS','CANT_AFILIADOS','CARNETS_PENDIENTES','FECHA_ULTIMA_ENTREGA_CARNETS',
  'OPERATIVO_MEDICO','LEVANTAMIENTO_REALIZADO','DETALLE_LEVANTAMIENTO','DIRECCION_EMPRESA',
  'EMPRESA_FIDELIZADA','PRODUCTOS_SERVICIOS_OFERTADOS','PRODUCTOS_SERVICIOS_VENDIDOS',
  'COMENTARIO_GESTION','FIRMA','GERENCIA_ID'
];

const VISIT_HEADERS_EXTRA = [
  'EMPRESA_ID','RESPONSABLE_USUARIO_ID','RESPONSABLE_NOMBRE','RESPONSABLE_ROL',
  'GERENCIA_ID_SNAPSHOT','COORDINADOR_ID_SNAPSHOT','SUPERVISOR_ID_SNAPSHOT','DIRECCION_ID_SNAPSHOT',
  'REGISTRADO_POR_USUARIO_ID','REGISTRADO_POR_NOMBRE','REGISTRADO_POR_ROL',
  'FECHA_ACTUALIZACION','FIRMA_FILE_ID','ESTADO_SEGUIMIENTO','ULTIMA_MODIFICACION_POR',
  'ORIGEN_TIPO','ORIGEN_ID','RESULTADO_VISITA','PRIORIDAD','NIVEL_INTERES','DECISOR_PRESENTE','ESTADO_COMERCIAL',
  'SECTOR_EMPRESA','SECTOR_OTRO','LATITUD','LONGITUD','MAPS_URL'
];

const PREVISIT_HEADERS_BASE = [
  'id','fecha','empresa','rnc','sector','contacto','telefono','turnos',
  'empleados','afinidad','competidor','gerencia','gestor','dolor','comentarios','gerenciaId'
];

const PREVISIT_HEADERS_EXTRA = [
  'empresaId','responsableUsuarioId','responsableNombre','responsableRol',
  'coordinadorId','supervisorId','direccionId','registradoPorUsuarioId','registradoPorNombre',
  'fechaActualizacion','direccion','sectorOtro','latitud','longitud','mapsUrl'
];

const APPT_HEADERS_BASE = [
  'id','empresa','fecha','hora','contacto','telefono','direccion','notas','gerenciaId','gerencia','gestor'
];

const APPT_HEADERS_EXTRA = [
  'empresaId','responsableUsuarioId','responsableNombre','responsableRol',
  'coordinadorId','supervisorId','direccionId','registradoPorUsuarioId','registradoPorNombre',
  'estado','fechaActualizacion','latitud','longitud','mapsUrl'
];

const COMPANY_HEADERS = [
  'EMPRESA_ID','RNC','RAZON_SOCIAL','NOMBRE_COMERCIAL','DIRECCION','PROVINCIA_MUNICIPIO',
  'CONTACTO_PRINCIPAL','TELEFONO','CORREO','CANT_EMPLEADOS','CANT_AFILIADOS',
  'CARNETS_PENDIENTES','GERENCIA_ID','RESPONSABLE_USUARIO_ID','ULTIMA_VISITA',
  'PROXIMO_SEGUIMIENTO','ESTADO','FECHA_CREACION','FECHA_ACTUALIZACION',
  'SECTOR','LATITUD','LONGITUD','MAPS_URL'
];

const USER_HEADERS = [
  'Usuario','Nombre','Cedula','Codigo Vendedor','Rol','Gerencia','Coordinador','Supervisor','Direccion',
  'Activo','Tipo Clave','Salt','Clave Hash','Version Sesion','Requiere Cambio Clave',
  'Ultimo Acceso','Fecha Ingreso','Modificado Por','Ultima Modificacion'
];

const FOLLOWUP_HEADERS = [
  'ID','EMPRESA_ID','EMPRESA','FECHA','TIPO','ESTADO','RESPONSABLE_USUARIO_ID','RESPONSABLE_NOMBRE',
  'GERENCIA_ID','COORDINADOR_ID','SUPERVISOR_ID','DIRECCION_ID','REFERENCIA_ID','NOTA',
  'REGISTRADO_POR','FECHA_CREACION','FECHA_ACTUALIZACION'
];

const AUDIT_HEADERS = ['FECHA','USUARIO','MODULO','ACCION','ENTIDAD','ID_REGISTRO','ESTADO','DETALLE'];
const ERROR_HEADERS = ['FECHA','MODULO','MENSAJE','STACK'];

const INITIAL_USERS = [
  {usuario:'maite.veras',nombre:'MAITE VERAS',cedula:'00116321597',rol:'DIRECTORA',gerencia:'',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'ariel.aguilera',nombre:'ARIEL AGUILERA ROSADO',cedula:'00118554757',rol:'GERENTE',gerencia:'G_ARIEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2312'},
  {usuario:'jose.angel',nombre:'JOSE ANGEL GONZALEZ FLORES',cedula:'00118335355',rol:'GERENTE',gerencia:'G_ANGEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'rafelina.pichardo',nombre:'RAFELINA DAYANARA PICHARDO FELIZ',cedula:'22900209440',rol:'COORDINADOR',gerencia:'G_ANGEL',coordinador:'rafelina.pichardo',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'belkis.andujar',nombre:'BELKIS ELISA ANDUJAR RODRIGUEZ',cedula:'02301576803',rol:'GERENTE',gerencia:'G_BELKIS',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'dairy.rodriguez',nombre:'DAIRY ESTEFANY RODRIGUEZ RODRIGUEZ',cedula:'40222803898',rol:'COORDINADOR',gerencia:'G_BELKIS',coordinador:'dairy.rodriguez',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},

  {usuario:'rafael.alcantara',nombre:'RAFAEL ALCANTARA FERMIN',cedula:'22300180571',rol:'GESTOR',gerencia:'G_ARIEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2553'},
  {usuario:'adalgiza.arvelo',nombre:'ADALGIZA ARVELO CASANOVA',cedula:'40220769166',rol:'GESTOR',gerencia:'G_ARIEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2555'},
  {usuario:'gardenia.montero',nombre:'GARDENIA MONTERO',cedula:'00119084549',rol:'GESTOR',gerencia:'G_ARIEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'1631'},
  {usuario:'rosario.valerio',nombre:'ROSARIO VALERIO RODRIGUEZ',cedula:'22300151606',rol:'GESTOR',gerencia:'G_ARIEL',coordinador:'',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2558'},

  {usuario:'rosalina.sanchez',nombre:'ROSALINA MERCEDES SANCHEZ',cedula:'22301298182',rol:'GESTOR',gerencia:'G_ANGEL',coordinador:'rafelina.pichardo',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'gerald.carrasco',nombre:'GERALD EMMANUEL CARRASCO HERNANDEZ',cedula:'22900295787',rol:'GESTOR',gerencia:'G_ANGEL',coordinador:'rafelina.pichardo',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2554'},
  {usuario:'denni.ramirez',nombre:'DENNI ESTHER RAMIREZ DE GERMAN',cedula:'00500439559',rol:'GESTOR',gerencia:'G_ANGEL',coordinador:'rafelina.pichardo',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2560'},
  {usuario:'katiusca.familia',nombre:'KATIUSCA VICTORIA FAMILIA',cedula:'22301618132',rol:'GESTOR',gerencia:'G_ANGEL',coordinador:'rafelina.pichardo',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2557'},

  {usuario:'yordhira.castillo',nombre:'YORDHIRA VANESSA CASTILLO MARTINEZ',cedula:'02601380237',rol:'GESTOR',gerencia:'G_BELKIS',coordinador:'dairy.rodriguez',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:'2140'},
  {usuario:'ana.brito',nombre:'ANA BRITO',cedula:'00201152055',rol:'GESTOR',gerencia:'G_BELKIS',coordinador:'dairy.rodriguez',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''},
  {usuario:'ana.tubay',nombre:'ANA ERCILIA TUBAY LIRIANO',cedula:'40221357573',rol:'GESTOR',gerencia:'G_BELKIS',coordinador:'dairy.rodriguez',supervisor:'',direccion:'DIRECCION_COMERCIAL',codigo:''}
];

function doGet(e) {
  try {
    let html = HtmlService.createHtmlOutputFromFile('Index').getContent();

    // Negocios 2.5 entrega el token central por query.
    const centralToken = text_(
      e && e.parameter && e.parameter.aps_token
        ? e.parameter.aps_token
        : ''
    );

    if (centralToken) {
      try {
        const central = iniciarSesionCentralVisitasGAS(centralToken);

        if (central && central.ok && central.token) {
          const localToken = JSON.stringify(String(central.token));

          // El Index de Visitas YA sabe restaurar apsv_token.
          // No modificamos su lógica interna.
          const boot =
            '<script>' +
              'try{' +
                'sessionStorage.setItem("apsv_token",' + localToken + ');' +
              '}catch(e){}' +
            '</script>';

          if (html.indexOf('<head>') !== -1) {
            html = html.replace('<head>', '<head>' + boot);
          } else {
            html = boot + html;
          }
        } else {
          throw new Error(central && central.message ? central.message : 'No fue posible iniciar la sesión central en Visitas.');
        }
      } catch (ssoError) {
        // Un fallo central debe ser visible: mostrar el login local aquí
        // daba la impresión de que hacía falta una segunda contraseña.
        const message = String(ssoError && ssoError.message || ssoError)
          .replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        return HtmlService.createHtmlOutput(
          '<div style="font:16px Arial,sans-serif;max-width:560px;margin:12vh auto;padding:24px">' +
          '<h2>No se pudo abrir Visitas desde el Portal</h2><p>' + message + '</p></div>'
        ).setTitle('Visitas · Error de acceso').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
    }

    return HtmlService
      .createHtmlOutput(html)
      .setTitle('APS PRO · Visitas a Empresas')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (e) {
    return HtmlService
      .createHtmlOutput(
        '<div style="font-family:system-ui;padding:28px">' +
        '<h2>Error al abrir Visitas</h2><p>' +
        String(e && e.message ? e.message : e) +
        '</p></div>'
      )
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/* ======================== INSTALACIÓN ======================== */

function setupVisitasAPS() {
  const ss = ss_();
  ensureHeaders_(getSheet_(APSV.SHEETS.VISITAS), VISIT_HEADERS_BASE.concat(VISIT_HEADERS_EXTRA));
  ensureHeaders_(getSheet_(APSV.SHEETS.PREVISITAS), PREVISIT_HEADERS_BASE.concat(PREVISIT_HEADERS_EXTRA));
  ensureHeaders_(getSheet_(APSV.SHEETS.CITAS), APPT_HEADERS_BASE.concat(APPT_HEADERS_EXTRA));
  ensureHeaders_(getSheet_(APSV.SHEETS.EMPRESAS), COMPANY_HEADERS);
  ensureHeaders_(getSheet_(APSV.SHEETS.USUARIOS), USER_HEADERS);
  ensureCedulaTextFormat_();
  ensureHeaders_(getSheet_(APSV.SHEETS.SEGUIMIENTOS), FOLLOWUP_HEADERS);
  ensureHeaders_(getSheet_(APSV.SHEETS.AUDITORIA), AUDIT_HEADERS);
  ensureHeaders_(getSheet_(APSV.SHEETS.ERRORES), ERROR_HEADERS);
  seedUsers_();
  bumpDataVersion_();
  return {
    ok:true,
    version:APSV.VERSION,
    spreadsheetId:APSV.SPREADSHEET_ID,
    sheets:ss.getSheets().map(s=>s.getName()),
    users:getUsers_().length
  };
}

function diagnosticoVisitasAPS() {
  const ss = ss_();
  return {
    ok:true, version:APSV.VERSION, spreadsheetId:ss.getId(), spreadsheetName:ss.getName(),
    folderId:APSV.DRIVE_FOLDER_ID,
    sheets:ss.getSheets().map(s=>({name:s.getName(),rows:s.getLastRow(),cols:s.getLastColumn()})),
    dataVersion:getDataVersion_()
  };
}

/**
 * V11 - Repara usuarios existentes cuando Google Sheets quitó ceros iniciales
 * de las cédulas. Ejecutar una sola vez si el login muestra
 * "Usuario no encontrado o inactivo".
 */
function repararUsuariosVisitasV11() {
  const sh = getSheet_(APSV.SHEETS.USUARIOS);
  ensureHeaders_(sh, USER_HEADERS);
  ensureCedulaTextFormat_();

  const map = headerMap_(sh);

  INITIAL_USERS.forEach(seed => {
    let row = findRowBy_(sh, map, 'Usuario', seed.usuario);

    if (!row) {
      const blank = blankRow_(sh.getLastColumn());
      writeObjectRow_(blank, map, {
        Usuario: seed.usuario,
        Nombre: seed.nombre,
        Cedula: seed.cedula,
        'Codigo Vendedor': seed.codigo,
        Rol: seed.rol,
        Gerencia: seed.gerencia,
        Coordinador: seed.coordinador,
        Supervisor: seed.supervisor,
        Direccion: seed.direccion,
        Activo: 'SI',
        'Tipo Clave': 'CEDULA',
        'Version Sesion': 1,
        'Requiere Cambio Clave': 'SI',
        'Fecha Ingreso': new Date(),
        'Ultima Modificacion': new Date()
      });
      sh.appendRow(blank);
      row = sh.getLastRow();
    }

    // Fuerza la cédula como texto para preservar ceros iniciales.
    const cedulaIndex = map[normHeader_('Cedula')];
    if (cedulaIndex !== undefined) {
      sh.getRange(row, cedulaIndex + 1).setNumberFormat('@');
      sh.getRange(row, cedulaIndex + 1).setValue(String(seed.cedula));
    }

    setMapped_(sh, row, map, 'Nombre', seed.nombre);
    setMapped_(sh, row, map, 'Codigo Vendedor', seed.codigo);
    setMapped_(sh, row, map, 'Rol', seed.rol);
    setMapped_(sh, row, map, 'Gerencia', seed.gerencia);
    setMapped_(sh, row, map, 'Coordinador', seed.coordinador);
    setMapped_(sh, row, map, 'Supervisor', seed.supervisor);
    setMapped_(sh, row, map, 'Direccion', seed.direccion);
    setMapped_(sh, row, map, 'Activo', 'SI');

    // Solo reinicia a clave inicial si aún no existe una contraseña personal.
    const tipoClave = text_(getMapped_(sh, row, map, 'Tipo Clave'));
    const hash = text_(getMapped_(sh, row, map, 'Clave Hash'));
    if (!hash || norm_(tipoClave) === 'CEDULA') {
      setMapped_(sh, row, map, 'Tipo Clave', 'CEDULA');
      setMapped_(sh, row, map, 'Requiere Cambio Clave', 'SI');
    }

    setMapped_(sh, row, map, 'Ultima Modificacion', new Date());
  });

  getCache_().remove('APSV_USERS');
  bumpDataVersion_();

  const usuarios = getUsers_(true);
  const maite = usuarios.find(u => u.usuario === 'maite.veras');

  return {
    ok: true,
    version: APSV.VERSION,
    mensaje: 'Usuarios reparados y cédulas preservadas como texto.',
    maite: maite ? {
      usuario: maite.usuario,
      nombre: maite.nombre,
      cedula: maite.cedula,
      activo: maite.activo,
      rol: maite.rol,
      tipoClave: maite.tipoClave
    } : null,
    totalUsuarios: usuarios.length
  };
}

function ensureCedulaTextFormat_() {
  const sh = getSheet_(APSV.SHEETS.USUARIOS);
  const map = headerMap_(sh);
  const i = map[normHeader_('Cedula')];
  if (i === undefined) return;
  sh.getRange(1, i + 1, Math.max(sh.getMaxRows(), 50), 1).setNumberFormat('@');
}


/* ============================================================
   APS AUTH CENTRAL · SSO VISITAS
   ============================================================ */

function authCentralVisitas_(payload) {
  const authUrl = String(PropertiesService.getScriptProperties().getProperty('APS_AUTH_CENTRAL_URL') || APS_AUTH_CENTRAL_URL).trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/?#]+\/exec$/.test(authUrl))
    throw new Error('Configura APS_AUTH_CENTRAL_URL con la URL /exec vigente de APS AUTH CENTRAL.');
  const response = UrlFetchApp.fetch(authUrl, {
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify(payload || {}),
    muteHttpExceptions:true,
    followRedirects:true
  });

  const code = response.getResponseCode();
  const text = response.getContentText();
  let data;

  try {
    data = JSON.parse(text);
  } catch(e) {
    throw new Error(
      code === 404
        ? 'APS AUTH CENTRAL respondió HTTP 404. Actualiza APS_AUTH_CENTRAL_URL en Propiedades de secuencia de comandos de Visitas.'
        : 'APS AUTH CENTRAL devolvió una respuesta no válida. HTTP ' + code
    );
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      data && data.message
        ? data.message
        : 'Error HTTP ' + code + ' al validar APS AUTH CENTRAL.'
    );
  }

  return data;
}


function iniciarSesionCentralVisitasGAS(centralToken) {
  try {
    const validated = authCentralVisitas_({
      action:'validate',
      token:String(centralToken || ''),
      moduleId:'VISITAS'
    });

    if (!validated || !validated.ok || !validated.user) {
      throw new Error(
        validated && validated.message
          ? validated.message
          : 'No tiene acceso a Visitas.'
      );
    }

    const cu = validated.user || {};
    const userId = text_(cu.usuarioId || cu.usuario);

    if (!userId) {
      throw new Error('APS AUTH CENTRAL no devolvió el usuario.');
    }

    // Aseguramos que el perfil operativo de Visitas exista y esté actualizado.
    sincronizarUsuarioCentralVisitas_(cu, '', true);

    const user = getUsers_().find(
      u => text_(u.usuario) === userId && truthy_(u.activo)
    );

    if (!user) {
      throw new Error('El usuario no está habilitado en Visitas.');
    }

    const token =
      Utilities.getUuid() +
      Utilities.getUuid().replace(/-/g,'');

    const session = {
      token:token,
      usuario:user.usuario,
      cedula:user.cedula,
      nombre:user.nombre,
      rol:user.rol,
      gerenciaId:user.gerenciaId,
      coordinadorId:user.coordinadorId,
      supervisorId:user.supervisorId,
      direccionId:user.direccionId || APSV.DIRECTION_ID,
      versionSesion:Number(user.versionSesion || 1),
      requireChange:false,
      centralAuth:true,
      expiresAt:Date.now() + APSV.SESSION_TTL * 1000
    };

    saveSession_(session);

    try {
      audit_(
        user.usuario,
        'LOGIN',
        'SSO_CENTRAL',
        user.usuario,
        'OK',
        'Acceso desde Negocios 2.5'
      );
    } catch(e) {}

    return {
      ok:true,
      token:token,
      user:publicUser_(user),
      requireChange:false,
      version:APSV.VERSION
    };

  } catch(e) {
    return {
      ok:false,
      message:e && e.message ? e.message : String(e)
    };
  }
}


/* ============================================================
   ADMIN CENTRAL · SINCRONIZACIÓN DE PERSONAL
   ============================================================ */

function doPost(e) {
  try {
    const raw =
      e && e.postData && e.postData.contents
        ? e.postData.contents
        : '{}';

    const p = JSON.parse(raw || '{}');

    if (String(p.secret || '') !== getVisitasSyncSecret_()) {
      return jsonVisitas_({
        ok:false,
        message:'Sincronización no autorizada.'
      });
    }

    const action = norm_(p.action || '');

    if (action === 'PING') {
      return jsonVisitas_({
        ok:true,
        module:'VISITAS',
        version:APSV.VERSION,
        spreadsheetId:APSV.SPREADSHEET_ID
      });
    }

    if (action === 'SYNC_USER') {
      return jsonVisitas_(
        sincronizarUsuarioCentralVisitas_(
          p.user || {},
          String(p.tempPassword || '')
        )
      );
    }

    return jsonVisitas_({
      ok:false,
      message:'Acción no válida.'
    });

  } catch(e) {
    return jsonVisitas_({
      ok:false,
      message:e && e.message ? e.message : String(e)
    });
  }
}


function jsonVisitas_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj || {}))
    .setMimeType(ContentService.MimeType.JSON);
}


function sincronizarUsuarioCentralVisitas_(data, tempPassword, skipUnchanged) {
  data = data || {};

  const usuarioId = text_(data.usuarioId || data.usuario).toLowerCase();
  const nombre = text_(data.nombre).toUpperCase();
  const cedula = cedula11_(data.cedula || '');
  const rol = norm_(data.rol || data.role || 'GESTOR');
  const gerencia = text_(data.gerenciaId || '');
  const coordinador = text_(data.coordinadorId || '');
  const supervisor = text_(data.supervisorId || '');
  const direccion = text_(data.direccionId || data.direccion || APSV.DIRECTION_ID);
  let codigo = text_(data.codigoVendedor || '');

  if (!usuarioId) throw new Error('Usuario central sin Usuario ID.');
  if (!nombre) throw new Error('Usuario central sin nombre.');

  // Si llega el mapa de permisos, VISITAS decide también el estado local.
  let permitidoVisitas = true;
  if (
    data.permissions &&
    Object.prototype.hasOwnProperty.call(data.permissions, 'VISITAS')
  ) {
    permitidoVisitas = !!data.permissions.VISITAS;
  }

  const activoCentral =
    data.activo !== false &&
    norm_(data.estadoPersonal || 'ACTIVO') !== 'DESVINCULADO';

  const activoLocal = activoCentral && permitidoVisitas;

  const sh = getSheet_(APSV.SHEETS.USUARIOS);
  ensureHeaders_(sh, USER_HEADERS);

  const map = headerMap_(sh);
  let row = findRowBy_(sh, map, 'Usuario', usuarioId);

  if (!row && cedula) {
    row = findRowBy_(sh, map, 'Cedula', cedula);
  }

  const isNew = !row;
  let values = row
    ? sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0]
    : blankRow_(sh.getLastColumn());

  // SSO no debe actualizar la fila ni invalidar las sesiones locales cuando
  // el perfil central y el estado de acceso permanecen iguales.
  if (skipUnchanged && row && !String(tempPassword || '').trim()) {
    const fields = {
      'Usuario':usuarioId, 'Nombre':nombre, 'Cedula':cedula,
      'Rol':rol, 'Gerencia':gerencia, 'Coordinador':coordinador,
      'Supervisor':supervisor, 'Direccion':direccion,
      'Activo':activoLocal ? 'SI' : 'NO', 'Requiere Cambio Clave':'NO'
    };
    if (Object.prototype.hasOwnProperty.call(data, 'codigoVendedor'))
      fields['Codigo Vendedor'] = codigo;
    const same = Object.keys(fields).every(function(key){
      const i = map[normHeader_(key)];
      return i !== undefined && String(values[i] == null ? '' : values[i]).trim() === String(fields[key]).trim();
    });
    if (same) return {ok:true,unchanged:true};
  }
  if (row && !Object.prototype.hasOwnProperty.call(data, 'codigoVendedor')) {
    const ci = map[normHeader_('Codigo Vendedor')];
    if (ci !== undefined) codigo = text_(values[ci]);
  }
  ensureCedulaTextFormat_();

  // La versión sube en cada sincronización para invalidar sesiones locales antiguas.
  let oldVersion = 0;
  if (row) {
    const idx = map[normHeader_('Version Sesion')];
    oldVersion = idx === undefined ? 0 : Number(values[idx] || 1);
  }
  const newVersion = Math.max(1, oldVersion + 1);

  const obj = {
    'Usuario':usuarioId,
    'Nombre':nombre,
    'Cedula':cedula,
    'Codigo Vendedor':codigo,
    'Rol':rol,
    'Gerencia':gerencia,
    'Coordinador':coordinador,
    'Supervisor':supervisor,
    'Direccion':direccion,
    'Activo':activoLocal ? 'SI' : 'NO',
    'Version Sesion':newVersion,
    'Requiere Cambio Clave':'NO',
    'Modificado Por':'APS AUTH CENTRAL',
    'Ultima Modificacion':new Date()
  };

  if (isNew) {
    obj['Fecha Ingreso'] = data.fechaIngreso || new Date();
    obj['Tipo Clave'] = 'CEDULA';
  }

  if (String(tempPassword || '').trim()) {
    const salt = Utilities.getUuid().replace(/-/g,'');
    obj['Tipo Clave'] = 'PASSWORD';
    obj['Salt'] = salt;
    obj['Clave Hash'] = hashPassword_(String(tempPassword).trim(), salt);
    obj['Requiere Cambio Clave'] = 'SI';
  }

  writeObjectRow_(values, map, obj);

  if (row) {
    sh.getRange(row,1,1,values.length).setValues([values]);
  } else {
    sh.appendRow(values);
    row = sh.getLastRow();
  }

  // Mantener cédula como texto.
  const cedulaCol = map[normHeader_('Cedula')];
  if (cedulaCol !== undefined) {
    sh.getRange(row, cedulaCol + 1).setNumberFormat('@');
  }

  getCache_().remove('APSV_USERS');
  bumpDataVersion_();

  try {
    audit_(
      'aps.auth.central',
      'ADMIN',
      isNew ? 'CREAR_USUARIO_CENTRAL' : 'ACTUALIZAR_USUARIO_CENTRAL',
      usuarioId,
      'OK',
      activoLocal
        ? 'Perfil sincronizado'
        : 'Perfil sincronizado sin acceso a Visitas'
    );
  } catch(e) {}

  return {
    ok:true,
    usuarioId:usuarioId,
    nombre:nombre,
    creado:isNew,
    activo:activoLocal,
    permisoVisitas:permitidoVisitas,
    versionSesion:newVersion
  };
}


/**
 * Ejecutar manualmente para comprobar el endpoint y la base.
 */
function diagnosticoIntegracionNegociosVisitas() {
  return {
    ok:true,
    version:APSV.VERSION,
    spreadsheetId:ss_().getId(),
    usuarios:getUsers_(true).length,
    authCentral:APS_AUTH_CENTRAL_URL,
    syncConfigurado:String(PropertiesService.getScriptProperties().getProperty(APS_VISITAS_SYNC_SECRET_PROPERTY) || '').trim().length >= 32
  };
}

/* ======================== AUTENTICACIÓN ======================== */

function iniciarSesionVisitasGAS(cedula, clave) {
  try {
    cedula = digits_(cedula);
    clave = text_(clave);
    if (cedula.length !== 11) throw new Error('Digite una cédula válida de 11 dígitos.');
    if (!clave) throw new Error('Digite su contraseña.');

    const user = getUsers_().find(u=>cedula11_(u.cedula)===cedula && truthy_(u.activo));
    if (!user) throw new Error('Usuario no encontrado o inactivo.');

    let valid = false;
    if (norm_(user.tipoClave)==='CEDULA' || !user.claveHash) {
      valid = digits_(clave) === cedula;
    } else {
      valid = hashPassword_(clave, user.salt) === user.claveHash;
    }
    if (!valid) {
      audit_(user.usuario,'LOGIN','ACCESO',user.usuario,'RECHAZADO','Contraseña incorrecta');
      throw new Error('Cédula o contraseña incorrecta.');
    }

    const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g,'');
    const session = {
      token, usuario:user.usuario, cedula:user.cedula, nombre:user.nombre, rol:user.rol,
      gerenciaId:user.gerenciaId, coordinadorId:user.coordinadorId, supervisorId:user.supervisorId,
      direccionId:user.direccionId || APSV.DIRECTION_ID,
      versionSesion:Number(user.versionSesion||1),
      requireChange:truthy_(user.requiereCambioClave) || norm_(user.tipoClave)==='CEDULA',
      expiresAt:Date.now() + APSV.SESSION_TTL*1000
    };
    saveSession_(session);
    updateUserAccess_(user.usuario);
    audit_(user.usuario,'LOGIN','ACCESO',user.usuario,'OK','Acceso autorizado');

    return {ok:true,token,user:publicUser_(user),requireChange:session.requireChange,version:APSV.VERSION};
  } catch(e) {
    return {ok:false,message:e.message||String(e)};
  }
}

function cambiarClaveVisitasGAS(token, claveActual, claveNueva) {
  try {
    const session = requireSession_(token);
    if (!claveNueva || String(claveNueva).length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    const users = getUsers_(true);
    const u = users.find(x=>x.usuario===session.usuario);
    if (!u) throw new Error('Usuario no encontrado.');

    const actualOk = norm_(u.tipoClave)==='CEDULA'
      ? digits_(claveActual)===digits_(u.cedula)
      : hashPassword_(claveActual,u.salt)===u.claveHash;
    if (!actualOk) throw new Error('La contraseña actual no es correcta.');

    const salt = Utilities.getUuid().replace(/-/g,'');
    const sh = getSheet_(APSV.SHEETS.USUARIOS);
    const map = headerMap_(sh);
    const row = findUserRow_(sh,map,u.usuario);
    setMapped_(sh,row,map,'Salt',salt);
    setMapped_(sh,row,map,'Clave Hash',hashPassword_(claveNueva,salt));
    setMapped_(sh,row,map,'Tipo Clave','PASSWORD');
    setMapped_(sh,row,map,'Requiere Cambio Clave','NO');
    setMapped_(sh,row,map,'Version Sesion',Number(u.versionSesion||1)+1);
    setMapped_(sh,row,map,'Ultima Modificacion',new Date());
    getCache_().remove('APSV_USERS');
    removeSession_(token);
    audit_(u.usuario,'SEGURIDAD','CAMBIO_CLAVE',u.usuario,'OK','Contraseña actualizada');
    return {ok:true,message:'Contraseña actualizada. Inicie sesión nuevamente.'};
  } catch(e) { return {ok:false,message:e.message||String(e)}; }
}

function cerrarSesionVisitasGAS(token) {
  try { const s = getSession_(token); if (s) audit_(s.usuario,'LOGIN','SALIR',s.usuario,'OK','Sesión cerrada'); } catch(_){}
  removeSession_(token);
  return {ok:true};
}

function validarSesionVisitasGAS(token) {
  try {
    const s = requireSession_(token);
    return {ok:true,user:publicSession_(s),dataVersion:getDataVersion_(),version:APSV.VERSION};
  } catch(e) { return {ok:false,message:e.message||String(e)}; }
}

/* ======================== BOOT / DASHBOARD ======================== */


function isRealVisit_(v) {
  const t = norm_(v.TIPO_GESTION || v.tipoGestion || '');
  // Históricos sin tipo se consideran visitas; levantamientos, llamadas,
  // seguimientos y operativos NO cuentan como "Visitas realizadas".
  return !t || t === 'VISITA' || t === 'VISITA A EMPRESA';
}

function monthKeyFor_(value) {
  const d = dateKey_(value || new Date());
  return d ? d.slice(0,7) : Utilities.formatDate(new Date(), APSV.TIME_ZONE, 'yyyy-MM');
}

function obtenerInicioVisitasGAS(token) {
  try {
    const s = requireSession_(token);
    const data = readScopedData_(s);
    const now = new Date();
    const monthKey = Utilities.formatDate(now, APSV.TIME_ZONE, 'yyyy-MM');
    const todayKey = Utilities.formatDate(now, APSV.TIME_ZONE, 'yyyy-MM-dd');

    const monthAll = data.visitas.filter(v =>
      dateKey_(v.FECHA_VISITA || v.FECHA_REGISTRO).startsWith(monthKey)
    );
    const monthVisits = monthAll.filter(isRealVisit_);

    const monthPrevisits = data.previsitas.filter(p =>
      dateKey_(p.fecha || p.fechaActualizacion).startsWith(monthKey)
    );

    const activeAppointments = data.citas.filter(c =>
      !['CANCELADO','REALIZADO'].includes(norm_(c.estado))
    );

    const followups = buildFollowups_(data.visitas, data.citas, s);
    const pendingFollowups = followups.filter(x =>
      ['VENCIDO','HOY','PROXIMOS_7'].includes(x.estado)
    );

    const units = buildUnitDashboard_(monthVisits);
    const ranking = groupOwnersReport_(monthVisits).slice(0, 8);
    const structure = buildStructureDashboard_(data.visitas.filter(isRealVisit_), monthKey, s);
    const alerts = buildDashboardAlerts_(data, s).slice(0, 12);

    return {
      ok: true,
      user: publicSession_(s),
      period: monthKey,
      kpis: {
        levantamientosMes: monthPrevisits.length,
        citasPendientes: activeAppointments.length,
        citasHoy: activeAppointments.filter(c => dateKey_(c.fecha) === todayKey).length,
        visitasMes: monthVisits.length,
        empresasMes: unique_(monthVisits.map(companyKey_)).filter(Boolean).length,
        seguimientosPendientes: pendingFollowups.length,
        empresasFidelizadas: unique_(monthVisits.filter(v => truthy_(v.EMPRESA_FIDELIZADA)).map(companyKey_)).filter(Boolean).length
      },
      units: units,
      ranking: ranking,
      alerts: alerts,
      proximos: followups.slice(0, 8),
      structure: structure,
      reconciliation: {
        bitacoraVisible: data.visitas.filter(isRealVisit_).length,
        dashboardMes: monthVisits.length
      },
      assignable: getAssignableUsers_(s).map(publicUser_)
    };
  } catch(e) {
    return {ok:false,message:e.message||String(e)};
  }
}

function buildUnitDashboard_(rows) {
  const units = {
    ars:{id:'ARS',label:'ARS APS',companies:{},visits:0},
    retiro:{id:'RETIRO',label:'AFP APS + Renta Vitalicia',companies:{},visits:0},
    seguros:{id:'SEGUROS',label:'Seguros APS',companies:{},visits:0}
  };

  rows.forEach(v => {
    const txt = norm_([
      v.PRODUCTOS_SERVICIOS_OFERTADOS,
      v.PRODUCTOS_SERVICIOS_VENDIDOS
    ].join(' '));

    const ck = companyKey_(v);

    if (
      txt.includes('ARS APS') ||
      txt.includes('SALUD COLECTIVA') ||
      txt.includes('CARNETIZACION') ||
      txt.includes('CLUBES DE SALUD') ||
      txt.includes('JORNADAS')
    ) {
      units.ars.visits++;
      if (ck) units.ars.companies[ck] = 1;
    }

    if (txt.includes('AFP') || txt.includes('RENTA')) {
      units.retiro.visits++;
      if (ck) units.retiro.companies[ck] = 1;
    }

    if (txt.includes('SEGURO') || txt.includes('FIANZA')) {
      units.seguros.visits++;
      if (ck) units.seguros.companies[ck] = 1;
    }
  });

  return Object.values(units).map(x => ({
    id:x.id,
    label:x.label,
    companies:Object.keys(x.companies).length,
    visits:x.visits
  }));
}

function obtenerDesgloseInicioGAS(token, tipo) {
  try {
    const s = requireSession_(token);
    const data = readScopedData_(s);
    const monthKey = Utilities.formatDate(new Date(), APSV.TIME_ZONE, 'yyyy-MM');
    const t = norm_(tipo);

    if (t === 'VISITAS') {
      const rows = data.visitas
        .filter(isRealVisit_)
        .filter(v => dateKey_(v.FECHA_VISITA || v.FECHA_REGISTRO).startsWith(monthKey));

      const companies = {};
      rows.forEach(v => {
        const k = companyKey_(v);
        if (!k) return;
        const current = companies[k] || (companies[k] = {
          empresa:text_(v.NOMBRE_RAZON_SOCIAL),
          rnc:text_(v.RNC),
          visitas:0,
          responsables:{},
          ultima:'',
          direccion:text_(v.DIRECCION_EMPRESA),
          latitud:text_(v.LATITUD),
          longitud:text_(v.LONGITUD),
          mapsUrl:text_(v.MAPS_URL)
        });

        current.visitas++;
        const name = visitOwnerName_(v);
        if (name) current.responsables[name] = 1;

        const d = dateKey_(v.FECHA_VISITA || v.FECHA_REGISTRO);
        if (!current.ultima || d > current.ultima) {
          current.ultima = d;
          current.direccion = text_(v.DIRECCION_EMPRESA) || current.direccion;
          current.latitud = text_(v.LATITUD) || current.latitud;
          current.longitud = text_(v.LONGITUD) || current.longitud;
          current.mapsUrl = text_(v.MAPS_URL) || current.mapsUrl;
        }
      });

      return {
        ok:true,
        tipo:'VISITAS',
        periodo:monthKey,
        totalRegistros:rows.length,
        totalEmpresas:Object.keys(companies).length,
        rows:Object.values(companies)
          .map(x => Object.assign(x,{responsables:Object.keys(x.responsables).join(', ')}))
          .sort((a,b)=>String(b.ultima).localeCompare(String(a.ultima)))
      };
    }

    if (t === 'LEVANTAMIENTOS') {
      const rows = data.previsitas
        .filter(p => dateKey_(p.fecha || p.fechaActualizacion).startsWith(monthKey))
        .sort((a,b)=>timestamp_(b.fecha||b.fechaActualizacion)-timestamp_(a.fecha||a.fechaActualizacion));

      return {
        ok:true,
        tipo:'LEVANTAMIENTOS',
        periodo:monthKey,
        totalRegistros:rows.length,
        rows:rows.map(p=>({
          id:p.id,
          empresa:p.empresa,
          rnc:p.rnc,
          fecha:dateKey_(p.fecha||p.fechaActualizacion),
          sector:p.sector,
          contacto:p.contacto,
          responsable:p.responsableNombre||p.gestor,
          direccion:p.direccion,
          latitud:p.latitud,
          longitud:p.longitud,
          mapsUrl:p.mapsUrl
        }))
      };
    }

    if (t === 'CITAS') {
      const rows = data.citas
        .filter(c => !['CANCELADO','REALIZADO'].includes(norm_(c.estado)))
        .sort((a,b)=>String(dateKey_(a.fecha)+text_(a.hora)).localeCompare(String(dateKey_(b.fecha)+text_(b.hora))));
      return {
        ok:true,
        tipo:'CITAS',
        totalRegistros:rows.length,
        rows:rows.map(c=>({
          id:c.id,empresa:c.empresa,fecha:dateKey_(c.fecha),hora:c.hora,
          contacto:c.contacto,responsable:c.responsableNombre||c.gestor,
          direccion:c.direccion,latitud:c.latitud,longitud:c.longitud,mapsUrl:c.mapsUrl
        }))
      };
    }

    if (t === 'SEGUIMIENTOS') {
      const rows = buildFollowups_(data.visitas,data.citas,s)
        .filter(x=>['VENCIDO','HOY','PROXIMOS_7'].includes(x.estado));
      return {ok:true,tipo:'SEGUIMIENTOS',totalRegistros:rows.length,rows:rows};
    }

    throw new Error('Desglose no válido.');
  } catch(e) {
    return {ok:false,message:e.message||String(e)};
  }
}

function buscarLevantamientoMesGAS(token, payloadJson) {
  try {
    const s = requireSession_(token);
    const p = parse_(payloadJson,{});
    const data = readScopedData_(s);
    const monthKey = monthKeyFor_(p.fecha || new Date());
    const rnc = digits_(p.rnc);
    const empresa = norm_(p.empresa);

    if (!rnc && !empresa) return {ok:true,found:false};

    let rows = data.previsitas.filter(x => {
      const d = dateKey_(x.fecha || x.fechaActualizacion);
      if (!d.startsWith(monthKey)) return false;
      if (rnc && digits_(x.rnc) === rnc) return true;
      return !rnc && empresa && norm_(x.empresa) === empresa;
    });

    rows.sort((a,b)=>timestamp_(b.fecha||b.fechaActualizacion)-timestamp_(a.fecha||a.fechaActualizacion));
    if (!rows.length) return {ok:true,found:false,month:monthKey};

    const x = rows[0];
    const owner = resolveUserByAny_(x.responsableUsuarioId || x.responsableNombre || x.gestor);

    return {
      ok:true,
      found:true,
      count:rows.length,
      month:monthKey,
      sourceId:x.id,
      sourceDate:dateKey_(x.fecha||x.fechaActualizacion),
      data:{
        empresa:text_(x.empresa),
        rnc:text_(x.rnc),
        sector:text_(x.sector),
        sectorOtro:text_(x.sectorOtro),
        personaAtendio:text_(x.contacto),
        telefono:text_(x.telefono),
        empleados:num_(x.empleados),
        direccion:text_(x.direccion),
        latitud:text_(x.latitud),
        longitud:text_(x.longitud),
        mapsUrl:text_(x.mapsUrl),
        responsableId:owner ? owner.usuario : text_(x.responsableUsuarioId),
        comentario:text_(x.comentarios),
        origenTipo:'PREVISITA',
        origenId:text_(x.id)
      }
    };
  } catch(e) {
    return {ok:false,message:e.message||String(e)};
  }
}


function buildDashboardAlerts_(data, s) {
  const today = dateKey_(new Date());
  const alerts = [];

  data.citas.forEach(c => {
    const d = dateKey_(c.fecha);
    if (d && d < today && !['CANCELADO','REALIZADO'].includes(norm_(c.estado))) {
      alerts.push({
        type:'CITA_VENCIDA',level:'ALTA',title:'Cita vencida',
        empresa:text_(c.empresa),date:d,
        responsable:text_(c.responsableNombre||c.gestor)
      });
    }
  });

  data.visitas.forEach(v => {
    const d = dateKey_(v.FECHA_PROXIMO_SEGUIMIENTO);
    if (d && d < today && norm_(v.ESTADO_SEGUIMIENTO||'PENDIENTE') !== 'REALIZADO') {
      alerts.push({
        type:'SEGUIMIENTO_VENCIDO',level:'ALTA',title:'Seguimiento vencido',
        empresa:text_(v.NOMBRE_RAZON_SOCIAL),date:d,
        responsable:visitOwnerName_(v)
      });
    }
    if (!text_(v.PRODUCTOS_SERVICIOS_OFERTADOS) && !text_(v.PRODUCTOS_SERVICIOS_VENDIDOS)) {
      alerts.push({
        type:'SIN_PRODUCTO',level:'MEDIA',title:'Visita sin producto asociado',
        empresa:text_(v.NOMBRE_RAZON_SOCIAL),date:dateKey_(v.FECHA_VISITA||v.FECHA_REGISTRO),
        responsable:visitOwnerName_(v)
      });
    }
  });

  const rank = {ALTA:0,MEDIA:1,BAJA:2};
  alerts.sort((a,b)=>(rank[a.level]??9)-(rank[b.level]??9) || String(a.date).localeCompare(String(b.date)));
  return alerts;
}

function buildStructureDashboard_(rows, monthKey, s) {
  const users = getUsers_().filter(u=>truthy_(u.activo));
  const visibleUsers = getAssignableUsers_(s);
  const visibleIds = {};
  visibleUsers.forEach(u=>visibleIds[u.usuario]=1);

  const monthRows = rows.filter(v => dateKey_(v.FECHA_VISITA||v.FECHA_REGISTRO).startsWith(monthKey));

  function metricForUser(user) {
    const own = monthRows.filter(v=>visitOwnerId_(v)===user.usuario);
    return {
      visitas:own.length,
      empresas:unique_(own.map(companyKey_)).filter(Boolean).length,
      ultima:own.reduce((m,v)=>Math.max(m,timestamp_(v.FECHA_VISITA||v.FECHA_REGISTRO)),0)
    };
  }

  const gerencias = ['G_ARIEL','G_ANGEL','G_BELKIS'].map(gid=>{
    const gerente = users.find(u=>u.rol==='GERENTE' && u.gerenciaId===gid);
    const coordinadores = users.filter(u=>u.rol==='COORDINADOR' && u.gerenciaId===gid && visibleIds[u.usuario]);
    const gestores = users.filter(u=>u.rol==='GESTOR' && u.gerenciaId===gid && visibleIds[u.usuario]);
    const gr = monthRows.filter(v=>visitGerenciaId_(v)===gid);
    return {
      id:gid,
      name:gerente?gerente.nombre:gerenciaName_(gid),
      manager:gerente?publicUser_(gerente):null,
      coordinadores:coordinadores.map(u=>Object.assign(publicUser_(u),metricForUser(u))),
      gestores:gestores.map(u=>Object.assign(publicUser_(u),metricForUser(u))),
      visitas:gr.length,
      empresas:unique_(gr.map(companyKey_)).filter(Boolean).length,
      ultima:gr.reduce((m,v)=>Math.max(m,timestamp_(v.FECHA_VISITA||v.FECHA_REGISTRO)),0)
    };
  }).filter(g=>g.gestores.length || g.coordinadores.length || g.visitas || norm_(s.rol)==='DIRECTORA');

  return {
    direccion:{
      name:'MAITE VERAS',
      role:'DIRECTORA',
      visitas:monthRows.length,
      empresas:unique_(monthRows.map(companyKey_)).filter(Boolean).length
    },
    gerencias:gerencias
  };
}

/* ======================== BITÁCORA ======================== */

function diagnosticarResponsablesHistoricosV14(){
  const rows=readSheetObjects_(APSV.SHEETS.VISITAS),unresolved={};
  rows.forEach(v=>{
    if(resolvedVisitUser_(v)) return;
    const raw=text_(v.GESTOR_ID||v.RESPONSABLE_USUARIO_ID),name=text_(v.RESPONSABLE_NOMBRE||v.REPRESENTANTE_ARS);
    if(raw||name){const k=raw+'|'+name;if(!unresolved[k])unresolved[k]={gestorId:raw,representante:name,cantidad:0};unresolved[k].cantidad++;}
  });
  return {ok:true,total:Object.keys(unresolved).length,pendientes:Object.values(unresolved).sort((a,b)=>b.cantidad-a.cantidad)};
}

function obtenerBitacoraVisitasGAS(token, filtrosJson) {
  try {
    const s = requireSession_(token);
    const f = parse_(filtrosJson,{});
    const page = Math.max(1,Number(f.page||1));
    const pageSize = Math.min(50,Math.max(10,Number(f.pageSize||APSV.PAGE_SIZE)));
    const data = readScopedData_(s);
    let rows = data.visitas.slice();

    const q = norm_(f.q||'');
    if (q) rows = rows.filter(v=>norm_([
      v.NOMBRE_RAZON_SOCIAL,v.RNC,v.PERSONA_ATENDIO,v.REPRESENTANTE_ARS,
      v.COMENTARIO_GESTION,v.PRODUCTOS_SERVICIOS_VENDIDOS
    ].join(' ')).includes(q));

    if (f.desde) rows = rows.filter(v=>dateKey_(v.FECHA_VISITA||v.FECHA_REGISTRO)>=f.desde);
    if (f.hasta) rows = rows.filter(v=>dateKey_(v.FECHA_VISITA||v.FECHA_REGISTRO)<=f.hasta);
    if (f.soloVisitas) rows = rows.filter(isRealVisit_);
    if (f.tipoGestion) rows = rows.filter(v=>norm_(v.TIPO_GESTION)===norm_(f.tipoGestion));
    if (f.responsableId) rows = rows.filter(v=>visitOwnerId_(v)===f.responsableId);

    rows.sort((a,b)=>timestamp_(b.FECHA_VISITA||b.FECHA_REGISTRO)-timestamp_(a.FECHA_VISITA||a.FECHA_REGISTRO));
    const total = rows.length;
    const start = (page-1)*pageSize;
    const pageRows = rows.slice(start,start+pageSize).map(sanitizeVisit_);

    return {
      ok:true,rows:pageRows,total,page,pageSize,hasMore:start+pageSize<total,
      dataVersion:getDataVersion_(),
      assignable:getAssignableUsers_(s).map(publicUser_)
    };
  } catch(e) { return {ok:false,message:e.message||String(e)}; }
}

function guardarVisitaGAS(token, payloadJson) {
  try {
    const s = requireSession_(token);
    const p = parse_(payloadJson,{});
    const owner = resolveAssignable_(s,p.responsableId);
    const sh = getSheet_(APSV.SHEETS.VISITAS);
    const map = headerMap_(sh);

    const company = required_(p.empresa,'Empresa').toUpperCase();
    const rnc = digits_(p.rnc);
    const companyId = upsertCompany_(p,owner,s);
    const id = p.id || ('VIS-' + Date.now() + '-' + Math.floor(Math.random()*10000));
    const evidence = p.firmaBase64 ? savePrivateEvidence_(p.firmaBase64,id,p.fileName,p.fileMime) : {url:'',fileId:''};

    const row = blankRow_(sh.getLastColumn());
    const obj = {
      ID_SISTEMA:id,
      FECHA_REGISTRO:new Date(),
      NOMBRE_RAZON_SOCIAL:company,
      RNC:rnc,
      PROVINCIA_MUNICIPIO:text_(p.provincia),
      PERSONA_ATENDIO:text_(p.personaAtendio),
      TELEFONO:text_(p.telefono),
      CORREO:text_(p.correo),
      FECHA_VISITA:p.fechaVisita || new Date(),
      GERENCIA_NOMBRE:gerenciaName_(owner.gerenciaId),
      GESTOR_ID:owner.usuario,
      REPRESENTANTE_ARS:owner.nombre,
      TIPO_GESTION:text_(p.tipoGestion||'VISITA'),
      FECHA_PROXIMO_SEGUIMIENTO:text_(p.fechaSeguimiento),
      CANT_EMPLEADOS:num_(p.empleados),
      CANT_AFILIADOS:num_(p.afiliados),
      CARNETS_PENDIENTES:num_(p.carnetsPendientes),
      FECHA_ULTIMA_ENTREGA_CARNETS:text_(p.fechaUltimaEntrega),
      OPERATIVO_MEDICO:yesNo_(p.operativoMedico),
      LEVANTAMIENTO_REALIZADO:yesNo_(p.levantamiento),
      DETALLE_LEVANTAMIENTO:text_(p.detalleLevantamiento),
      DIRECCION_EMPRESA:text_(p.direccion),
      EMPRESA_FIDELIZADA:yesNo_(p.fidelizada),
      PRODUCTOS_SERVICIOS_OFERTADOS:products_(p.productosOfertados),
      PRODUCTOS_SERVICIOS_VENDIDOS:products_(p.productosVendidos),
      COMENTARIO_GESTION:text_(p.comentario),
      FIRMA:evidence.url,
      GERENCIA_ID:owner.gerenciaId,
      EMPRESA_ID:companyId,
      RESPONSABLE_USUARIO_ID:owner.usuario,
      RESPONSABLE_NOMBRE:owner.nombre,
      RESPONSABLE_ROL:owner.rol,
      GERENCIA_ID_SNAPSHOT:owner.gerenciaId,
      COORDINADOR_ID_SNAPSHOT:owner.coordinadorId,
      SUPERVISOR_ID_SNAPSHOT:owner.supervisorId,
      DIRECCION_ID_SNAPSHOT:owner.direccionId,
      REGISTRADO_POR_USUARIO_ID:s.usuario,
      REGISTRADO_POR_NOMBRE:s.nombre,
      REGISTRADO_POR_ROL:s.rol,
      FECHA_ACTUALIZACION:new Date(),
      FIRMA_FILE_ID:evidence.fileId,
      ESTADO_SEGUIMIENTO:p.fechaSeguimiento?'PENDIENTE':'',
      ULTIMA_MODIFICACION_POR:s.usuario,
      ORIGEN_TIPO:text_(p.origenTipo||'DIRECTA'),
      ORIGEN_ID:text_(p.origenId),
      RESULTADO_VISITA:text_(p.resultadoVisita),
      PRIORIDAD:text_(p.prioridad||'MEDIA'),
      NIVEL_INTERES:text_(p.nivelInteres),
      DECISOR_PRESENTE:yesNo_(p.decisorPresente),
      ESTADO_COMERCIAL:text_(p.estadoComercial||commercialState_(p)),
      SECTOR_EMPRESA:text_(p.sector),
      SECTOR_OTRO:text_(p.sectorOtro),
      LATITUD:text_(p.latitud),
      LONGITUD:text_(p.longitud),
      MAPS_URL:text_(p.mapsUrl||googleMapsUrl_(p.latitud,p.longitud,p.direccion))
    };
    writeObjectRow_(row,map,obj);
    sh.appendRow(row);

    if (p.fechaSeguimiento) createFollowup_(companyId,company,p.fechaSeguimiento,'SEGUIMIENTO','PENDIENTE',owner,id,text_(p.comentario),s);
    audit_(s.usuario,'VISITAS','CREAR_VISITA','VISITA',id,'OK',company+' · Responsable: '+owner.nombre);
    bumpDataVersion_();
    return {ok:true,id,companyId};
  } catch(e) { error_('GUARDAR_VISITA',e); return {ok:false,message:e.message||String(e)}; }
}

function actualizarVisitaGAS(token, payloadJson) {
  try {
    const s = requireSession_(token);
    const p = parse_(payloadJson,{});
    const id = required_(p.id,'ID');
    const sh = getSheet_(APSV.SHEETS.VISITAS);
    const map = headerMap_(sh);
    const row = findRowBy_(sh,map,'ID_SISTEMA',id);
    if (!row) throw new Error('Visita no encontrada.');

    const current = rowObject_(sh,map,row);
    if (!canSeeVisit_(s,current)) throw new Error('No tiene permiso para editar esta visita.');
    const owner = resolveAssignable_(s,p.responsableId || visitOwnerId_(current));

    const update = {
      NOMBRE_RAZON_SOCIAL:required_(p.empresa||current.NOMBRE_RAZON_SOCIAL,'Empresa').toUpperCase(),
      RNC:digits_(p.rnc||current.RNC),
      PROVINCIA_MUNICIPIO:text_(p.provincia??current.PROVINCIA_MUNICIPIO),
      PERSONA_ATENDIO:text_(p.personaAtendio??current.PERSONA_ATENDIO),
      TELEFONO:text_(p.telefono??current.TELEFONO),
      CORREO:text_(p.correo??current.CORREO),
      FECHA_VISITA:p.fechaVisita||current.FECHA_VISITA,
      GERENCIA_NOMBRE:gerenciaName_(owner.gerenciaId),
      GESTOR_ID:owner.usuario,
      REPRESENTANTE_ARS:owner.nombre,
      TIPO_GESTION:text_(p.tipoGestion||current.TIPO_GESTION),
      FECHA_PROXIMO_SEGUIMIENTO:text_(p.fechaSeguimiento??current.FECHA_PROXIMO_SEGUIMIENTO),
      CANT_EMPLEADOS:num_(p.empleados??current.CANT_EMPLEADOS),
      CANT_AFILIADOS:num_(p.afiliados??current.CANT_AFILIADOS),
      CARNETS_PENDIENTES:num_(p.carnetsPendientes??current.CARNETS_PENDIENTES),
      FECHA_ULTIMA_ENTREGA_CARNETS:text_(p.fechaUltimaEntrega??current.FECHA_ULTIMA_ENTREGA_CARNETS),
      OPERATIVO_MEDICO:yesNo_(p.operativoMedico??current.OPERATIVO_MEDICO),
      LEVANTAMIENTO_REALIZADO:yesNo_(p.levantamiento??current.LEVANTAMIENTO_REALIZADO),
      DETALLE_LEVANTAMIENTO:text_(p.detalleLevantamiento??current.DETALLE_LEVANTAMIENTO),
      DIRECCION_EMPRESA:text_(p.direccion??current.DIRECCION_EMPRESA),
      EMPRESA_FIDELIZADA:yesNo_(p.fidelizada??current.EMPRESA_FIDELIZADA),
      PRODUCTOS_SERVICIOS_OFERTADOS:products_(p.productosOfertados??current.PRODUCTOS_SERVICIOS_OFERTADOS),
      PRODUCTOS_SERVICIOS_VENDIDOS:products_(p.productosVendidos??current.PRODUCTOS_SERVICIOS_VENDIDOS),
      COMENTARIO_GESTION:text_(p.comentario??current.COMENTARIO_GESTION),
      GERENCIA_ID:owner.gerenciaId,
      RESPONSABLE_USUARIO_ID:owner.usuario,
      RESPONSABLE_NOMBRE:owner.nombre,
      RESPONSABLE_ROL:owner.rol,
      GERENCIA_ID_SNAPSHOT:owner.gerenciaId,
      COORDINADOR_ID_SNAPSHOT:owner.coordinadorId,
      SUPERVISOR_ID_SNAPSHOT:owner.supervisorId,
      DIRECCION_ID_SNAPSHOT:owner.direccionId,
      FECHA_ACTUALIZACION:new Date(),
      ULTIMA_MODIFICACION_POR:s.usuario,
      RESULTADO_VISITA:text_(p.resultadoVisita??current.RESULTADO_VISITA),
      PRIORIDAD:text_(p.prioridad??current.PRIORIDAD),
      NIVEL_INTERES:text_(p.nivelInteres??current.NIVEL_INTERES),
      DECISOR_PRESENTE:yesNo_(p.decisorPresente??current.DECISOR_PRESENTE),
      ESTADO_COMERCIAL:text_(p.estadoComercial??current.ESTADO_COMERCIAL),
      SECTOR_EMPRESA:text_(p.sector??current.SECTOR_EMPRESA),
      SECTOR_OTRO:text_(p.sectorOtro??current.SECTOR_OTRO),
      LATITUD:text_(p.latitud??current.LATITUD),
      LONGITUD:text_(p.longitud??current.LONGITUD),
      MAPS_URL:text_(p.mapsUrl??current.MAPS_URL)
    };
    Object.keys(update).forEach(k=>setMapped_(sh,row,map,k,update[k]));
    upsertCompany_(Object.assign({},p,{empresa:update.NOMBRE_RAZON_SOCIAL,rnc:update.RNC}),owner,s);
    audit_(s.usuario,'VISITAS','EDITAR_VISITA','VISITA',id,'OK','Responsable: '+owner.nombre);
    bumpDataVersion_();
    return {ok:true,id};
  } catch(e) { error_('ACTUALIZAR_VISITA',e); return {ok:false,message:e.message||String(e)}; }
}

/* ======================== PREVISITAS ======================== */

function guardarPrevisitaGAS(token,payloadJson) {
  try {
    const s=requireSession_(token), p=parse_(payloadJson,{});
    const owner=resolveAssignable_(s,p.responsableId);
    const sh=getSheet_(APSV.SHEETS.PREVISITAS), map=headerMap_(sh);
    const id=p.id||('PREP-'+Date.now()+'-'+Math.floor(Math.random()*10000));
    const companyId=upsertCompany_(p,owner,s);
    const row=blankRow_(sh.getLastColumn());
    writeObjectRow_(row,map,{
      id,fecha:p.fecha||new Date(),empresa:required_(p.empresa,'Empresa').toUpperCase(),rnc:digits_(p.rnc),
      sector:text_(p.sector),contacto:text_(p.contacto),telefono:text_(p.telefono),turnos:text_(p.turnos),
      empleados:num_(p.empleados),afinidad:text_(p.afinidad),competidor:text_(p.competidor),
      gerencia:gerenciaName_(owner.gerenciaId),gestor:owner.nombre,dolor:text_(p.dolor),
      comentarios:text_(p.comentarios),gerenciaId:owner.gerenciaId,
      empresaId:companyId,responsableUsuarioId:owner.usuario,responsableNombre:owner.nombre,responsableRol:owner.rol,
      coordinadorId:owner.coordinadorId,supervisorId:owner.supervisorId,direccionId:owner.direccionId,
      registradoPorUsuarioId:s.usuario,registradoPorNombre:s.nombre,fechaActualizacion:new Date(),
      direccion:text_(p.direccion),sectorOtro:text_(p.sectorOtro),
      latitud:text_(p.latitud),longitud:text_(p.longitud),
      mapsUrl:text_(p.mapsUrl||googleMapsUrl_(p.latitud,p.longitud,p.direccion))
    });
    sh.appendRow(row);
    audit_(s.usuario,'PREVISITAS','CREAR','PREVISITA',id,'OK',text_(p.empresa));
    bumpDataVersion_();
    return {ok:true,id};
  } catch(e){return {ok:false,message:e.message||String(e)};}
}

/* ======================== AGENDA / CITAS / SEGUIMIENTOS ======================== */

function obtenerAgendaVisitasGAS(token,filtrosJson) {
  try {
    const s=requireSession_(token), f=parse_(filtrosJson,{});
    const data=readScopedData_(s);
    let items=buildFollowups_(data.visitas,data.citas,s);
    if(f.desde)items=items.filter(x=>x.fecha>=f.desde);
    if(f.hasta)items=items.filter(x=>x.fecha<=f.hasta);
    return {ok:true,items:items.slice(0,200),assignable:getAssignableUsers_(s).map(publicUser_)};
  } catch(e){return {ok:false,message:e.message||String(e)};}
}

function guardarCitaGAS(token,payloadJson){
  try{
    const s=requireSession_(token),p=parse_(payloadJson,{});
    const owner=resolveAssignable_(s,p.responsableId);
    const sh=getSheet_(APSV.SHEETS.CITAS),map=headerMap_(sh);
    const id=p.id||('APPT-'+Date.now()+'-'+Math.floor(Math.random()*10000));
    const companyId=upsertCompany_(p,owner,s);
    const row=blankRow_(sh.getLastColumn());
    writeObjectRow_(row,map,{
      id,empresa:required_(p.empresa,'Empresa').toUpperCase(),fecha:required_(p.fecha,'Fecha'),hora:text_(p.hora),
      contacto:text_(p.contacto),telefono:text_(p.telefono),direccion:text_(p.direccion),notas:text_(p.notas),
      gerenciaId:owner.gerenciaId,gerencia:gerenciaName_(owner.gerenciaId),gestor:owner.nombre,
      empresaId:companyId,responsableUsuarioId:owner.usuario,responsableNombre:owner.nombre,responsableRol:owner.rol,
      coordinadorId:owner.coordinadorId,supervisorId:owner.supervisorId,direccionId:owner.direccionId,
      registradoPorUsuarioId:s.usuario,registradoPorNombre:s.nombre,estado:'PENDIENTE',fechaActualizacion:new Date(),
      latitud:text_(p.latitud),longitud:text_(p.longitud),
      mapsUrl:text_(p.mapsUrl||googleMapsUrl_(p.latitud,p.longitud,p.direccion))
    });
    sh.appendRow(row);
    audit_(s.usuario,'AGENDA','CREAR_CITA','CITA',id,'OK',text_(p.empresa));
    bumpDataVersion_();
    return {ok:true,id};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

function actualizarEstadoAgendaGAS(token,payloadJson){
  try{
    const s=requireSession_(token),p=parse_(payloadJson,{});
    const id=required_(p.id,'ID'), estado=norm_(p.estado);
    if(!['REALIZADO','REPROGRAMADO','CANCELADO','PENDIENTE'].includes(estado))throw new Error('Estado no válido.');
    const sh=getSheet_(APSV.SHEETS.CITAS),map=headerMap_(sh),row=findRowBy_(sh,map,'id',id);
    if(row){
      const obj=rowObject_(sh,map,row);
      const ownerId=text_(obj.responsableUsuarioId||obj.gestor);
      if(!canSeeOwner_(s,ownerId,obj.gerenciaId,obj.coordinadorId,obj.supervisorId))throw new Error('Sin permiso.');
      setMapped_(sh,row,map,'estado',estado); setMapped_(sh,row,map,'fechaActualizacion',new Date());
      bumpDataVersion_(); return {ok:true};
    }
    const fs=getSheet_(APSV.SHEETS.SEGUIMIENTOS),fm=headerMap_(fs),fr=findRowBy_(fs,fm,'ID',id);
    if(!fr)throw new Error('Registro de agenda no encontrado.');
    setMapped_(fs,fr,fm,'ESTADO',estado);setMapped_(fs,fr,fm,'FECHA_ACTUALIZACION',new Date());
    bumpDataVersion_();return {ok:true};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

/* ======================== EMPRESAS ======================== */

function obtenerEmpresasVisitasGAS(token,filtrosJson){
  try{
    const s=requireSession_(token),f=parse_(filtrosJson,{});
    const data=readScopedData_(s);
    const map={};
    data.visitas.forEach(v=>{
      const k=companyKey_(v); if(!k)return;
      const x=map[k]||(map[k]={empresa:v.NOMBRE_RAZON_SOCIAL||'',rnc:v.RNC||'',visitas:0,ultima:0,proximo:'',responsable:v.REPRESENTANTE_ARS||'',responsableId:visitOwnerId_(v),empleados:0,afiliados:0,carnets:0});
      x.visitas++; x.ultima=Math.max(x.ultima,timestamp_(v.FECHA_VISITA||v.FECHA_REGISTRO));
      x.empleados=Math.max(x.empleados,num_(v.CANT_EMPLEADOS));x.afiliados=Math.max(x.afiliados,num_(v.CANT_AFILIADOS));x.carnets=Math.max(x.carnets,num_(v.CARNETS_PENDIENTES));
      if(v.FECHA_PROXIMO_SEGUIMIENTO && (!x.proximo || dateKey_(v.FECHA_PROXIMO_SEGUIMIENTO)>x.proximo))x.proximo=dateKey_(v.FECHA_PROXIMO_SEGUIMIENTO);
    });
    let rows=Object.values(map);
    const q=norm_(f.q||'');if(q)rows=rows.filter(x=>norm_([x.empresa,x.rnc,x.responsable].join(' ')).includes(q));
    rows.sort((a,b)=>b.ultima-a.ultima);
    return {ok:true,rows:rows.slice(0,300)};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

function obtenerFichaEmpresaGAS(token,companyKey){
  try{
    const s=requireSession_(token),data=readScopedData_(s),key=norm_(companyKey);
    const visits=data.visitas.filter(v=>norm_(companyKey_(v))===key || norm_(v.RNC)===key || norm_(v.NOMBRE_RAZON_SOCIAL)===key);
    const citas=data.citas.filter(c=>norm_(companyKey_(c))===key || norm_(c.empresa)===key);
    if(!visits.length&&!citas.length)throw new Error('Empresa no encontrada.');
    visits.sort((a,b)=>timestamp_(b.FECHA_VISITA||b.FECHA_REGISTRO)-timestamp_(a.FECHA_VISITA||a.FECHA_REGISTRO));
    const latest=visits[0]||{};
    return {ok:true,empresa:{
      nombre:latest.NOMBRE_RAZON_SOCIAL||citas[0]?.empresa||'',rnc:latest.RNC||'',direccion:latest.DIRECCION_EMPRESA||'',
      contacto:latest.PERSONA_ATENDIO||'',telefono:latest.TELEFONO||'',correo:latest.CORREO||'',
      empleados:num_(latest.CANT_EMPLEADOS),afiliados:num_(latest.CANT_AFILIADOS),carnets:num_(latest.CARNETS_PENDIENTES),
      ultimaVisita:latest.FECHA_VISITA||'',proximoSeguimiento:latest.FECHA_PROXIMO_SEGUIMIENTO||''
    },visitas:visits.slice(0,50).map(sanitizeVisit_),citas:citas.slice(0,50)};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

/* ======================== REPORTES ======================== */

function obtenerReporteVisitasGAS(token,filtrosJson){
  try{
    const s=requireSession_(token),f=parse_(filtrosJson,{});
    const data=readScopedData_(s);
    const baseRows=data.visitas.filter(isRealVisit_);

    let rows=baseRows.filter(v=>{
      const d=dateKey_(v.FECHA_VISITA||v.FECHA_REGISTRO);
      return (!f.desde||d>=f.desde)&&(!f.hasta||d<=f.hasta);
    });

    if(f.gerenciaId) rows=rows.filter(v=>visitGerenciaId_(v)===legacyGerenciaId_(f.gerenciaId));
    if(f.responsableId) rows=rows.filter(v=>visitOwnerId_(v)===f.responsableId);

    const summary=aggregateVisits_(rows);
    const byGerencia=groupReport_(rows,v=>visitGerenciaId_(v)||'SIN_GERENCIA',k=>gerenciaName_(k)||k);
    const byCoordinacion=groupReport_(rows,v=>visitCoordinatorId_(v)||'',k=>userName_(k)||k).filter(x=>x.id);
    const bySupervisor=groupReport_(rows,v=>visitSupervisorId_(v)||'',k=>userName_(k)||k).filter(x=>x.id);
    const byGestor=groupOwnersReport_(rows);

    return {
      ok:true,
      summary,
      gerencias:byGerencia,
      coordinaciones:byCoordinacion,
      supervisiones:bySupervisor,
      gestores:byGestor,
      scope:publicSession_(s),
      options:{
        gerencias:getGerenciasForSession_(s),
        responsables:getAssignableUsers_(s).map(publicUser_)
      },
      reconciliation:{
        bitacoraVisible:baseRows.length,
        reporteFiltrado:rows.length
      },
      generatedAt:new Date().toISOString()
    };
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

/* ======================== EVIDENCIA ======================== */

function obtenerEvidenciaVisitaGAS(token,idVisita){
  try{
    const s=requireSession_(token),data=readScopedData_(s);
    const v=data.visitas.find(x=>String(x.ID_SISTEMA)===String(idVisita));
    if(!v)throw new Error('Visita no encontrada.');
    const fileId=text_(v.FIRMA_FILE_ID)||extractDriveId_(v.FIRMA);
    if(!fileId)throw new Error('Esta visita no tiene evidencia.');
    const file=DriveApp.getFileById(fileId),blob=file.getBlob();
    if(blob.getBytes().length>8*1024*1024)throw new Error('La evidencia es demasiado grande para previsualizar.');
    return {ok:true,dataUrl:'data:'+blob.getContentType()+';base64,'+Utilities.base64Encode(blob.getBytes()),name:file.getName()};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

/* ======================== DATOS / ALCANCE ======================== */

function readScopedData_(s){
  const version=getDataVersion_(),key='APSV_SCOPE_'+s.usuario+'_'+version;
  const cached=getJsonCache_(key); if(cached)return cached;

  const visits=readSheetObjects_(APSV.SHEETS.VISITAS).filter(v=>canSeeVisit_(s,v));
  const appts=readSheetObjects_(APSV.SHEETS.CITAS).filter(x=>canSeeOwner_(s,text_(x.responsableUsuarioId||x.gestor),text_(x.gerenciaId),text_(x.coordinadorId),text_(x.supervisorId)));
  const preps=readSheetObjects_(APSV.SHEETS.PREVISITAS).filter(x=>canSeeOwner_(s,text_(x.responsableUsuarioId||x.gestor),text_(x.gerenciaId),text_(x.coordinadorId),text_(x.supervisorId)));
  const out={visitas:visits,citas:appts,previsitas:preps};
  putJsonCache_(key,out,APSV.CACHE_TTL);
  return out;
}

function canSeeVisit_(s,v){
  return canSeeOwner_(s,visitOwnerId_(v),visitGerenciaId_(v),visitCoordinatorId_(v),visitSupervisorId_(v));
}

function canSeeOwner_(s,ownerId,gerenciaId,coordinadorId,supervisorId){
  const role=norm_(s.rol);
  if(role==='DIRECTORA')return true;
  if(role==='GERENTE')return text_(gerenciaId)===text_(s.gerenciaId);
  if(role==='COORDINADOR')return text_(coordinadorId)===text_(s.usuario) || text_(ownerId)===text_(s.usuario);
  if(role==='SUPERVISOR')return text_(supervisorId)===text_(s.usuario) || text_(ownerId)===text_(s.usuario);
  return text_(ownerId)===text_(s.usuario) || norm_(ownerId)===norm_(s.nombre);
}

function getAssignableUsers_(s){
  const users=getUsers_().filter(u=>truthy_(u.activo));
  const role=norm_(s.rol);
  if(role==='DIRECTORA')return users;
  if(role==='GERENTE')return users.filter(u=>u.gerenciaId===s.gerenciaId);
  if(role==='COORDINADOR')return users.filter(u=>u.usuario===s.usuario || u.coordinadorId===s.usuario);
  if(role==='SUPERVISOR')return users.filter(u=>u.usuario===s.usuario || u.supervisorId===s.usuario);
  return users.filter(u=>u.usuario===s.usuario);
}

function resolveAssignable_(s,id){
  const list=getAssignableUsers_(s);
  const u=list.find(x=>x.usuario===id) || list.find(x=>norm_(x.nombre)===norm_(id));
  if(!u)throw new Error('No puede registrar a nombre de ese usuario.');
  return u;
}

/* ======================== FOLLOWUPS ======================== */

function buildFollowups_(visits,appts,s){
  const today=dateKey_(new Date()), seven=dateKey_(new Date(Date.now()+7*86400000));
  const out=[];
  visits.forEach(v=>{
    const d=dateKey_(v.FECHA_PROXIMO_SEGUIMIENTO);if(!d)return;
    out.push({id:'VISF-'+v.ID_SISTEMA,refId:v.ID_SISTEMA,tipo:'SEGUIMIENTO',empresa:v.NOMBRE_RAZON_SOCIAL,fecha:d,hora:'',responsable:v.REPRESENTANTE_ARS||'',estado:followState_(d,today,seven),nota:v.COMENTARIO_GESTION||''});
  });
  appts.filter(c=>norm_(c.estado)!=='CANCELADO'&&norm_(c.estado)!=='REALIZADO').forEach(c=>{
    const d=dateKey_(c.fecha);if(!d)return;
    out.push({id:c.id,refId:c.id,tipo:'CITA',empresa:c.empresa,fecha:d,hora:c.hora||'',responsable:c.responsableNombre||c.gestor||'',estado:followState_(d,today,seven),nota:c.notas||''});
  });
  out.sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  return out;
}

function followState_(d,today,seven){ if(d<today)return'VENCIDO';if(d===today)return'HOY';if(d<=seven)return'PROXIMOS_7';return'POSTERIOR'; }

function createFollowup_(companyId,company,date,type,state,owner,refId,note,s){
  const sh=getSheet_(APSV.SHEETS.SEGUIMIENTOS),map=headerMap_(sh),row=blankRow_(sh.getLastColumn());
  writeObjectRow_(row,map,{
    ID:'SEG-'+Utilities.getUuid(),EMPRESA_ID:companyId,EMPRESA:company,FECHA:date,TIPO:type,ESTADO:state,
    RESPONSABLE_USUARIO_ID:owner.usuario,RESPONSABLE_NOMBRE:owner.nombre,GERENCIA_ID:owner.gerenciaId,
    COORDINADOR_ID:owner.coordinadorId,SUPERVISOR_ID:owner.supervisorId,DIRECCION_ID:owner.direccionId,
    REFERENCIA_ID:refId,NOTA:note,REGISTRADO_POR:s.usuario,FECHA_CREACION:new Date(),FECHA_ACTUALIZACION:new Date()
  });
  sh.appendRow(row);
}

/* ======================== EMPRESAS MASTER ======================== */

function upsertCompany_(p,owner,s){
  const sh=getSheet_(APSV.SHEETS.EMPRESAS),map=headerMap_(sh);
  const rnc=digits_(p.rnc), company=required_(p.empresa||p.NOMBRE_RAZON_SOCIAL,'Empresa').toUpperCase();
  let row=rnc?findRowBy_(sh,map,'RNC',rnc):0;
  if(!row)row=findRowByNormalized_(sh,map,'RAZON_SOCIAL',company);
  const id=row?text_(getMapped_(sh,row,map,'EMPRESA_ID')):'EMP-'+Utilities.getUuid();

  const obj={
    EMPRESA_ID:id,RNC:rnc,RAZON_SOCIAL:company,NOMBRE_COMERCIAL:text_(p.nombreComercial||company),
    DIRECCION:text_(p.direccion),PROVINCIA_MUNICIPIO:text_(p.provincia),CONTACTO_PRINCIPAL:text_(p.personaAtendio||p.contacto),
    TELEFONO:text_(p.telefono),CORREO:text_(p.correo),CANT_EMPLEADOS:num_(p.empleados),CANT_AFILIADOS:num_(p.afiliados),
    CARNETS_PENDIENTES:num_(p.carnetsPendientes),GERENCIA_ID:owner.gerenciaId,RESPONSABLE_USUARIO_ID:owner.usuario,
    ULTIMA_VISITA:p.fechaVisita||'',PROXIMO_SEGUIMIENTO:text_(p.fechaSeguimiento),ESTADO:'ACTIVA',
    FECHA_ACTUALIZACION:new Date()
  };
  if(!row){
    obj.FECHA_CREACION=new Date();const blank=blankRow_(sh.getLastColumn());writeObjectRow_(blank,map,obj);sh.appendRow(blank);
  }else Object.keys(obj).forEach(k=>{if(obj[k]!==''&&obj[k]!==0)setMapped_(sh,row,map,k,obj[k]);});
  return id;
}

/* ======================== REPORT HELPERS ======================== */

function aggregateVisits_(rows){
  const companies={},salesCompanies={};
  rows.forEach(v=>{const k=companyKey_(v);if(k)companies[k]=1;if(text_(v.PRODUCTOS_SERVICIOS_VENDIDOS))salesCompanies[k]=1;});
  return {
    visitas:rows.length,empresas:Object.keys(companies).length,
    seguimientos:rows.filter(v=>text_(v.FECHA_PROXIMO_SEGUIMIENTO)).length,
    empresasConVenta:Object.keys(salesCompanies).length,
    conversion:Object.keys(companies).length?Math.round(Object.keys(salesCompanies).length/Object.keys(companies).length*1000)/10:0,
    ultimaVisita:rows.reduce((m,v)=>Math.max(m,timestamp_(v.FECHA_VISITA||v.FECHA_REGISTRO)),0)
  };
}

function groupReport_(rows,keyFn,nameFn){
  const map={};
  rows.forEach(v=>{
    const id=keyFn(v); if(!id)return;
    const x=map[id]||(map[id]={id,name:nameFn(id),rows:[]});x.rows.push(v);
  });
  return Object.values(map).map(x=>Object.assign({id:x.id,name:x.name},aggregateVisits_(x.rows))).sort((a,b)=>b.visitas-a.visitas);
}


function groupOwnersReport_(rows){
  const map={};

  (rows||[]).forEach(v=>{
    const id=visitOwnerId_(v)||'SIN_RESPONSABLE';
    const name=visitOwnerName_(v)||'SIN RESPONSABLE';

    if(!map[id]){
      map[id]={
        id:id,
        name:name,
        rows:[]
      };
    }

    if(
      (
        !map[id].name ||
        looksLikeLegacyOwnerCode_(map[id].name) ||
        map[id].name==='RESPONSABLE HISTORICO SIN NOMBRE'
      ) &&
      name &&
      !looksLikeLegacyOwnerCode_(name)
    ){
      map[id].name=name;
    }

    map[id].rows.push(v);
  });

  return Object.values(map)
    .map(x=>Object.assign(
      {
        id:x.id,
        name:x.name
      },
      aggregateVisits_(x.rows)
    ))
    .sort((a,b)=>b.visitas-a.visitas);
}

function getGerenciasForSession_(s){
  const all=[{id:'G_ARIEL',name:'GERENCIA ARIEL'},{id:'G_ANGEL',name:'GERENCIA JOSE ANGEL'},{id:'G_BELKIS',name:'GERENCIA BELKIS'}];
  if(norm_(s.rol)==='DIRECTORA')return all;
  return all.filter(x=>x.id===s.gerenciaId);
}

/* ======================== USUARIOS ======================== */

function seedUsers_(){
  const sh=getSheet_(APSV.SHEETS.USUARIOS),map=headerMap_(sh);
  const cedulaCol=map[normHeader_('Cedula')];
  if(cedulaCol!==undefined){
    sh.getRange(1,cedulaCol+1,Math.max(sh.getMaxRows(),50),1).setNumberFormat('@');
  }
  INITIAL_USERS.forEach(seed=>{
    let row=findRowBy_(sh,map,'Usuario',seed.usuario);
    const base={
      Usuario:seed.usuario,Nombre:seed.nombre,Cedula:seed.cedula,'Codigo Vendedor':seed.codigo,Rol:seed.rol,
      Gerencia:seed.gerencia,Coordinador:seed.coordinador,Supervisor:seed.supervisor,Direccion:seed.direccion,
      Activo:'SI','Version Sesion':1
    };
    if(!row){
      base['Tipo Clave']='CEDULA';base['Requiere Cambio Clave']='SI';base['Fecha Ingreso']=new Date();base['Ultima Modificacion']=new Date();
      const blank=blankRow_(sh.getLastColumn());writeObjectRow_(blank,map,base);sh.appendRow(blank);
    }else{
      ['Nombre','Cedula','Codigo Vendedor','Rol','Gerencia','Coordinador','Supervisor','Direccion','Activo'].forEach(k=>setMapped_(sh,row,map,k,base[k]));
    }
  });
  getCache_().remove('APSV_USERS');
}

function getUsers_(force){
  const c=getCache_();if(!force){const hit=c.get('APSV_USERS');if(hit)try{return JSON.parse(hit);}catch(_){}}
  const rows=readSheetObjects_(APSV.SHEETS.USUARIOS).map(r=>({
    usuario:text_(r.Usuario),nombre:text_(r.Nombre),cedula:cedula11_(r.Cedula),codigo:text_(r['Codigo Vendedor']),
    rol:norm_(r.Rol),gerenciaId:text_(r.Gerencia),coordinadorId:text_(r.Coordinador),supervisorId:text_(r.Supervisor),
    direccionId:text_(r.Direccion)||APSV.DIRECTION_ID,activo:r.Activo,tipoClave:text_(r['Tipo Clave']),
    salt:text_(r.Salt),claveHash:text_(r['Clave Hash']),versionSesion:Number(r['Version Sesion']||1),
    requiereCambioClave:r['Requiere Cambio Clave']
  }));
  try{c.put('APSV_USERS',JSON.stringify(rows),300);}catch(_){}
  return rows;
}

function publicUser_(u){return {usuario:u.usuario,nombre:u.nombre,cedula:u.cedula,codigo:u.codigo,rol:u.rol,gerenciaId:u.gerenciaId,coordinadorId:u.coordinadorId,supervisorId:u.supervisorId,direccionId:u.direccionId};}
function publicSession_(s){return {usuario:s.usuario,nombre:s.nombre,cedula:s.cedula,rol:s.rol,gerenciaId:s.gerenciaId,coordinadorId:s.coordinadorId,supervisorId:s.supervisorId,direccionId:s.direccionId};}
function userName_(id){const u=getUsers_().find(x=>x.usuario===id);return u?u.nombre:id;}
function gerenciaName_(id){return ({G_ARIEL:'GERENCIA ARIEL',G_ANGEL:'GERENCIA JOSE ANGEL',G_BELKIS:'GERENCIA BELKIS'})[id]||id||'';}

function updateUserAccess_(usuario){
  try{const sh=getSheet_(APSV.SHEETS.USUARIOS),map=headerMap_(sh),row=findUserRow_(sh,map,usuario);if(row)setMapped_(sh,row,map,'Ultimo Acceso',new Date());}catch(_){}
}
function findUserRow_(sh,map,usuario){return findRowBy_(sh,map,'Usuario',usuario);}

/* ======================== SESIONES ======================== */

function saveSession_(s){
  const txt=JSON.stringify(s);getCache_().put('APSV_SESS_'+s.token,txt,APSV.SESSION_TTL);
  PropertiesService.getScriptProperties().setProperty('APSV_SESS_'+s.token,txt);
}
function getSession_(token){
  if(!token)return null;const key='APSV_SESS_'+token,c=getCache_();let txt=c.get(key);
  if(!txt)txt=PropertiesService.getScriptProperties().getProperty(key);
  if(!txt)return null;let s;try{s=JSON.parse(txt);}catch(_){return null;}
  if(Date.now()>Number(s.expiresAt||0)){removeSession_(token);return null;}
  try{c.put(key,txt,Math.max(60,Math.floor((s.expiresAt-Date.now())/1000)));}catch(_){}
  return s;
}
function requireSession_(token){
  const s=getSession_(token);if(!s)throw new Error('Sesión vencida. Inicie sesión nuevamente.');
  const u=getUsers_().find(x=>x.usuario===s.usuario&&truthy_(x.activo));if(!u)throw new Error('Usuario inactivo.');
  if(Number(u.versionSesion||1)!==Number(s.versionSesion||1))throw new Error('La sesión ya no es válida.');
  return s;
}
function removeSession_(token){if(!token)return;getCache_().remove('APSV_SESS_'+token);PropertiesService.getScriptProperties().deleteProperty('APSV_SESS_'+token);}
function getCache_(){return CacheService.getScriptCache();}

/* ======================== HASH ======================== */

function hashPassword_(password,salt){
  let value=String(salt||'')+'|'+String(password||'');
  for(let i=0;i<600;i++){
    const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8);
    value=bytes.map(b=>('0'+((b<0?b+256:b).toString(16))).slice(-2)).join('');
  }
  return value;
}

/* ======================== SHEETS / CACHE ======================== */

function ss_(){return SpreadsheetApp.openById(APSV.SPREADSHEET_ID);}
function getSheet_(name){let sh=ss_().getSheetByName(name);if(!sh)sh=ss_().insertSheet(name);return sh;}

function ensureHeaders_(sh,headers){
  if(sh.getLastRow()===0){sh.getRange(1,1,1,headers.length).setValues([headers]);styleHeader_(sh,headers.length);return;}
  let existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getDisplayValues()[0];
  const normalized=existing.map(normHeader_);
  const missing=headers.filter(h=>normalized.indexOf(normHeader_(h))<0);
  if(missing.length){
    sh.getRange(1,sh.getLastColumn()+1,1,missing.length).setValues([missing]);styleHeader_(sh,sh.getLastColumn());
  }
}

function styleHeader_(sh,cols){
  sh.getRange(1,1,1,cols)
    .setFontWeight('bold')
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF');

  sh.setFrozenRows(1);
}

function headerMap_(sh){
  const h=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getDisplayValues()[0],m={};
  h.forEach((x,i)=>m[normHeader_(x)]=i);return m;
}
function normHeader_(s){return norm_(s).replace(/[^A-Z0-9]/g,'');}
function blankRow_(n){return Array.from({length:n},()=> '');}
function writeObjectRow_(row,map,obj){Object.keys(obj).forEach(k=>{const i=map[normHeader_(k)];if(i!==undefined)row[i]=obj[k];});}
function setMapped_(sh,row,map,key,val){const i=map[normHeader_(key)];if(i!==undefined)sh.getRange(row,i+1).setValue(val);}
function getMapped_(sh,row,map,key){const i=map[normHeader_(key)];return i===undefined?'':sh.getRange(row,i+1).getValue();}

function readSheetObjects_(sheetName){
  const sh=getSheet_(sheetName),lr=sh.getLastRow(),lc=sh.getLastColumn();if(lr<=1||lc<1)return[];
  const values=sh.getRange(1,1,lr,lc).getDisplayValues(),headers=values[0];
  return values.slice(1).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o;});
}
function rowObject_(sh,map,row){
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],v=sh.getRange(row,1,1,sh.getLastColumn()).getDisplayValues()[0],o={};h.forEach((x,i)=>o[x]=v[i]);return o;
}
function findRowBy_(sh,map,key,val){
  const i=map[normHeader_(key)];if(i===undefined||sh.getLastRow()<2)return 0;
  const vals=sh.getRange(2,i+1,sh.getLastRow()-1,1).getDisplayValues().flat();
  const target=text_(val);for(let x=0;x<vals.length;x++)if(text_(vals[x])===target)return x+2;return 0;
}
function findRowByNormalized_(sh,map,key,val){
  const i=map[normHeader_(key)];if(i===undefined||sh.getLastRow()<2)return 0;
  const vals=sh.getRange(2,i+1,sh.getLastRow()-1,1).getDisplayValues().flat(),target=norm_(val);
  for(let x=0;x<vals.length;x++)if(norm_(vals[x])===target)return x+2;return 0;
}

function getDataVersion_(){return Number(PropertiesService.getScriptProperties().getProperty('APSV_DATA_VERSION')||1);}
function bumpDataVersion_(){const v=getDataVersion_()+1;PropertiesService.getScriptProperties().setProperty('APSV_DATA_VERSION',String(v));return v;}
function putJsonCache_(key,obj,ttl){try{const txt=JSON.stringify(obj),size=80000,count=Math.ceil(txt.length/size),c=getCache_(),pack={};pack[key+'_META']=String(count);for(let i=0;i<count;i++)pack[key+'_'+i]=txt.slice(i*size,(i+1)*size);c.putAll(pack,ttl);}catch(_){}}
function getJsonCache_(key){try{const c=getCache_(),n=Number(c.get(key+'_META')||0);if(!n)return null;const keys=Array.from({length:n},(_,i)=>key+'_'+i),all=c.getAll(keys);let t='';for(const k of keys){if(all[k]==null)return null;t+=all[k];}return JSON.parse(t);}catch(_){return null;}}

/* ======================== EVIDENCIA ======================== */

function savePrivateEvidence_(dataUrl,id,fileName,mime){
  const match=String(dataUrl||'').match(/^data:([^;]+);base64,(.+)$/);
  if(!match)throw new Error('La evidencia no tiene un formato válido.');
  const bytes=Utilities.base64Decode(match[2]);if(bytes.length>8*1024*1024)throw new Error('La evidencia supera 8 MB.');
  const folder=DriveApp.getFolderById(APSV.DRIVE_FOLDER_ID);
  const ext=(match[1].includes('png')?'png':match[1].includes('webp')?'webp':'jpg');
  const safe='VISITA_'+id+'_'+Utilities.formatDate(new Date(),APSV.TIME_ZONE,'yyyyMMdd_HHmmss')+'.'+ext;
  const blob=Utilities.newBlob(bytes,match[1]||mime||'image/jpeg',safe);
  const f=folder.createFile(blob);
  return {url:f.getUrl(),fileId:f.getId()};
}
function extractDriveId_(s){const m=String(s||'').match(/[-\w]{20,}/);return m?m[0]:'';}

/* ======================== UTILS ======================== */

function sanitizeVisit_(v){
  return {
    id:v.ID_SISTEMA,fechaRegistro:v.FECHA_REGISTRO,empresa:v.NOMBRE_RAZON_SOCIAL,rnc:v.RNC,provincia:v.PROVINCIA_MUNICIPIO,
    personaAtendio:v.PERSONA_ATENDIO,telefono:v.TELEFONO,correo:v.CORREO,fechaVisita:v.FECHA_VISITA,
    gerencia:v.GERENCIA_NOMBRE,gerenciaId:visitGerenciaId_(v),responsableId:visitOwnerId_(v),
    responsable:visitOwnerName_(v),tipoGestion:v.TIPO_GESTION,
    fechaSeguimiento:v.FECHA_PROXIMO_SEGUIMIENTO,empleados:num_(v.CANT_EMPLEADOS),afiliados:num_(v.CANT_AFILIADOS),
    carnetsPendientes:num_(v.CARNETS_PENDIENTES),fechaUltimaEntrega:v.FECHA_ULTIMA_ENTREGA_CARNETS,
    operativoMedico:v.OPERATIVO_MEDICO,levantamiento:v.LEVANTAMIENTO_REALIZADO,detalleLevantamiento:v.DETALLE_LEVANTAMIENTO,
    direccion:v.DIRECCION_EMPRESA,fidelizada:v.EMPRESA_FIDELIZADA,productosOfertados:v.PRODUCTOS_SERVICIOS_OFERTADOS,
    productosVendidos:v.PRODUCTOS_SERVICIOS_VENDIDOS,comentario:v.COMENTARIO_GESTION,
    origenTipo:v.ORIGEN_TIPO||'',origenId:v.ORIGEN_ID||'',resultadoVisita:v.RESULTADO_VISITA||'',
    prioridad:v.PRIORIDAD||'',nivelInteres:v.NIVEL_INTERES||'',decisorPresente:v.DECISOR_PRESENTE||'',
    estadoComercial:v.ESTADO_COMERCIAL||'',
    sector:v.SECTOR_EMPRESA||'',sectorOtro:v.SECTOR_OTRO||'',
    latitud:v.LATITUD||'',longitud:v.LONGITUD||'',mapsUrl:v.MAPS_URL||'',
    tieneEvidencia:!!text_(v.FIRMA),registradoPor:v.REGISTRADO_POR_NOMBRE||'',coordinadorId:visitCoordinatorId_(v),supervisorId:visitSupervisorId_(v)
  };
}
function legacyGerenciaId_(raw) {
  const n = norm_(raw);
  if (!n) return '';
  if (['GER1','G_ARIEL'].includes(n) || n.includes('ARIEL AGUILERA')) return 'G_ARIEL';
  if (['GER2','G_ANGEL'].includes(n) || n.includes('JOSE ANGEL') || n.includes('RAFELINA PICHARDO')) return 'G_ANGEL';
  if (['GER3','G_BELKIS'].includes(n) || n.includes('BELKIS ANDUJAR')) return 'G_BELKIS';
  return text_(raw);
}

function resolveUserByAny_(value) {
  const raw = text_(value);
  if (!raw) return null;
  const n = norm_(raw);
  return getUsers_().find(u =>
    u.usuario === raw ||
    norm_(u.nombre) === n ||
    (u.cedula && digits_(raw) === digits_(u.cedula))
  ) || null;
}

function resolvedVisitUser_(v) {
  // V14: un registro histórico puede traer un código como GEST1/GES12/GER3
  // en GESTOR_ID y, al mismo tiempo, el nombre real en REPRESENTANTE_ARS.
  // Se prueban todos los candidatos; no nos detenemos en el primer valor no vacío.
  const candidates = [
    v.RESPONSABLE_USUARIO_ID,
    v.RESPONSABLE_NOMBRE,
    v.REPRESENTANTE_ARS,
    v.GESTOR_ID
  ];
  for (const candidate of candidates) {
    const u = resolveUserByAny_(candidate);
    if (u) return u;
  }
  return null;
}

function looksLikeLegacyOwnerCode_(value) {
  return /^(GEST|GES|GER)\d+$/.test(norm_(value));
}

function visitOwnerId_(v) {
  const u = resolvedVisitUser_(v);
  if (u) return u.usuario;
  const named = text_(v.RESPONSABLE_NOMBRE||v.REPRESENTANTE_ARS);
  if (named) return 'LEGACY_NAME:' + norm_(named);
  return text_(v.RESPONSABLE_USUARIO_ID||v.GESTOR_ID);
}

function visitOwnerName_(v) {
  const u = resolvedVisitUser_(v);
  if (u) return u.nombre;
  const named = text_(v.RESPONSABLE_NOMBRE||v.REPRESENTANTE_ARS);
  if (named) return named;
  const raw = text_(v.RESPONSABLE_USUARIO_ID||v.GESTOR_ID);
  if (looksLikeLegacyOwnerCode_(raw)) return 'RESPONSABLE HISTORICO SIN NOMBRE';
  return raw||'SIN RESPONSABLE';
}

function visitGerenciaId_(v) {
  const direct = legacyGerenciaId_(v.GERENCIA_ID_SNAPSHOT||v.GERENCIA_ID||v.gerenciaId||v.GERENCIA_NOMBRE);
  if (['G_ARIEL','G_ANGEL','G_BELKIS'].includes(direct)) return direct;
  const u = resolvedVisitUser_(v);
  return u ? u.gerenciaId : direct;
}

function visitCoordinatorId_(v) {
  const direct = text_(v.COORDINADOR_ID_SNAPSHOT||v.coordinadorId);
  if (direct) return direct;
  const u = resolvedVisitUser_(v);
  return u ? u.coordinadorId : '';
}

function visitSupervisorId_(v) {
  const direct = text_(v.SUPERVISOR_ID_SNAPSHOT||v.supervisorId);
  if (direct) return direct;
  const u = resolvedVisitUser_(v);
  return u ? u.supervisorId : '';
}
function companyKey_(v){return digits_(v.RNC||v.rnc)||norm_(v.NOMBRE_RAZON_SOCIAL||v.empresa||v.nombreempresa);}
function googleMapsUrl_(lat,lng,address) {
  const la = text_(lat), lo = text_(lng);
  if (la && lo) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(la + ',' + lo);
  const a = text_(address);
  return a ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a) : '';
}

function commercialState_(p){
  if(products_(p.productosVendidos)) return 'CIERRE / VENTA';
  if(text_(p.fechaSeguimiento)) return 'EN SEGUIMIENTO';
  if(norm_(p.resultadoVisita)==='SIN INTERES') return 'SIN INTERES';
  return 'VISITADO';
}
function products_(v){if(Array.isArray(v))return v.filter(Boolean).join(', ');return text_(v);}
function yesNo_(v){if(typeof v==='boolean')return v?'Sí':'No';const n=norm_(v);return ['SI','SÍ','YES','TRUE','1'].includes(n)?'Sí':'No';}
function text_(v){return v===null||v===undefined?'':String(v).trim();}
function cedula11_(v){
  const d=digits_(v);
  return d ? d.padStart(11,'0').slice(-11) : '';
}
function digits_(v){return text_(v).replace(/\D/g,'');}
function norm_(v){return text_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function num_(v){const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0;}
function required_(v,label){const x=text_(v);if(!x)throw new Error(label+' es obligatorio.');return x;}
function truthy_(v){return ['SI','SÍ','TRUE','1','ACTIVO','YES'].includes(norm_(v));}
function parse_(s,def){try{return typeof s==='string'?JSON.parse(s):s||def;}catch(_){return def;}}
function dateKey_(v){
  if(!v)return'';
  if(Object.prototype.toString.call(v)==='[object Date]' && !isNaN(v)) return Utilities.formatDate(v,APSV.TIME_ZONE,'yyyy-MM-dd');
  const s=text_(v);
  if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m)return m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');
  const d=new Date(s);
  return isNaN(d)?'':Utilities.formatDate(d,APSV.TIME_ZONE,'yyyy-MM-dd');
}
function timestamp_(v){const d=new Date(v);return isNaN(d)?0:d.getTime();}
function unique_(a){return [...new Set(a)];}

function audit_(user,module,action,id,status,detail){
  try{const sh=getSheet_(APSV.SHEETS.AUDITORIA);ensureHeaders_(sh,AUDIT_HEADERS);sh.appendRow([new Date(),user,module,action,module,id,status,detail]);}catch(_){}
}
function error_(module,e){
  try{const sh=getSheet_(APSV.SHEETS.ERRORES);ensureHeaders_(sh,ERROR_HEADERS);sh.appendRow([new Date(),module,e.message||String(e),e.stack||'']);}catch(_){}
}

