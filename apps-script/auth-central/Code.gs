/**
 * APS AUTH CENTRAL V1
 * Fase 1 APS PRO
 * Reemplazar SPREADSHEET_ID antes de ejecutar setupApsAuthCentral().
 */
const AUTH=Object.freeze({
  VERSION:'APS-AUTH-V3.5-AUDIT-C5-2026.10.16',
  SPREADSHEET_ID:'1SluvJUXymSsXppNrAcOf33pPp1o5R21b0edNjGvqryU',
  TZ:'America/Santo_Domingo',
  DIRECTION_ID:'DIRECCION_COMERCIAL',
  SESSION_HOURS:12,
  CACHE_TTL:300,
  HASH_ROUNDS:800,
  SHEETS:{USERS:'USUARIOS_APS',SESSIONS:'SESIONES_APS',AUDIT:'AUDITORIA_AUTH',MODULES:'MODULOS_APS',PERMISSIONS:'PERMISOS_USUARIOS'}
});

const AUTH_SECURITY=Object.freeze({
  LOGIN_MAX_FAILURES:6,
  LOGIN_BLOCK_SECONDS:300,
  LOGIN_FAILURE_TTL_SECONDS:600,
  LEGACY_HASH_ROUNDS:800,
  PASSWORD_PEPPER_PROPERTY:'APS_AUTH_PASSWORD_PEPPER'
});

const USER_HEADERS=['Usuario ID','Cedula','Nombre','Codigo Vendedor','Rol','Gerencia ID','Coordinador ID','Supervisor ID','Direccion ID','Estado Personal','Activo','Salt','Clave Hash','Version Sesion','Requiere Cambio Clave','Ultimo Acceso','Fecha Ingreso','Fecha Salida','Foto File ID','Foto Mime','Foto Actualizada','Foto Version','Modificado Por','Ultima Modificacion'];
const SESSION_HEADERS=['Sesion ID','Token Hash','Usuario ID','Fecha Creacion','Fecha Expiracion','Ultimo Uso','Activo','Dispositivo','Version Sesion','Motivo Cierre'];
const AUDIT_HEADERS=['Fecha','Usuario ID','Accion','Estado','Modulo','Detalle'];
const MODULE_HEADERS=['Modulo ID','Nombre','Activo','URL','Orden','Roles Permitidos','Icono'];
const PERMISSION_HEADERS=['Usuario ID','Modulo ID','Permitido','Modificado Por','Ultima Modificacion'];

const INITIAL_USERS=[
 ['maite.veras','00116321597','MAITE VERAS','','DIRECTORA','','','','DIRECCION_COMERCIAL'],
 ['ariel.aguilera','00118554757','ARIEL AGUILERA ROSADO','2312','GERENTE','G_ARIEL','','','DIRECCION_COMERCIAL'],
 ['jose.angel','00118335355','JOSE ANGEL GONZALEZ FLORES','2262','GERENTE','G_ANGEL','','','DIRECCION_COMERCIAL'],
 ['belkis.andujar','02301576803','BELKIS ELISA ANDUJAR RODRIGUEZ','1633','GERENTE','G_BELKIS','','','DIRECCION_COMERCIAL'],
 ['rafelina.pichardo','22900209440','RAFELINA DAYANARA PICHARDO FELIZ','1645','COORDINADOR','G_ANGEL','rafelina.pichardo','','DIRECCION_COMERCIAL'],
 ['dairy.rodriguez','40222803898','DAIRY ESTEFANY RODRIGUEZ RODRIGUEZ','2223','COORDINADOR','G_BELKIS','dairy.rodriguez','','DIRECCION_COMERCIAL'],
 ['rafael.alcantara','22300180571','RAFAEL ALCANTARA FERMIN','2553','GESTOR','G_ARIEL','','','DIRECCION_COMERCIAL'],
 ['adalgiza.arvelo','40220769166','ADALGIZA ARVELO CASANOVA','2555','GESTOR','G_ARIEL','','','DIRECCION_COMERCIAL'],
 ['gardenia.montero','00119084549','GARDENIA MONTERO','1631','GESTOR','G_ARIEL','','','DIRECCION_COMERCIAL'],
 ['rosario.valerio','22300151606','ROSARIO VALERIO RODRIGUEZ','2558','GESTOR','G_ARIEL','','','DIRECCION_COMERCIAL'],
 ['rosalina.sanchez','22301298182','ROSALINA MERCEDES SANCHEZ','2355','GESTOR','G_ANGEL','rafelina.pichardo','','DIRECCION_COMERCIAL'],
 ['gerald.carrasco','22900295787','GERALD EMMANUEL CARRASCO HERNANDEZ','2554','GESTOR','G_ANGEL','rafelina.pichardo','','DIRECCION_COMERCIAL'],
 ['denni.ramirez','00500439559','DENNI ESTHER RAMIREZ DE GERMAN','2560','GESTOR','G_ANGEL','rafelina.pichardo','','DIRECCION_COMERCIAL'],
 ['katiusca.familia','22301618132','KATIUSCA VICTORIA FAMILIA','2557','GESTOR','G_ANGEL','rafelina.pichardo','','DIRECCION_COMERCIAL'],
 ['yordhira.castillo','02601380237','YORDHIRA VANESSA CASTILLO MARTINEZ','2140','GESTOR','G_BELKIS','dairy.rodriguez','','DIRECCION_COMERCIAL'],
 ['ana.brito','00201152055','ANA BRITO','910','GESTOR','G_BELKIS','dairy.rodriguez','','DIRECCION_COMERCIAL'],
 ['ana.tubay','40221357573','ANA ERCILIA TUBAY LIRIANO','1954','GESTOR','G_BELKIS','dairy.rodriguez','','DIRECCION_COMERCIAL']
];

const INITIAL_MODULES=[
 ['PORTAL','Portal APS','SI','',1,'DIRECTORA,GERENTE,COORDINADOR,SUPERVISOR,GESTOR','layout-dashboard'],
 ['PRODUCCION','Producción','SI','',2,'DIRECTORA,GERENTE,COORDINADOR,SUPERVISOR,GESTOR','chart-no-axes-combined'],
 ['VISITAS','Visitas a Empresas','SI','https://script.google.com/macros/s/AKfycbzA8Qpia9_GC0KJlLSdsokA_SMqTXFDTAZZEYYo0ZABfIyvIoSC1oqjGQ-nJsWFMbPG/exec',3,'DIRECTORA,GERENTE,COORDINADOR,SUPERVISOR,GESTOR','building-2'],
 ['CARNETS','Carnets','SI','',4,'DIRECTORA,GERENTE,COORDINADOR,SUPERVISOR,GESTOR','badge-check'],
 ['ADMIN','Administración de Personal','SI','',90,'DIRECTORA,GERENTE','users-cog']
];

const AUTH_PROFILE=Object.freeze({
  FOLDER_PROPERTY:'APS_AUTH_PROFILE_PHOTO_FOLDER_ID',
  FOLDER_NAME:'APS_AUTH_CENTRAL_FOTOS',
  MAX_BYTES:900*1024,
  ALLOWED_MIME:['image/jpeg','image/png','image/webp']
});

function doGet(e){
  if(e && e.parameter && e.parameter.health === '1')
    return json_({ok:true,module:'AUTH_CENTRAL',version:AUTH.VERSION});
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('APS AUTH CENTRAL')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e){
  try{
    const p=JSON.parse(e?.postData?.contents||'{}'),a=norm_(p.action);
    let r;
    if(a==='LOGIN')r=authLogin_(p.cedula,p.password,p.device||'API');
    else if(a==='PING')r={ok:true,module:'AUTH_CENTRAL',version:AUTH.VERSION};
    else if(a==='VALIDATE')r=authValidate_(p.token,p.moduleId||'');
    else if(a==='LOGOUT')r=authLogout_(p.token);
    else if(a==='MODULES')r=authModules_(p.token);
    else if(a==='ADMIN_BOOT')r=adminBoot_(p.token);
    else if(a==='ADMIN_SAVE_USER')r=adminSaveUser_(p.token,p.user||{});
    else if(a==='ADMIN_RESET_PASSWORD')r=adminResetPassword_(p.token,p.usuarioId);
    else if(a==='ADMIN_SET_ACCESS')r=adminSetAccess_(p.token,p.usuarioId,p.activo);
    else if(a==='ADMIN_SAVE_PERMISSIONS')r=adminSavePermissions_(p.token,p.usuarioId,p.permissions||{});
    else if(a==='ADMIN_AUDIT')r=adminAudit_(p.token,Number(p.limit||100));
    else if(a==='PROFILE_PHOTO')r=profilePhoto_(p.token,p.usuarioId||'');
    else if(a==='SAVE_PROFILE_PHOTO')r=saveProfilePhoto_(p.token,p.usuarioId||'',p.file||{});
    else if(a==='DELETE_PROFILE_PHOTO')r=deleteProfilePhoto_(p.token,p.usuarioId||'');
    else if(a==='CHANGE_PASSWORD')r=changePassword_(p.token,p.actual||'',p.nueva||'');
    else if(a==='ADMIN_SESSIONS')r=adminSessions_(p.token,p.usuarioId||'');
    else if(a==='ADMIN_REVOKE_SESSIONS')r=adminRevokeSessions_(p.token,p.usuarioId||'');
    else if(a==='ADMIN_HEALTH')r=adminHealth_(p.token);
    else if(a==='PROFILE_PHOTO_META')r=profilePhotoMeta_(p.token,p.usuarioId||'');
    else r={ok:false,message:'Acción no válida.'};
    return json_(r);
  }catch(err){return json_({ok:false,message:err.message||String(err)});}
}

function setupApsAuthCentral(){
  validateConfig_();
  authPepper_();
  ensureSheet_(AUTH.SHEETS.USERS,USER_HEADERS);
  ensureSheet_(AUTH.SHEETS.SESSIONS,SESSION_HEADERS);
  ensureSheet_(AUTH.SHEETS.AUDIT,AUDIT_HEADERS);
  ensureSheet_(AUTH.SHEETS.MODULES,MODULE_HEADERS);
  ensureSheet_(AUTH.SHEETS.PERMISSIONS,PERMISSION_HEADERS);
  ensureCedulaText_();
  seedUsers_();
  seedModules_();
  seedPermissions_();
  clearCaches_();
  return diagnosticoApsAuthCentral();
}

function diagnosticoApsAuthCentral(){
  const ss=ss_();
  const pepperConfigured=!!text_(PropertiesService.getScriptProperties().getProperty(AUTH_SECURITY.PASSWORD_PEPPER_PROPERTY));
  return {ok:true,version:AUTH.VERSION,webappUrl:ScriptApp.getService().getUrl(),spreadsheetId:ss.getId(),spreadsheetName:ss.getName(),
    sheets:ss.getSheets().map(s=>({name:s.getName(),rows:s.getLastRow(),cols:s.getLastColumn()})),
    users:getUsers_(true).length,modules:getModules_(true).length,permissions:read_(AUTH.SHEETS.PERMISSIONS).length,
    security:{loginRateLimit:true,passwordHashVersion:'v2-pepper-sha256',pepperConfigured:pepperConfigured}};
}

/* API para frontend/Portal */
function loginCentralGAS(cedula,password,device){try{return authLogin_(cedula,password,device||'WEB');}catch(e){return {ok:false,message:e.message||String(e)};}}
function validarTokenCentralGAS(token,moduleId){try{return authValidate_(token,moduleId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}
function cerrarSesionCentralGAS(token){try{return authLogout_(token);}catch(e){return {ok:false,message:e.message||String(e)};}}
function obtenerModulosCentralGAS(token){try{return authModules_(token);}catch(e){return {ok:false,message:e.message||String(e)};}}
function obtenerFotoCentralGAS(token,usuarioId){try{return profilePhoto_(token,usuarioId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}
function guardarFotoCentralGAS(token,usuarioId,file){try{return saveProfilePhoto_(token,usuarioId||'',file||{});}catch(e){return {ok:false,message:e.message||String(e)};}}
function eliminarFotoCentralGAS(token,usuarioId){try{return deleteProfilePhoto_(token,usuarioId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}

function obtenerSaludIdentidadGAS(token){try{return adminHealth_(token);}catch(e){return {ok:false,message:e.message||String(e)};}}
function obtenerSesionesCentralGAS(token,usuarioId){try{return adminSessions_(token,usuarioId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}
function cerrarSesionesCentralGAS(token,usuarioId){try{return adminRevokeSessions_(token,usuarioId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}
function obtenerMetaFotoCentralGAS(token,usuarioId){try{return profilePhotoMeta_(token,usuarioId||'');}catch(e){return {ok:false,message:e.message||String(e)};}}

function obtenerEstructuraCentralGAS(token){
  try{
    const s=requireSession_(token),actor=getUser_(s.usuarioId);
    const users=getUsers_().filter(u=>u.activo&&canSeeUser_(actor,u)).map(publicUser_);
    return {ok:true,user:publicUser_(actor),users};
  }catch(e){return {ok:false,message:e.message||String(e)};}
}

function cambiarClaveCentralGAS(token,actual,nueva){
  try{return changePassword_(token,actual,nueva);}
  catch(e){return {ok:false,message:e.message||String(e)};}
}

function changePassword_(token,actual,nueva){
  const s=requireSession_(token),u=getUser_(s.usuarioId);

  if(!verifyPassword_(actual,u)){
    throw new Error('La contraseña actual no es correcta.');
  }

  if(String(nueva||'').length<8){
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }

  if(digits_(nueva)===u.cedula){
    throw new Error('La nueva contraseña no puede ser igual a la cédula.');
  }

  const salt=randomHex_(32);
  const sh=sheet_(AUTH.SHEETS.USERS);
  const map=headerMap_(sh);
  const row=findRow_(sh,map,'Usuario ID',u.usuarioId);
  const ver=Number(u.versionSesion||1)+1;

  set_(sh,row,map,'Salt',salt);
  set_(sh,row,map,'Clave Hash',hashPassword_(nueva,salt));
  set_(sh,row,map,'Version Sesion',ver);
  set_(sh,row,map,'Requiere Cambio Clave','NO');
  set_(sh,row,map,'Modificado Por',u.usuarioId);
  set_(sh,row,map,'Ultima Modificacion',new Date());

  revokeSessions_(u.usuarioId,'CAMBIO_CLAVE');
  clearCaches_();
  audit_(u.usuarioId,'CAMBIO_CLAVE','OK','AUTH','Contraseña central actualizada');

  return {
    ok:true,
    message:'Contraseña central actualizada. Inicie sesión nuevamente.'
  };
}

/* Core */
function authLogin_(cedula,password,device){
  cedula=cedula11_(cedula);password=text_(password);
  if(cedula.length!==11||!password)throw new Error('Cédula o contraseña incorrecta.');

  assertLoginAllowed_(cedula);

  const u=getUsers_().find(x=>x.cedula===cedula&&x.activo);
  if(!u||!verifyPassword_(password,u)){
    recordLoginFailure_(cedula);
    audit_(u?.usuarioId||'','LOGIN','RECHAZADO','AUTH','Credenciales inválidas');
    throw new Error('Cédula o contraseña incorrecta.');
  }

  clearLoginFailures_(cedula);
  upgradePasswordHashIfLegacy_(password,u);

  const raw=createToken_(),hash=tokenHash_(raw),id='SES-'+Utilities.getUuid(),now=new Date(),exp=new Date(now.getTime()+AUTH.SESSION_HOURS*3600000);
  append_(sheet_(AUTH.SHEETS.SESSIONS),{'Sesion ID':id,'Token Hash':hash,'Usuario ID':u.usuarioId,'Fecha Creacion':now,'Fecha Expiracion':exp,'Ultimo Uso':now,'Activo':'SI','Dispositivo':text_(device),'Version Sesion':u.versionSesion,'Motivo Cierre':''});
  updateLastAccess_(u.usuarioId);cacheSession_(hash,{sesionId:id,usuarioId:u.usuarioId,expira:exp.getTime(),versionSesion:u.versionSesion});
  audit_(u.usuarioId,'LOGIN','OK','AUTH','Acceso central autorizado');
  return {ok:true,token:raw,expiresAt:exp.toISOString(),requireChange:u.requiereCambioClave,requirePhoto:!u.fotoFileId,user:publicUser_(u),modules:allowedModules_(u)};
}

function authValidate_(token,moduleId){
  const s=requireSession_(token),u=getUser_(s.usuarioId);
  if(!u||!u.activo)throw new Error('Usuario inactivo.');

  const requested=norm_(moduleId);

  if(moduleId&&!canAccessModule_(u,moduleId)){
    throw new Error('No tiene permiso para este módulo.');
  }

  // La foto es un requisito central de identidad.
  // El Portal queda accesible para que el propio usuario pueda completar su foto.
  // Los demás módulos quedan bloqueados hasta completar el perfil.
  if(requested && requested!=='PORTAL' && !u.fotoFileId){
    throw new Error(
      'Debes registrar tu foto de perfil obligatoria en Negocios 2.5 antes de entrar a este módulo.'
    );
  }

  touchSession_(s);

  return {
    ok:true,
    valid:true,
    expiresAt:new Date(s.expira).toISOString(),
    requirePhoto:!u.fotoFileId,
    user:publicUser_(u),
    moduleId:text_(moduleId)
  };
}

function authLogout_(token){
  const h=tokenHash_(token);if(!h)return {ok:true};
  const sh=sheet_(AUTH.SHEETS.SESSIONS),m=headerMap_(sh),row=findRow_(sh,m,'Token Hash',h);
  if(row){const uid=text_(get_(sh,row,m,'Usuario ID'));set_(sh,row,m,'Activo','NO');set_(sh,row,m,'Motivo Cierre','LOGOUT');cache_().remove('AUTH_SES_'+h);audit_(uid,'LOGOUT','OK','AUTH','Sesión cerrada');}
  return {ok:true};
}

function authModules_(token){
  const s=requireSession_(token),u=getUser_(s.usuarioId);
  touchSession_(s);
  return {
    ok:true,
    requirePhoto:!u.fotoFileId,
    user:publicUser_(u),
    modules:allowedModules_(u)
  };
}

function requireSession_(token){
  const h=tokenHash_(token);if(!h)throw new Error('Token requerido.');
  const key='AUTH_SES_'+h,hit=cache_().get(key);
  if(hit){try{const s=JSON.parse(hit),u=getUser_(s.usuarioId);if(Date.now()<s.expira&&u&&u.activo&&Number(u.versionSesion)===Number(s.versionSesion))return s;}catch(_){}}
  const sh=sheet_(AUTH.SHEETS.SESSIONS),m=headerMap_(sh),row=findRow_(sh,m,'Token Hash',h);
  if(!row)throw new Error('Sesión no válida.');
  const o=rowObj_(sh,row),exp=parseDate_(o['Fecha Expiracion']),u=getUser_(o['Usuario ID']);
  if(!truthy_(o['Activo'])||!exp||Date.now()>=exp.getTime()||!u||!u.activo||Number(u.versionSesion)!==Number(o['Version Sesion']||1)){
    set_(sh,row,m,'Activo','NO');set_(sh,row,m,'Motivo Cierre','EXPIRADA_O_REVOCADA');cache_().remove(key);throw new Error('Sesión vencida. Inicie sesión nuevamente.');
  }
  const s={sesionId:text_(o['Sesion ID']),usuarioId:u.usuarioId,expira:exp.getTime(),versionSesion:u.versionSesion};cacheSession_(h,s);return s;
}

/* Jerarquía */
function canSeeUser_(a,t){
  const r=norm_(a.rol);
  if(r==='DIRECTORA')return true;
  if(r==='GERENTE')return a.gerenciaId===t.gerenciaId;
  if(r==='COORDINADOR')return t.usuarioId===a.usuarioId||t.coordinadorId===a.usuarioId;
  if(r==='SUPERVISOR')return t.usuarioId===a.usuarioId||t.supervisorId===a.usuarioId;
  return t.usuarioId===a.usuarioId;
}

/* Seed */
function seedUsers_(){
  const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh);

  INITIAL_USERS.forEach(a=>{
    const [id,ced,nombre,codigo,rol,ger,coord,sup,dir]=a;
    const row=findRow_(sh,m,'Usuario ID',id);

    if(!row){
      const salt=randomHex_(32);

      append_(sh,{
        'Usuario ID':id,
        'Cedula':ced,
        'Nombre':nombre,
        'Codigo Vendedor':codigo,
        'Rol':rol,
        'Gerencia ID':ger,
        'Coordinador ID':coord,
        'Supervisor ID':sup,
        'Direccion ID':dir,
        'Estado Personal':'ACTIVO',
        'Activo':'SI',
        'Salt':salt,
        'Clave Hash':hashPassword_(ced,salt),
        'Version Sesion':1,
        'Requiere Cambio Clave':'SI',
        'Ultimo Acceso':'',
        'Fecha Ingreso':new Date(),
        'Fecha Salida':'',
        'Modificado Por':'SETUP',
        'Ultima Modificacion':new Date()
      });

      return;
    }

    /*
     * Si el usuario ya existe, NO se sobrescribe su estructura,
     * contraseña, rol ni ningún dato administrado.
     * Solo completa el Código Vendedor cuando actualmente está vacío.
     */
    const codigoActual=text_(get_(sh,row,m,'Codigo Vendedor'));

    if(codigo && !codigoActual){
      set_(sh,row,m,'Codigo Vendedor',codigo);
      set_(sh,row,m,'Modificado Por','MIGRACION_CODIGOS');
      set_(sh,row,m,'Ultima Modificacion',new Date());

      audit_(
        id,
        'CODIGO_VENDEDOR_COMPLETADO',
        'OK',
        'ADMIN',
        'Código vendedor asignado: '+codigo
      );
    }
  });

  clearCaches_();
}


/**
 * Ejecutar UNA VEZ desde el editor de APS AUTH CENTRAL
 * si la base ya estaba creada antes de agregar estos códigos.
 *
 * Solo completa códigos vacíos; nunca reemplaza uno existente.
 */
function actualizarCodigosVendedorAPS(){
  const antes=getUsers_(true).map(function(u){
    return {
      usuarioId:u.usuarioId,
      codigoVendedor:u.codigoVendedor||''
    };
  });

  seedUsers_();

  const despues=getUsers_(true);
  const cambios=[];

  despues.forEach(function(u){
    const prev=antes.find(function(x){
      return x.usuarioId===u.usuarioId;
    });

    if(
      prev &&
      !String(prev.codigoVendedor||'').trim() &&
      String(u.codigoVendedor||'').trim()
    ){
      cambios.push({
        usuarioId:u.usuarioId,
        nombre:u.nombre,
        codigoVendedor:u.codigoVendedor
      });
    }
  });

  return {
    ok:true,
    actualizados:cambios.length,
    cambios:cambios
  };
}

function seedModules_(){
  const sh=sheet_(AUTH.SHEETS.MODULES),m=headerMap_(sh);
  INITIAL_MODULES.forEach(a=>{
    const [id,nombre,activo,url,orden,roles,icono]=a;let row=findRow_(sh,m,'Modulo ID',id);
    if(!row)append_(sh,{'Modulo ID':id,'Nombre':nombre,'Activo':activo,'URL':url,'Orden':orden,'Roles Permitidos':roles,'Icono':icono});
    else{set_(sh,row,m,'Nombre',nombre);set_(sh,row,m,'Activo',activo);if(url)set_(sh,row,m,'URL',url);set_(sh,row,m,'Orden',orden);set_(sh,row,m,'Roles Permitidos',roles);set_(sh,row,m,'Icono',icono);}
  });cache_().remove('AUTH_MODULES');
}

/* Reads */
function getUsers_(force){
  if(!force){const h=cache_().get('AUTH_USERS');if(h)try{return JSON.parse(h);}catch(_){}}
  const a=read_(AUTH.SHEETS.USERS).map(r=>({usuarioId:text_(r['Usuario ID']),cedula:cedula11_(r['Cedula']),nombre:text_(r['Nombre']),codigoVendedor:text_(r['Codigo Vendedor']),rol:norm_(r['Rol']),gerenciaId:text_(r['Gerencia ID']),coordinadorId:text_(r['Coordinador ID']),supervisorId:text_(r['Supervisor ID']),direccionId:text_(r['Direccion ID'])||AUTH.DIRECTION_ID,estadoPersonal:norm_(r['Estado Personal'])||'ACTIVO',activo:truthy_(r['Activo']),salt:text_(r['Salt']),claveHash:text_(r['Clave Hash']),versionSesion:Number(r['Version Sesion']||1),requiereCambioClave:truthy_(r['Requiere Cambio Clave']),ultimoAcceso:text_(r['Ultimo Acceso']),fechaIngreso:text_(r['Fecha Ingreso']),fechaSalida:text_(r['Fecha Salida']),fotoFileId:text_(r['Foto File ID']),fotoMime:text_(r['Foto Mime']),fotoActualizada:text_(r['Foto Actualizada']),fotoVersion:Number(r['Foto Version']||0)}));
  cache_().put('AUTH_USERS',JSON.stringify(a),AUTH.CACHE_TTL);return a;
}
function getUser_(id){return getUsers_().find(u=>u.usuarioId===text_(id))||null;}
function publicUser_(u){return {
  usuarioId:u.usuarioId,
  cedula:u.cedula,
  nombre:u.nombre,
  codigoVendedor:u.codigoVendedor,
  rol:u.rol,
  gerenciaId:u.gerenciaId,
  coordinadorId:u.coordinadorId,
  supervisorId:u.supervisorId,
  direccionId:u.direccionId,
  estadoPersonal:u.estadoPersonal||'ACTIVO',
  activo:!!u.activo,
  requiereCambioClave:!!u.requiereCambioClave,
  ultimoAcceso:u.ultimoAcceso||'',
  fechaIngreso:u.fechaIngreso||'',
  fechaSalida:u.fechaSalida||'',
  fotoDisponible:!!u.fotoFileId,
  fotoActualizada:u.fotoActualizada||'',
  fotoVersion:Number(u.fotoVersion||0)
};}

function getModules_(force){
  if(!force){const h=cache_().get('AUTH_MODULES');if(h)try{return JSON.parse(h);}catch(_){}}
  const a=read_(AUTH.SHEETS.MODULES).map(r=>({id:norm_(r['Modulo ID']),nombre:text_(r['Nombre']),activo:truthy_(r['Activo']),url:text_(r['URL']),orden:Number(r['Orden']||999),roles:text_(r['Roles Permitidos']).split(',').map(norm_).filter(Boolean),icono:text_(r['Icono'])})).sort((a,b)=>a.orden-b.orden);
  cache_().put('AUTH_MODULES',JSON.stringify(a),AUTH.CACHE_TTL);return a;
}
function allowedModules_(u){
  return getModules_()
    .filter(m=>canAccessModule_(u,m.id))
    .map(m=>({id:m.id,nombre:m.nombre,url:m.url,orden:m.orden,icono:m.icono}));
}
function canAccessModule_(u,id){
  const m=getModules_().find(x=>x.id===norm_(id));
  if(!m||!m.activo)return false;
  const explicit=getUserPermission_(u.usuarioId,m.id);
  if(explicit!==null)return explicit;
  return !m.roles.length||m.roles.includes(norm_(u.rol));
}


/* =========================================================
   ADMINISTRACIÓN CENTRAL DE PERSONAL
========================================================= */

function adminActor_(token){
  const s=requireSession_(token),actor=getUser_(s.usuarioId);
  if(!actor||!actor.activo)throw new Error('Sesión no válida.');
  if(!['DIRECTORA','GERENTE'].includes(norm_(actor.rol)))throw new Error('No tiene permiso para administrar personal.');
  return actor;
}

function adminCanManage_(actor,target){
  if(norm_(actor.rol)==='DIRECTORA')return true;
  if(norm_(actor.rol)!=='GERENTE')return false;
  if(!target)return true;
  if(target.usuarioId===actor.usuarioId)return false;
  if(norm_(target.rol)==='DIRECTORA'||norm_(target.rol)==='GERENTE')return false;
  return text_(target.gerenciaId)===text_(actor.gerenciaId);
}


function sessionRows_(){
  return read_(AUTH.SHEETS.SESSIONS).map(function(r){
    return {
      sessionId:text_(r['Sesion ID']),
      usuarioId:text_(r['Usuario ID']),
      creada:text_(r['Fecha Creacion']),
      expira:text_(r['Fecha Expiracion']),
      ultimoUso:text_(r['Ultimo Uso']),
      activa:truthy_(r['Activo']),
      dispositivo:text_(r['Dispositivo']),
      motivoCierre:text_(r['Motivo Cierre'])
    };
  });
}
function activeSessionCounts_(){
  const out={};
  sessionRows_().forEach(function(s){if(s.activa)out[s.usuarioId]=(out[s.usuarioId]||0)+1;});
  return out;
}
function deviceLabel_(ua){
  ua=text_(ua); if(!ua)return 'Dispositivo no identificado';
  const mobile=/Android|iPhone|iPad|Mobile/i.test(ua);
  let browser='Navegador';
  if(/Edg\//i.test(ua))browser='Edge';
  else if(/Chrome\//i.test(ua))browser='Chrome';
  else if(/Safari\//i.test(ua)&&!/Chrome\//i.test(ua))browser='Safari';
  else if(/Firefox\//i.test(ua))browser='Firefox';
  let os='';
  if(/Android/i.test(ua))os='Android';
  else if(/iPhone|iPad/i.test(ua))os='iOS';
  else if(/Windows/i.test(ua))os='Windows';
  else if(/Mac OS X/i.test(ua))os='macOS';
  return [mobile?'Móvil':'Equipo',os,browser].filter(Boolean).join(' · ');
}
function userHasAnyBusinessPermission_(uid){
  return ['PRODUCCION','VISITAS','CARNETS'].some(function(mid){return getUserPermission_(uid,mid)===true;});
}
function profileStatus_(u,sessionCount){
  const checks={
    nombre:!!text_(u.nombre),
    cedula:cedula11_(u.cedula).length===11,
    rol:!!text_(u.rol),
    estructura:norm_(u.rol)==='DIRECTORA'||!!text_(u.gerenciaId),
    foto:!!u.fotoFileId,
    clave:u.requiereCambioClave!==true,
    permisos:userHasAnyBusinessPermission_(u.usuarioId),
    activo:u.activo===true
  };
  const required=['nombre','cedula','rol','estructura','foto','clave','permisos'];
  const completo=required.every(function(k){return checks[k];});
  let etapa='LISTO';
  if(!checks.activo)etapa='BLOQUEADO';
  else if(!checks.clave)etapa='CAMBIAR_CLAVE';
  else if(!checks.foto)etapa='FOTO';
  else if(!completo)etapa='COMPLETAR_PERFIL';
  return {completo:completo,etapa:etapa,faltantes:required.filter(function(k){return !checks[k];}),checks:checks,sesionesActivas:Number(sessionCount||0)};
}
function adminHealth_(token){
  const actor=adminActor_(token),counts=activeSessionCounts_();
  const users=getUsers_(true).filter(function(u){return adminCanManage_(actor,u)||u.usuarioId===actor.usuarioId;});
  const state=users.map(function(u){return {u:u,s:profileStatus_(u,counts[u.usuarioId]||0)};});
  return {
    ok:true,total:users.length,
    activos:users.filter(function(u){return u.activo;}).length,
    completos:state.filter(function(x){return x.u.activo&&x.s.completo;}).length,
    sinFoto:users.filter(function(u){return u.activo&&!u.fotoFileId;}).length,
    clavesTemporales:users.filter(function(u){return u.activo&&u.requiereCambioClave;}).length,
    bloqueados:users.filter(function(u){return !u.activo;}).length,
    sesionesActivas:Object.keys(counts).reduce(function(n,k){return n+Number(counts[k]||0);},0)
  };
}
function adminSessions_(token,usuarioId){
  const actor=adminActor_(token),target=getUser_(usuarioId);
  if(!target)throw new Error('Usuario no encontrado.');
  if(!adminCanManage_(actor,target)&&actor.usuarioId!==target.usuarioId)throw new Error('No puede consultar las sesiones de este usuario.');
  const rows=sessionRows_().filter(function(s){return s.usuarioId===target.usuarioId;})
    .sort(function(a,b){return String(b.ultimoUso||b.creada).localeCompare(String(a.ultimoUso||a.creada));})
    .slice(0,50).map(function(s){return {
      sessionId:s.sessionId,creada:s.creada,expira:s.expira,ultimoUso:s.ultimoUso,
      activa:s.activa,dispositivo:s.dispositivo,dispositivoLabel:deviceLabel_(s.dispositivo),motivoCierre:s.motivoCierre
    };});
  return {ok:true,usuarioId:target.usuarioId,nombre:target.nombre,rows:rows,activeCount:rows.filter(function(s){return s.activa;}).length};
}
function adminRevokeSessions_(token,usuarioId){
  const actor=adminActor_(token),target=getUser_(usuarioId);
  if(!target)throw new Error('Usuario no encontrado.');
  if(!adminCanManage_(actor,target)&&actor.usuarioId!==target.usuarioId)throw new Error('No puede cerrar las sesiones de este usuario.');
  revokeSessions_(target.usuarioId,'CIERRE_ADMIN');
  audit_(actor.usuarioId,'CERRAR_SESIONES','OK','ADMIN',target.usuarioId);
  return {ok:true,message:'Sesiones cerradas correctamente.'};
}
function adminBoot_(token){
  const actor=adminActor_(token),counts=activeSessionCounts_();
  const users=getUsers_(true)
    .filter(function(u){return adminCanManage_(actor,u)||u.usuarioId===actor.usuarioId;})
    .map(function(u){
      const x=publicUser_(u);
      x.permissions=getPermissionsForUser_(u.usuarioId);
      x.canManage=adminCanManage_(actor,u);
      x.profile=profileStatus_(u,counts[u.usuarioId]||0);
      x.sessionCount=Number(counts[u.usuarioId]||0);
      return x;
    });
  const modules=getModules_(true).map(function(m){return {id:m.id,nombre:m.nombre,activo:m.activo,orden:m.orden,icono:m.icono};});
  return {
    ok:true,actor:publicUser_(actor),canCreate:true,users:users,modules:modules,health:adminHealth_(token),
    roles:norm_(actor.rol)==='DIRECTORA'?['DIRECTORA','GERENTE','COORDINADOR','SUPERVISOR','GESTOR']:['COORDINADOR','SUPERVISOR','GESTOR'],
    estados:['ACTIVO','VACACIONES','LICENCIA','SUSPENDIDO','DESVINCULADO']
  };
}

function adminSaveUser_(token,data){
  const actor=adminActor_(token);
  data=data||{};
  const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh);

  let usuarioId=text_(data.usuarioId).toLowerCase();
  const cedula=cedula11_(data.cedula);
  const nombre=text_(data.nombre).toUpperCase();
  const rol=norm_(data.rol);
  const gerencia=text_(data.gerenciaId);
  const coordinador=text_(data.coordinadorId);
  const supervisor=text_(data.supervisorId);
  const codigo=text_(data.codigoVendedor);
  const estado=norm_(data.estadoPersonal)||'ACTIVO';
  const activo=!!data.activo;

  if(!nombre)throw new Error('El nombre es obligatorio.');
  if(cedula.length!==11)throw new Error('La cédula debe tener 11 dígitos.');
  if(!usuarioId)usuarioId=makeUserId_(nombre);
  if(!/^[a-z0-9._-]{3,60}$/.test(usuarioId))throw new Error('Usuario ID no válido.');
  if(!['DIRECTORA','GERENTE','COORDINADOR','SUPERVISOR','GESTOR'].includes(rol))throw new Error('Rol no válido.');
  if(!['ACTIVO','VACACIONES','LICENCIA','SUSPENDIDO','DESVINCULADO'].includes(estado))throw new Error('Estado de personal no válido.');

  let row=findRow_(sh,m,'Usuario ID',usuarioId);
  const existing=row?getUser_(usuarioId):null;

  const sameCedula=getUsers_(true).find(u=>u.cedula===cedula&&u.usuarioId!==usuarioId);
  if(sameCedula)throw new Error('La cédula ya pertenece a '+sameCedula.nombre+'.');

  if(existing && !adminCanManage_(actor,existing))throw new Error('No puede modificar este usuario.');

  if(norm_(actor.rol)==='GERENTE'){
    if(['DIRECTORA','GERENTE'].includes(rol))throw new Error('Un gerente no puede crear o asignar ese rol.');
    if(existing && existing.gerenciaId!==actor.gerenciaId)throw new Error('Usuario fuera de su gerencia.');
  }

  let finalGerencia=gerencia;
  if(norm_(actor.rol)==='GERENTE')finalGerencia=actor.gerenciaId;
  if(rol==='DIRECTORA')finalGerencia='';

  if(!row){
    const salt=randomHex_(32);
    const temp=generateTempPassword_();
    append_(sh,{
      'Usuario ID':usuarioId,
      'Cedula':cedula,
      'Nombre':nombre,
      'Codigo Vendedor':codigo,
      'Rol':rol,
      'Gerencia ID':finalGerencia,
      'Coordinador ID':coordinador,
      'Supervisor ID':supervisor,
      'Direccion ID':AUTH.DIRECTION_ID,
      'Estado Personal':estado,
      'Activo':activo?'SI':'NO',
      'Salt':salt,
      'Clave Hash':hashPassword_(temp,salt),
      'Version Sesion':1,
      'Requiere Cambio Clave':'SI',
      'Ultimo Acceso':'',
      'Fecha Ingreso':data.fechaIngreso||new Date(),
      'Fecha Salida':estado==='DESVINCULADO'?(data.fechaSalida||new Date()):'',
      'Modificado Por':actor.usuarioId,
      'Ultima Modificacion':new Date()
    });
    clearCaches_();
    seedPermissionForUser_(usuarioId,actor.usuarioId);
    audit_(actor.usuarioId,'CREAR_USUARIO','OK','ADMIN',usuarioId+' · '+nombre);
    return {ok:true,message:'Usuario creado.',usuarioId:usuarioId,tempPassword:temp,requireChange:true,onboarding:{etapa:'CAMBIAR_CLAVE',pasos:['CAMBIAR_CLAVE','FOTO_OBLIGATORIA','PERMISOS','LISTO']}};
  }

  set_(sh,row,m,'Cedula',cedula);
  set_(sh,row,m,'Nombre',nombre);
  set_(sh,row,m,'Codigo Vendedor',codigo);
  set_(sh,row,m,'Rol',rol);
  set_(sh,row,m,'Gerencia ID',finalGerencia);
  set_(sh,row,m,'Coordinador ID',coordinador);
  set_(sh,row,m,'Supervisor ID',supervisor);
  set_(sh,row,m,'Direccion ID',AUTH.DIRECTION_ID);
  set_(sh,row,m,'Estado Personal',estado);
  set_(sh,row,m,'Activo',activo?'SI':'NO');
  set_(sh,row,m,'Fecha Ingreso',data.fechaIngreso||existing?.fechaIngreso||'');
  set_(sh,row,m,'Fecha Salida',estado==='DESVINCULADO'?(data.fechaSalida||new Date()):'');
  set_(sh,row,m,'Modificado Por',actor.usuarioId);
  set_(sh,row,m,'Ultima Modificacion',new Date());

  if(existing && existing.activo!==activo){
    const ver=Number(existing.versionSesion||1)+1;
    set_(sh,row,m,'Version Sesion',ver);
    revokeSessions_(usuarioId,activo?'REACTIVACION':'DESACTIVACION');
  }

  clearCaches_();
  audit_(actor.usuarioId,'EDITAR_USUARIO','OK','ADMIN',usuarioId+' · '+nombre);
  return {ok:true,message:'Personal actualizado.',usuarioId};
}

function adminResetPassword_(token,usuarioId){
  const actor=adminActor_(token),target=getUser_(usuarioId);
  if(!target)throw new Error('Usuario no encontrado.');
  if(!adminCanManage_(actor,target))throw new Error('No puede restablecer la contraseña de este usuario.');

  const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh),row=findRow_(sh,m,'Usuario ID',target.usuarioId);
  const temp=generateTempPassword_(),salt=randomHex_(32),ver=Number(target.versionSesion||1)+1;

  set_(sh,row,m,'Salt',salt);
  set_(sh,row,m,'Clave Hash',hashPassword_(temp,salt));
  set_(sh,row,m,'Version Sesion',ver);
  set_(sh,row,m,'Requiere Cambio Clave','SI');
  set_(sh,row,m,'Modificado Por',actor.usuarioId);
  set_(sh,row,m,'Ultima Modificacion',new Date());

  revokeSessions_(target.usuarioId,'RESET_CLAVE');
  clearCaches_();
  audit_(actor.usuarioId,'RESET_CLAVE','OK','ADMIN',target.usuarioId);
  return {ok:true,message:'Contraseña temporal generada.',tempPassword:temp,requireChange:true};
}

function adminSetAccess_(token,usuarioId,activo){
  const actor=adminActor_(token),target=getUser_(usuarioId);
  if(!target)throw new Error('Usuario no encontrado.');
  if(!adminCanManage_(actor,target))throw new Error('No puede modificar el acceso de este usuario.');

  const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh),row=findRow_(sh,m,'Usuario ID',target.usuarioId);
  const ver=Number(target.versionSesion||1)+1;

  set_(sh,row,m,'Activo',activo?'SI':'NO');
  set_(sh,row,m,'Version Sesion',ver);
  set_(sh,row,m,'Modificado Por',actor.usuarioId);
  set_(sh,row,m,'Ultima Modificacion',new Date());

  revokeSessions_(target.usuarioId,activo?'REACTIVACION':'DESACTIVACION');
  clearCaches_();
  audit_(actor.usuarioId,activo?'ACTIVAR_ACCESO':'DESACTIVAR_ACCESO','OK','ADMIN',target.usuarioId);
  return {ok:true,message:activo?'Acceso activado.':'Acceso desactivado.'};
}

function adminSavePermissions_(token,usuarioId,permissions){
  const actor=adminActor_(token),target=getUser_(usuarioId);
  if(!target)throw new Error('Usuario no encontrado.');
  if(!adminCanManage_(actor,target))throw new Error('No puede modificar los permisos de este usuario.');

  const modules=getModules_(true);
  modules.forEach(m=>{
    if(m.id==='ADMIN'){
      if(norm_(target.rol)==='DIRECTORA')setUserPermission_(target.usuarioId,m.id,true,actor.usuarioId);
      else if(norm_(target.rol)==='GERENTE')setUserPermission_(target.usuarioId,m.id,permissions[m.id]!==false,actor.usuarioId);
      else setUserPermission_(target.usuarioId,m.id,false,actor.usuarioId);
      return;
    }
    if(Object.prototype.hasOwnProperty.call(permissions,m.id)){
      setUserPermission_(target.usuarioId,m.id,!!permissions[m.id],actor.usuarioId);
    }
  });

  revokeSessions_(target.usuarioId,'CAMBIO_PERMISOS');
  clearCaches_();
  audit_(actor.usuarioId,'CAMBIO_PERMISOS','OK','ADMIN',target.usuarioId);
  return {ok:true,message:'Permisos actualizados. El usuario deberá iniciar sesión nuevamente.'};
}

function adminAudit_(token,limit){
  const actor=adminActor_(token);
  limit=Math.max(10,Math.min(300,Number(limit||100)));
  let rows=read_(AUTH.SHEETS.AUDIT).slice(-limit).reverse();

  if(norm_(actor.rol)==='GERENTE'){
    const visible=new Set(getUsers_(true).filter(u=>u.gerenciaId===actor.gerenciaId).map(u=>u.usuarioId));
    visible.add(actor.usuarioId);

    // Falla cerrada: un gerente solo recibe auditoría cuyo actor pertenece
    // a su propia estructura. No se exponen eventos ADMIN de otras gerencias.
    rows=rows.filter(r=>visible.has(text_(r['Usuario ID'])));
  }

  return {ok:true,rows:rows.map(r=>({
    fecha:text_(r['Fecha']),
    usuarioId:text_(r['Usuario ID']),
    accion:text_(r['Accion']),
    estado:text_(r['Estado']),
    modulo:text_(r['Modulo']),
    detalle:text_(r['Detalle'])
  }))};
}

/* Permisos individuales */
function getPermissions_(force){
  const key='AUTH_PERMISSIONS';
  if(!force){
    const hit=cache_().get(key);
    if(hit)try{return JSON.parse(hit);}catch(_){}
  }
  const a=read_(AUTH.SHEETS.PERMISSIONS).map(r=>({
    usuarioId:text_(r['Usuario ID']),
    moduloId:norm_(r['Modulo ID']),
    permitido:truthy_(r['Permitido'])
  }));
  cache_().put(key,JSON.stringify(a),AUTH.CACHE_TTL);
  return a;
}
function getUserPermission_(uid,moduleId){
  const p=getPermissions_().find(x=>x.usuarioId===text_(uid)&&x.moduloId===norm_(moduleId));
  return p?p.permitido:null;
}
function getPermissionsForUser_(uid){
  const out={};
  getModules_(true).forEach(m=>{
    const p=getUserPermission_(uid,m.id);
    const u=getUser_(uid);
    out[m.id]=p===null
      ? !!(u&&m.activo&&(!m.roles.length||m.roles.includes(norm_(u.rol))))
      : p;
  });
  return out;
}
function setUserPermission_(uid,moduleId,permitido,actorId){
  const sh=sheet_(AUTH.SHEETS.PERMISSIONS),m=headerMap_(sh);
  const rows=read_(AUTH.SHEETS.PERMISSIONS);
  let row=0;
  for(let i=0;i<rows.length;i++){
    if(text_(rows[i]['Usuario ID'])===text_(uid)&&norm_(rows[i]['Modulo ID'])===norm_(moduleId)){
      row=i+2;break;
    }
  }
  if(!row){
    append_(sh,{
      'Usuario ID':uid,'Modulo ID':norm_(moduleId),'Permitido':permitido?'SI':'NO',
      'Modificado Por':actorId||'SETUP','Ultima Modificacion':new Date()
    });
  }else{
    set_(sh,row,m,'Permitido',permitido?'SI':'NO');
    set_(sh,row,m,'Modificado Por',actorId||'SETUP');
    set_(sh,row,m,'Ultima Modificacion',new Date());
  }
  cache_().remove('AUTH_PERMISSIONS');
}
function seedPermissions_(){
  getUsers_(true).forEach(u=>seedPermissionForUser_(u.usuarioId,'SETUP'));
}
function seedPermissionForUser_(uid,actorId){
  const u=getUser_(uid);
  if(!u)return;
  getModules_(true).forEach(m=>{
    if(getUserPermission_(uid,m.id)!==null)return;
    const allowed=m.activo&&(!m.roles.length||m.roles.includes(norm_(u.rol)));
    setUserPermission_(uid,m.id,allowed,actorId||'SETUP');
  });
}
function generateTempPassword_(){
  // 64 bits aleatorios aproximados, codificados en hexadecimal y forzados
  // a cambio obligatorio en el primer acceso.
  return 'APS-'+randomHex_(8).toUpperCase();
}
function makeUserId_(nombre){
  const p=text_(nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
  const base=(p[0]||'usuario')+'.'+(p[1]||'aps');
  let id=base,n=2;
  while(getUser_(id)){id=base+n;n++;}
  return id;
}



/* =========================================================
   FOTO DE PERFIL CENTRAL
   AUTH CENTRAL = fuente oficial de fotos
========================================================= */

function profilePhotoFolder_(){
  const props=PropertiesService.getScriptProperties();
  const current=text_(props.getProperty(AUTH_PROFILE.FOLDER_PROPERTY));

  if(current){
    try{return DriveApp.getFolderById(current);}catch(_){}
  }

  const found=DriveApp.getFoldersByName(AUTH_PROFILE.FOLDER_NAME);
  const folder=found.hasNext()
    ? found.next()
    : DriveApp.createFolder(AUTH_PROFILE.FOLDER_NAME);

  props.setProperty(AUTH_PROFILE.FOLDER_PROPERTY,folder.getId());
  return folder;
}

function profileActorTarget_(token,usuarioId,editMode){
  const s=requireSession_(token);
  const actor=getUser_(s.usuarioId);

  if(!actor||!actor.activo){
    throw new Error('Sesión no válida.');
  }

  const targetId=text_(usuarioId)||actor.usuarioId;
  const target=getUser_(targetId);

  if(!target){
    throw new Error('Usuario no encontrado.');
  }

  const self=actor.usuarioId===target.usuarioId;
  const admin=
    ['DIRECTORA','GERENTE'].includes(norm_(actor.rol)) &&
    adminCanManage_(actor,target);

  if(editMode){
    if(!self&&!admin){
      throw new Error('No tiene permiso para modificar esta foto.');
    }
  }else{
    if(!self&&!canSeeUser_(actor,target)){
      throw new Error('No tiene permiso para ver esta foto.');
    }
  }

  return {actor,target};
}

function parseProfileFile_(file){
  file=file||{};
  const mime=text_(file.mimeType).toLowerCase();

  if(!AUTH_PROFILE.ALLOWED_MIME.includes(mime)){
    throw new Error('La foto debe ser JPG, PNG o WEBP.');
  }

  let raw=text_(file.base64);

  if(raw.indexOf(',')!==-1){
    raw=raw.split(',').pop();
  }

  if(!raw){
    throw new Error('La imagen está vacía.');
  }

  let bytes;

  try{
    bytes=Utilities.base64Decode(raw);
  }catch(_){
    throw new Error('La imagen no tiene un formato válido.');
  }

  if(!bytes||!bytes.length){
    throw new Error('La imagen está vacía.');
  }

  if(bytes.length>AUTH_PROFILE.MAX_BYTES){
    throw new Error('La foto es demasiado grande. Usa una imagen menor de 900 KB.');
  }

  const ext=
    mime==='image/png'
      ? '.png'
      : mime==='image/webp'
        ? '.webp'
        : '.jpg';

  return {
    mime:mime,
    bytes:bytes,
    name:'perfil_'+Date.now()+ext
  };
}

function saveProfilePhoto_(token,usuarioId,file){
  const ctx=profileActorTarget_(token,usuarioId,true);
  const parsed=parseProfileFile_(file);
  const folder=profilePhotoFolder_();

  const blob=Utilities.newBlob(
    parsed.bytes,
    parsed.mime,
    ctx.target.usuarioId+'_'+parsed.name
  );

  const newFile=folder.createFile(blob);

  const sh=sheet_(AUTH.SHEETS.USERS);
  const map=headerMap_(sh);
  const row=findRow_(sh,map,'Usuario ID',ctx.target.usuarioId);

  if(!row){
    try{newFile.setTrashed(true);}catch(_){}
    throw new Error('No se pudo localizar el usuario.');
  }

  const oldId=text_(get_(sh,row,map,'Foto File ID'));
  const now=new Date();

  set_(sh,row,map,'Foto File ID',newFile.getId());
  set_(sh,row,map,'Foto Mime',parsed.mime);
  set_(sh,row,map,'Foto Actualizada',now);
  set_(sh,row,map,'Foto Version',Number(ctx.target.fotoVersion||0)+1);
  set_(sh,row,map,'Modificado Por',ctx.actor.usuarioId);
  set_(sh,row,map,'Ultima Modificacion',now);

  if(oldId&&oldId!==newFile.getId()){
    try{DriveApp.getFileById(oldId).setTrashed(true);}catch(_){}
  }

  clearCaches_();

  audit_(
    ctx.actor.usuarioId,
    'FOTO_GUARDAR',
    'OK',
    'AUTH',
    ctx.target.usuarioId
  );

  return {
    ok:true,
    message:'Foto central actualizada.',
    user:publicUser_(getUser_(ctx.target.usuarioId))
  };
}

function deleteProfilePhoto_(token,usuarioId){
  const ctx=profileActorTarget_(token,usuarioId,true);

  const sh=sheet_(AUTH.SHEETS.USERS);
  const map=headerMap_(sh);
  const row=findRow_(sh,map,'Usuario ID',ctx.target.usuarioId);

  if(!row){
    throw new Error('Usuario no encontrado.');
  }

  const oldId=text_(get_(sh,row,map,'Foto File ID'));

  if(oldId){
    try{DriveApp.getFileById(oldId).setTrashed(true);}catch(_){}
  }

  const now=new Date();

  set_(sh,row,map,'Foto File ID','');
  set_(sh,row,map,'Foto Mime','');
  set_(sh,row,map,'Foto Actualizada',now);
  set_(sh,row,map,'Foto Version',Number(ctx.target.fotoVersion||0)+1);
  set_(sh,row,map,'Modificado Por',ctx.actor.usuarioId);
  set_(sh,row,map,'Ultima Modificacion',now);

  clearCaches_();

  audit_(
    ctx.actor.usuarioId,
    'FOTO_ELIMINAR',
    'OK',
    'AUTH',
    ctx.target.usuarioId
  );

  return {
    ok:true,
    message:'Foto central eliminada.'
  };
}

function profilePhotoMeta_(token,usuarioId){
  const ctx=profileActorTarget_(token,usuarioId,false);
  return {ok:true,usuarioId:ctx.target.usuarioId,disponible:!!ctx.target.fotoFileId,fotoActualizada:ctx.target.fotoActualizada||'',fotoVersion:Number(ctx.target.fotoVersion||0)};
}

function profilePhoto_(token,usuarioId){
  const ctx=profileActorTarget_(token,usuarioId,false);

  if(!ctx.target.fotoFileId){
    return {
      ok:true,
      disponible:false,
      usuarioId:ctx.target.usuarioId,
      nombre:ctx.target.nombre,
      rol:ctx.target.rol
    };
  }

  let file;

  try{
    file=DriveApp.getFileById(ctx.target.fotoFileId);
  }catch(_){
    return {
      ok:true,
      disponible:false,
      usuarioId:ctx.target.usuarioId,
      nombre:ctx.target.nombre,
      rol:ctx.target.rol
    };
  }

  const blob=file.getBlob();
  const bytes=blob.getBytes();

  if(bytes.length>AUTH_PROFILE.MAX_BYTES){
    throw new Error('La foto central excede el tamaño permitido.');
  }

  const mime=
    blob.getContentType() ||
    ctx.target.fotoMime ||
    'image/jpeg';

  return {
    ok:true,
    disponible:true,
    usuarioId:ctx.target.usuarioId,
    nombre:ctx.target.nombre,
    rol:ctx.target.rol,
    fotoActualizada:ctx.target.fotoActualizada||'',
    fotoVersion:Number(ctx.target.fotoVersion||0),
    dataUrl:'data:'+mime+';base64,'+Utilities.base64Encode(bytes)
  };
}


/* Sessions */
function cacheSession_(h,s){cache_().put('AUTH_SES_'+h,JSON.stringify(s),Math.max(60,Math.min(AUTH.CACHE_TTL,Math.floor((s.expira-Date.now())/1000))));}
function touchSession_(s){
  // El último uso es informativo; no afecta a la expiración ni a la revocación.
  // Una escritura de Sheets por cada validate/modules ralentizaba cada módulo.
  try{
    const cache=cache_(), key='AUTH_LAST_TOUCH_'+s.sesionId;
    if(cache.get(key))return;
    const sh=sheet_(AUTH.SHEETS.SESSIONS),m=headerMap_(sh),r=findRow_(sh,m,'Sesion ID',s.sesionId);
    if(r){set_(sh,r,m,'Ultimo Uso',new Date());cache.put(key,'1',300);}
  }catch(_){}
}
function revokeSessions_(uid,reason){const sh=sheet_(AUTH.SHEETS.SESSIONS),m=headerMap_(sh);if(sh.getLastRow()<2)return;for(let r=2;r<=sh.getLastRow();r++){if(text_(get_(sh,r,m,'Usuario ID'))===uid&&truthy_(get_(sh,r,m,'Activo'))){const h=text_(get_(sh,r,m,'Token Hash'));set_(sh,r,m,'Activo','NO');set_(sh,r,m,'Motivo Cierre',reason);if(h)cache_().remove('AUTH_SES_'+h);}}}


/* Protección contra intentos repetidos de inicio de sesión.
 * CacheService es una defensa de disponibilidad/best-effort; no sustituye
 * controles de identidad ni cambia permisos existentes.
 */
function loginFailureKey_(cedula){
  return 'AUTH_LOGIN_FAIL_'+tokenHash_(String(cedula||''));
}
function getLoginFailureState_(cedula){
  try{
    const raw=cache_().get(loginFailureKey_(cedula));
    return raw?JSON.parse(raw):{count:0,blockedUntil:0};
  }catch(_){return {count:0,blockedUntil:0};}
}
function assertLoginAllowed_(cedula){
  const s=getLoginFailureState_(cedula);
  if(Number(s.blockedUntil||0)>Date.now()){
    throw new Error('Demasiados intentos fallidos. Espera unos minutos antes de intentarlo nuevamente.');
  }
}
function recordLoginFailure_(cedula){
  try{
    const key=loginFailureKey_(cedula),s=getLoginFailureState_(cedula);
    s.count=Number(s.count||0)+1;
    if(s.count>=AUTH_SECURITY.LOGIN_MAX_FAILURES){
      s.blockedUntil=Date.now()+AUTH_SECURITY.LOGIN_BLOCK_SECONDS*1000;
    }
    cache_().put(key,JSON.stringify(s),AUTH_SECURITY.LOGIN_FAILURE_TTL_SECONDS);
  }catch(_){}
}
function clearLoginFailures_(cedula){
  try{cache_().remove(loginFailureKey_(cedula));}catch(_){}
}

/* Crypto */
function authPepper_(){
  const props=PropertiesService.getScriptProperties();
  let pepper=text_(props.getProperty(AUTH_SECURITY.PASSWORD_PEPPER_PROPERTY));
  if(pepper)return pepper;

  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try{
    pepper=text_(props.getProperty(AUTH_SECURITY.PASSWORD_PEPPER_PROPERTY));
    if(!pepper){
      pepper=randomHex_(32);
      props.setProperty(AUTH_SECURITY.PASSWORD_PEPPER_PROPERTY,pepper);
    }
    return pepper;
  }finally{lock.releaseLock();}
}
function derivePasswordHash_(p,salt,pepper,rounds){
  let v=String(salt)+'|'+String(p)+'|'+String(pepper||'');
  for(let i=0;i<Number(rounds||AUTH.HASH_ROUNDS);i++){
    const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v,Utilities.Charset.UTF_8);
    v=b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('');
  }
  return v;
}
function legacyHashPassword_(p,salt){
  let v=String(salt)+'|'+String(p);
  for(let i=0;i<AUTH_SECURITY.LEGACY_HASH_ROUNDS;i++){
    const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v,Utilities.Charset.UTF_8);
    v=b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('');
  }
  return v;
}
function hashPassword_(p,salt){
  return 'v2$'+derivePasswordHash_(p,salt,authPepper_(),AUTH.HASH_ROUNDS);
}
function verifyPassword_(p,u){
  if(!u||!u.salt||!u.claveHash)return false;
  const stored=String(u.claveHash||'');
  if(stored.indexOf('v2$')===0){
    return hashPassword_(p,u.salt)===stored;
  }
  return legacyHashPassword_(p,u.salt)===stored;
}
function upgradePasswordHashIfLegacy_(p,u){
  try{
    if(!u||!u.salt||!u.claveHash||String(u.claveHash).indexOf('v2$')===0)return false;
    if(legacyHashPassword_(p,u.salt)!==String(u.claveHash))return false;
    const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh),row=findRow_(sh,m,'Usuario ID',u.usuarioId);
    if(!row)return false;
    set_(sh,row,m,'Clave Hash',hashPassword_(p,u.salt));
    set_(sh,row,m,'Modificado Por','MIGRACION_HASH_V2');
    set_(sh,row,m,'Ultima Modificacion',new Date());
    clearCaches_();
    audit_(u.usuarioId,'MIGRAR_HASH','OK','AUTH','Hash de contraseña actualizado a v2 con pepper');
    return true;
  }catch(_){return false;}
}
function createToken_(){return 'APS.'+Utilities.getUuid().replace(/-/g,'')+'.'+randomHex_(32)+'.'+Date.now().toString(36);}
function tokenHash_(t){t=text_(t);if(!t)return'';const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,t,Utilities.Charset.UTF_8);return b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('');}
function randomHex_(n){let s='';while(s.length<n*2)s+=Utilities.getUuid().replace(/-/g,'');return s.slice(0,n*2);}

/* Sheets */
function validateConfig_(){if(!AUTH.SPREADSHEET_ID||AUTH.SPREADSHEET_ID==='PEGAR_ID_SPREADSHEET_AUTH_CENTRAL')throw new Error('Crea el Sheet de APS AUTH CENTRAL y pega su ID en AUTH.SPREADSHEET_ID.');}
function ss_(){validateConfig_();return SpreadsheetApp.openById(AUTH.SPREADSHEET_ID);}
function sheet_(n){const sh=ss_().getSheetByName(n);if(!sh)throw new Error('Falta hoja '+n+'. Ejecuta setupApsAuthCentral().');return sh;}
function ensureSheet_(n,headers){const ss=ss_();let sh=ss.getSheetByName(n);if(!sh)sh=ss.insertSheet(n);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);else{const cur=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],norm=cur.map(normHeader_),miss=headers.filter(h=>!norm.includes(normHeader_(h)));if(miss.length)sh.getRange(1,sh.getLastColumn()+1,1,miss.length).setValues([miss]);}sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFF');sh.setFrozenRows(1);return sh;}
function ensureCedulaText_(){const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh),i=m[normHeader_('Cedula')];if(i!==undefined)sh.getRange(1,i+1,Math.max(50,sh.getMaxRows()),1).setNumberFormat('@');}
function headerMap_(sh){const h=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getDisplayValues()[0],m={};h.forEach((x,i)=>m[normHeader_(x)]=i);return m;}
function append_(sh,o){const m=headerMap_(sh),r=Array(sh.getLastColumn()).fill('');Object.keys(o).forEach(k=>{const i=m[normHeader_(k)];if(i!==undefined)r[i]=o[k];});sh.appendRow(r);}
function set_(sh,r,m,k,v){const i=m[normHeader_(k)];if(i!==undefined)sh.getRange(r,i+1).setValue(v);}
function get_(sh,r,m,k){const i=m[normHeader_(k)];return i===undefined?'':sh.getRange(r,i+1).getValue();}
function findRow_(sh,m,k,v){const i=m[normHeader_(k)];if(i===undefined||sh.getLastRow()<2)return 0;const a=sh.getRange(2,i+1,sh.getLastRow()-1,1).getDisplayValues().flat(),t=text_(v);for(let x=0;x<a.length;x++)if(text_(a[x])===t)return x+2;return 0;}
function read_(n){const sh=sheet_(n);if(sh.getLastRow()<2)return[];const a=sh.getDataRange().getDisplayValues(),h=a[0];return a.slice(1).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o;});}
function rowObj_(sh,r){const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],a=sh.getRange(r,1,1,sh.getLastColumn()).getDisplayValues()[0],o={};h.forEach((x,i)=>o[x]=a[i]);return o;}

/* Misc */
function updateLastAccess_(uid){try{const sh=sheet_(AUTH.SHEETS.USERS),m=headerMap_(sh),r=findRow_(sh,m,'Usuario ID',uid);if(r)set_(sh,r,m,'Ultimo Acceso',new Date());}catch(_){}}
function audit_(uid,action,status,module,detail){try{append_(sheet_(AUTH.SHEETS.AUDIT),{'Fecha':new Date(),'Usuario ID':uid,'Accion':action,'Estado':status,'Modulo':module,'Detalle':detail});}catch(_){}}
function clearCaches_(){cache_().remove('AUTH_USERS');cache_().remove('AUTH_MODULES');cache_().remove('AUTH_PERMISSIONS');}
function cache_(){return CacheService.getScriptCache();}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function text_(v){return v===null||v===undefined?'':String(v).trim();}
function digits_(v){return text_(v).replace(/\D/g,'');}
function cedula11_(v){const d=digits_(v);return d?d.padStart(11,'0').slice(-11):'';}
function norm_(v){return text_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function normHeader_(v){return norm_(v).replace(/[^A-Z0-9]/g,'');}
function truthy_(v){return ['SI','SÍ','TRUE','1','ACTIVO','YES'].includes(norm_(v));}
function parseDate_(v){if(!v)return null;if(v instanceof Date&&!isNaN(v))return v;const d=new Date(v);return isNaN(d)?null:d;}

