/**
 * APS NOTIFICACIONES CENTRAL v1.0
 * Proyecto independiente: lee Productividad, Carnets APS Pro, Visitas y Validar RNC
 * sin modificar los módulos de origen.
 */
const APSN = Object.freeze({
  VERSION:'APS-NOTIFICACIONES-CENTRAL-1.8-CORREGIDO-C7-2026.10.16',
  TZ:'America/Santo_Domingo',
  DB_PROPERTY:'APS_NOTIF_DB_ID',
  AUTH_URL_PROPERTY:'APS_AUTH_CENTRAL_URL',
  RNC_ID_PROPERTY:'APS_RNC_SPREADSHEET_ID',
  PUSH_ENDPOINT_PROPERTY:'APS_PUSH_ENDPOINT',
  PUSH_SECRET_PROPERTY:'APS_PUSH_SECRET',
  PUSH_BROADCAST_DEFAULT:'https://negocios-aps-xyz.web.app/api/push-broadcast',
  AUTH_URL_DEFAULT:'https://script.google.com/macros/s/AKfycbxV3ms4ylr5vPd-UCR22hJ0ZhKxtjOE4tdcOcELdoIK9O33PxbSxkX6oCMSh_EkTUNEGw/exec',
  SCAN_TAIL_ROWS:400,
  MAX_FEED:150,
  MAX_UNREAD_SCAN:1000,
  STORE_RAW_JSON:false,
  CENTRAL_SHEETS:{
    NOTIFICACIONES:'NOTIFICACIONES',
    LECTURAS:'LECTURAS',
    ESTADO:'ESTADO_ORIGEN',
    FUENTES:'ESTADO_FUENTES'
  },
  SOURCES:{
    PRODUCTIVIDAD:{
      id:'PRODUCTIVIDAD', nombre:'Productividad',
      spreadsheetId:'158tXFc0E4f9dIvA5PuezB-S7rcmAXu6WJSTubtDMQW4',
      sheets:[
        {name:'PRODUCCION_ARS',modulo:'ARS',tipo:'PRODUCCION_ARS',tituloNuevo:'Nueva producción ARS'},
        {name:'AFILIACIONES_ARS',modulo:'ARS',tipo:'AFILIACION_ARS',tituloNuevo:'Nueva afiliación ARS'},
        {name:'AFILIACIONES_EXTERNAS',modulo:'ARS',tipo:'AFILIACION_EXTERNA',tituloNuevo:'Nueva afiliación externa'},
        {name:'PRODUCCION_AFP',modulo:'AFP_RENTA',tipo:'PRODUCCION_AFP',tituloNuevo:'Nueva producción AFP / Renta'},
        {name:'PRODUCCION_SEGUROS',modulo:'SEGUROS',tipo:'PRODUCCION_SEGUROS',tituloNuevo:'Nueva producción de Seguros'}
      ]
    },
    CARNETS:{
      id:'CARNETS', nombre:'Carnets APS Pro',
      spreadsheetId:'127iSwFiLQ6rW7be7p2x7UI9aIsHe7RnD5OZZkixOqFQ',
      sheets:[
        {name:'Solicitudes carnet',modulo:'CARNETS',tipo:'SOLICITUD_CARNET',tituloNuevo:'Nueva solicitud de carnet'},
        {name:'Entrega Empresas',modulo:'CARNETS',tipo:'ENTREGA_EMPRESA',tituloNuevo:'Entrega de carnets a empresa'},
        {name:'Entrega Afiliados',modulo:'CARNETS',tipo:'ENTREGA_AFILIADO',tituloNuevo:'Entrega de carnet a afiliado'}
      ]
    },
    VISITAS:{
      id:'VISITAS', nombre:'Visitas',
      spreadsheetId:'1zdDQ_SZDd6B4U7tdNefJ8f7X4aoeRwWmVqtVp6Q0JNs',
      sheets:[
        {name:'BD_VISITAS',modulo:'VISITAS',tipo:'VISITA',tituloNuevo:'Nueva visita registrada'},
        {name:'BD_CITAS',modulo:'VISITAS',tipo:'CITA',tituloNuevo:'Nueva cita comercial'},
        {name:'BD_PREVISITAS',modulo:'VISITAS',tipo:'LEVANTAMIENTO',tituloNuevo:'Nuevo levantamiento comercial'}
      ]
    },
    RNC:{
      id:'RNC', nombre:'Validar RNC',
      spreadsheetId:'13VWTyqBV6L3Dz_4Eg8cqNk9mOs2u6PkWjDsEladiHPw',
      webappUrl:'https://script.google.com/macros/s/AKfycbzY9pXzV9X6WF-3ITXyiF0t3UoriFrME67ArjtDl1IRQ7A5H23XuzKfBd6PdAjUvcv_YA/exec',
      sheets:[
        {name:'Solicitudes',modulo:'RNC',tipo:'SOLICITUD_RNC',tituloNuevo:'Nueva solicitud de Validar RNC'}
      ]
    }
  }
});

function doGet(e){
  var t=HtmlService.createTemplateFromFile('Index');
  t.apsToken=String(e&&e.parameter&&e.parameter.aps_token?e.parameter.aps_token:'');
  return t.evaluate()
    .setTitle('APS · Notificaciones')
    .addMetaTag('viewport','width=device-width,initial-scale=1,viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ========================= INSTALACIÓN ========================= */
function setupNotificacionesCentral(){
  var db=getCentralDb_(true);
  ensureCentralSheet_(db,APSN.CENTRAL_SHEETS.NOTIFICACIONES,[
    'ID','FECHA_DETECTADA','FUENTE','MODULO','HOJA','TIPO','TITULO','DETALLE',
    'ACTOR_ID','ACTOR_NOMBRE','GERENCIA_ID','COORDINADOR_ID','REGISTRO_ID',
    'ACCION','HASH','FILA_ORIGEN','DATOS_JSON','SUPERVISOR_ID'
  ]);
  ensureCentralSheet_(db,APSN.CENTRAL_SHEETS.LECTURAS,['USUARIO_ID','NOTIFICACION_ID','FECHA_LECTURA']);
  ensureCentralSheet_(db,APSN.CENTRAL_SHEETS.ESTADO,['CLAVE','FINGERPRINT','FECHA','FUENTE','HOJA','REGISTRO_ID']);
  ensureCentralSheet_(db,APSN.CENTRAL_SHEETS.FUENTES,['FUENTE','ULTIMA_REVISION','OK','MENSAJE','FILAS_REVISADAS','EVENTOS']);
  instalarTrigger_();
  var baseline=sincronizarFuentes_(true);
  var out={ok:true,version:APSN.VERSION,databaseId:db.getId(),databaseUrl:db.getUrl(),trigger:'cada 1 minuto',baseline:baseline,rncConfigurado:!!getRncSpreadsheetId_()};
  console.log(JSON.stringify(out,null,2));
  return out;
}

function instalarTrigger_(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='procesarFuentesNotificaciones') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('procesarFuentesNotificaciones').timeBased().everyMinutes(1).create();
}

function configurarFuenteRnc(spreadsheetId){
  var id=String(spreadsheetId||'').trim();
  if(!id){
    PropertiesService.getScriptProperties().deleteProperty(APSN.RNC_ID_PROPERTY);
    return {ok:true,activo:false,message:'Fuente RNC desactivada.'};
  }
  var ss=SpreadsheetApp.openById(id);
  PropertiesService.getScriptProperties().setProperty(APSN.RNC_ID_PROPERTY,ss.getId());
  return {
    ok:true,
    activo:true,
    spreadsheetId:ss.getId(),
    spreadsheetName:ss.getName(),
    hojas:ss.getSheets().map(function(s){return s.getName();}),
    hojaMonitoreada:'Solicitudes'
  };
}


function ensureNotificationSchema_(db){
  return ensureCentralSheet_(db,APSN.CENTRAL_SHEETS.NOTIFICACIONES,[
    'ID','FECHA_DETECTADA','FUENTE','MODULO','HOJA','TIPO','TITULO','DETALLE',
    'ACTOR_ID','ACTOR_NOMBRE','GERENCIA_ID','COORDINADOR_ID','REGISTRO_ID',
    'ACCION','HASH','FILA_ORIGEN','DATOS_JSON','SUPERVISOR_ID'
  ]);
}

/* ========================= MOTOR ========================= */
function procesarFuentesNotificaciones(){
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(25000)) return {ok:false,message:'Ya existe una sincronización en curso.'};
  try{return sincronizarFuentes_(false);}finally{lock.releaseLock();}
}

function sincronizarFuentes_(baseline){
  var db=getCentralDb_(true);
  ensureNotificationSchema_(db);
  var directory=getUserDirectory_(), state=loadStateStore_(db);
  var totalEventos=0,totalRevisadas=0,sourceResults=[];
  var sources=[APSN.SOURCES.PRODUCTIVIDAD,APSN.SOURCES.CARNETS,APSN.SOURCES.VISITAS];
  var rncId=getRncSpreadsheetId_();
  if(rncId){
    sources.push({
      id:'RNC',
      nombre:'Validar RNC',
      spreadsheetId:rncId,
      sheets:APSN.SOURCES.RNC.sheets
    });
  }

  sources.forEach(function(source){
    var started=new Date();
    try{
      var ss=SpreadsheetApp.openById(source.spreadsheetId);
      var descriptors=(source.sheets&&source.sheets.length)
        ? source.sheets
        : (source.autoDetectRnc?detectRncSheets_(ss):[]);
      var checked=0,events=0;
      descriptors.forEach(function(desc){
        var sh=ss.getSheetByName(desc.name);
        if(!sh||sh.getLastRow()<2||sh.getLastColumn()<1) return;
        var r=scanSourceSheet_(source,desc,sh,state,directory,baseline,db);
        checked+=r.checked; events+=r.events;
      });
      totalRevisadas+=checked; totalEventos+=events;
      sourceResults.push({fuente:source.id,ok:true,checked:checked,events:events});
      saveSourceStatus_(db,source.id,started,true,baseline?'Línea base actualizada.':'Lectura correcta.',checked,events);
    }catch(e){
      sourceResults.push({fuente:source.id,ok:false,error:e.message||String(e)});
      saveSourceStatus_(db,source.id,started,false,e.message||String(e),0,0);
    }
  });
  flushStateStore_(db,state);
  return {ok:true,baseline:!!baseline,checked:totalRevisadas,events:totalEventos,sources:sourceResults,at:formatDateTime_(new Date())};
}

function scanSourceSheet_(source,desc,sh,state,directory,baseline,db){
  var lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
  var startRow=Math.max(2,lastRow-APSN.SCAN_TAIL_ROWS+1),count=lastRow-startRow+1;
  if(count<=0) return {checked:0,events:0};

  var headers=sh.getRange(1,1,1,lastCol).getDisplayValues()[0];
  var values=sh.getRange(startRow,1,count,lastCol).getDisplayValues(),events=0;

  for(var i=0;i<values.length;i++){
    var rowNum=startRow+i,row=rowToObject_(headers,values[i]);
    if(rowIsEmpty_(row)) continue;
    var recordId=getRecordId_(row,rowNum),stateKey=source.id+'|'+desc.name+'|'+recordId;
    var fingerprint=hashObject_(row),old=state.map[stateKey];

    if(!old){
      state.add(stateKey,fingerprint,source.id,desc.name,recordId);
      if(!baseline){
        var en=buildEvent_(source,desc,row,rowNum,recordId,'CREADO',directory);
        if(saveNotification_(db,en)){events++;tryDispatchPush_(en,directory,db);}
      }
      continue;
    }
    if(old.fingerprint!==fingerprint){
      state.update(stateKey,fingerprint);
      if(!baseline){
        var eu=buildEvent_(source,desc,row,rowNum,recordId,'ACTUALIZADO',directory);
        if(saveNotification_(db,eu)){events++;tryDispatchPush_(eu,directory,db);}
      }
    }
  }
  return {checked:values.length,events:events};
}

/* ========================= RNC OPCIONAL ========================= */
function getRncSpreadsheetId_(){
  return String(
    PropertiesService.getScriptProperties().getProperty(APSN.RNC_ID_PROPERTY) ||
    APSN.SOURCES.RNC.spreadsheetId ||
    ''
  ).trim();
}
function detectRncSheets_(ss){
  return ss.getSheets().filter(function(sh){
    var n=normalize_(sh.getName());
    return n.indexOf('RNC')>=0||n.indexOf('CONSULT')>=0||n.indexOf('VALID')>=0||n.indexOf('AUDITOR')>=0||n.indexOf('LOG')>=0;
  }).map(function(sh){
    return {name:sh.getName(),modulo:'RNC',tipo:'VALIDACION_RNC',tituloNuevo:'Nueva validación de RNC'};
  });
}

/* ========================= EVENTOS ========================= */
function buildEvent_(source,desc,row,rowNum,recordId,accion,directory){
  var actorId=firstValue_(row,['USUARIO ID','USUARIO_ID','GESTOR_ID','CREADO POR ID','CREADO_POR_ID','REGISTRADOPOR','REGISTRADO POR','SOLICITANTE ID','USUARIO']);
  var actorName=firstValue_(row,['REPRESENTANTE ARS','REPRESENTANTE_ARS','GESTOR','GESTOR NOMBRE','GESTOR_NOMBRE','SOLICITANTE','REGISTRADOPOR','REGISTRADO POR','USUARIO NOMBRE','USUARIO_NOMBRE','NOMBRE']);
  var gerenciaId=firstValue_(row,['GERENCIA_ID','GERENCIA ID','GERENCIA','ESTRUCTURA']);
  var coordinatorId=firstValue_(row,['COORDINADOR_ID','COORDINADOR ID','COORDINADOR']);
  var supervisorId=firstValue_(row,['SUPERVISOR_ID','SUPERVISOR ID','SUPERVISOR']);
  var managerId=firstValue_(row,['GERENTE ID','GERENTE_ID']);
  var resolved=resolveActor_(actorId,actorName,directory);
  var managerResolved=managerId?resolveActor_(managerId,'',directory):null;
  if(!actorId&&resolved) actorId=resolved.usuarioId||'';
  if(!actorName&&resolved) actorName=resolved.nombre||'';
  if(!gerenciaId&&resolved) gerenciaId=resolved.gerenciaId||'';
  if(!gerenciaId&&managerResolved) gerenciaId=managerResolved.gerenciaId||'';
  if(!coordinatorId&&resolved) coordinatorId=resolved.coordinadorId||'';
  if(!supervisorId&&resolved) supervisorId=resolved.supervisorId||'';

  var title=accion==='CREADO'?desc.tituloNuevo:updatedTitle_(desc,row);
  var detail=buildDetail_(source.id,desc,row,actorName);
  var rawHash=hashObject_(row);
  return {
    id:'NTF-'+Utilities.getUuid(),fecha:new Date(),fuente:source.id,modulo:desc.modulo||source.id,
    hoja:desc.name,tipo:desc.tipo||source.id,titulo:title,detalle:detail,
    actorId:String(actorId||''),actorName:String(actorName||''),gerenciaId:String(gerenciaId||''),
    coordinadorId:String(coordinatorId||''),supervisorId:String(supervisorId||''),registroId:String(recordId||''),accion:accion,
    hash:hashText_(source.id+'|'+desc.name+'|'+recordId+'|'+accion+'|'+rawHash),
    filaOrigen:rowNum,raw:row
  };
}

function updatedTitle_(desc,row){
  var status=firstValue_(row,['STATUS','ESTATUS','ESTADO','RESULTADO','FASE']);
  if(status){
    if(desc.tipo==='SOLICITUD_CARNET') return 'Carnetización · '+status;
    return (desc.tituloNuevo||'Registro actualizado')+' · '+status;
  }
  return (desc.tituloNuevo||'Registro')+' actualizado';
}

function buildDetail_(sourceId,desc,row,actorName){
  var empresa=firstValue_(row,['NOMBRE_RAZON_SOCIAL','NOMBRE RAZON SOCIAL','EMPRESA','RAZON SOCIAL','RAZÓN SOCIAL']);
  var titular=firstValue_(row,['TITULAR','NOMBRE AFILIADO','NOMBRE','AFILIADO']);
  var tipoGestion=firstValue_(row,['TIPO_GESTION','TIPO GESTION','TIPO','PRODUCTO','PRODUCTOS_SERVICIOS_VENDIDOS']);
  var status=firstValue_(row,['STATUS','ESTATUS','ESTADO','RESULTADO']);
  var cantidad=firstValue_(row,['TOTAL','CANTIDAD','CANTIDAD CARNETS','CANT_CARNETS','ENTREGA']);
  var rnc=firstValue_(row,['RNC']),cedula=firstValue_(row,['CEDULA','CÉDULA','CEDULA TITULAR','CÉDULATITULAR']);
  var parts=[];
  if(actorName) parts.push(actorName);
  if(tipoGestion) parts.push(tipoGestion);
  if(empresa) parts.push(empresa); else if(titular) parts.push(titular);
  if(rnc) parts.push('RNC '+rnc); else if(cedula) parts.push('Céd. '+maskId_(cedula));
  if(cantidad) parts.push('Total '+cantidad);
  if(status) parts.push(status);
  return parts.length?parts.join(' · '):(sourceId+' · '+desc.name);
}

/* ========================= DIRECTORIO ========================= */
function getUserDirectory_(){
  var out={byId:{},byName:{}};
  try{
    var ss=SpreadsheetApp.openById(APSN.SOURCES.PRODUCTIVIDAD.spreadsheetId);
    var sh=ss.getSheetByName('USUARIOS_APS');
    if(!sh||sh.getLastRow()<2) return out;
    var vals=sh.getDataRange().getDisplayValues(),headers=vals[0];
    for(var i=1;i<vals.length;i++){
      var row=rowToObject_(headers,vals[i]);
      var u={
        usuarioId:firstValue_(row,['USUARIO ID','USUARIO_ID','USUARIO']),
        nombre:firstValue_(row,['NOMBRE']),
        rol:firstValue_(row,['ROL']),
        gerenciaId:firstValue_(row,['GERENCIA ID','GERENCIA_ID','GERENCIA']),
        coordinadorId:firstValue_(row,['COORDINADOR ID','COORDINADOR_ID','COORDINADOR']),
        supervisorId:firstValue_(row,['SUPERVISOR ID','SUPERVISOR_ID','SUPERVISOR'])
      };
      if(u.usuarioId) out.byId[normalize_(u.usuarioId)]=u;
      if(u.nombre) out.byName[normalize_(u.nombre)]=u;
    }
  }catch(_){}
  return out;
}
function resolveActor_(actorId,actorName,directory){
  if(actorId&&directory.byId[normalize_(actorId)]) return directory.byId[normalize_(actorId)];
  if(actorName&&directory.byName[normalize_(actorName)]) return directory.byName[normalize_(actorName)];
  return null;
}

/* ========================= GUARDADO ========================= */
function saveNotification_(db,event){
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.NOTIFICACIONES),lastRow=sh.getLastRow();
  if(lastRow>1){
    var start=Math.max(2,lastRow-300);
    var hashes=sh.getRange(start,15,lastRow-start+1,1).getDisplayValues().map(function(r){return r[0];});
    if(hashes.indexOf(event.hash)>=0) return false;
  }
  sh.appendRow([
    event.id,event.fecha,event.fuente,event.modulo,event.hoja,event.tipo,event.titulo,event.detalle,
    event.actorId,event.actorName,event.gerenciaId,event.coordinadorId,event.registroId,event.accion,
    event.hash,event.filaOrigen,APSN.STORE_RAW_JSON?JSON.stringify(event.raw||{}):'',event.supervisorId||''
  ]);
  return true;
}

function getSourceConfig_(sourceId){
  var id=String(sourceId||'').toUpperCase();
  return APSN.SOURCES[id]||null;
}

function getSourceName_(sourceId){
  var s=getSourceConfig_(sourceId);
  return s&&s.nombre?s.nombre:String(sourceId||'');
}

function getSourceWebappUrl_(sourceId){
  var s=getSourceConfig_(sourceId);
  return s&&s.webappUrl?String(s.webappUrl):'';
}

/* ========================= FEED / LECTURAS ========================= */
function getBootGAS(token){
  var user=requireCentralUser_(token);
  return {ok:true,version:APSN.VERSION,user:user,unread:getUnreadCountForUser_(user),notifications:getNotificationsForUser_(user,APSN.MAX_FEED,false),sources:getSourcesStatus_()};
}
function getNotificationsGAS(token,limit,onlyUnread){
  var user=requireCentralUser_(token);
  return {ok:true,unread:getUnreadCountForUser_(user),notifications:getNotificationsForUser_(user,Math.min(Number(limit||APSN.MAX_FEED),APSN.MAX_FEED),!!onlyUnread)};
}

function getNotificationsForUser_(user,limit,onlyUnread){
  var db=getCentralDb_(false); if(!db) return [];
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.NOTIFICACIONES); if(!sh||sh.getLastRow()<2) return [];
  var reads=getReadSet_(db,user.usuarioId),lastRow=sh.getLastRow(),start=Math.max(2,lastRow-1000);
  var data=sh.getRange(start,1,lastRow-start+1,18).getValues(),result=[];
  for(var i=data.length-1;i>=0;i--){
    var r=data[i],event={
      id:String(r[0]||''),fecha:formatDateTime_(r[1]),fuente:String(r[2]||''),modulo:String(r[3]||''),
      hoja:String(r[4]||''),tipo:String(r[5]||''),titulo:String(r[6]||''),detalle:String(r[7]||''),
      actorId:String(r[8]||''),actorName:String(r[9]||''),gerenciaId:String(r[10]||''),
      coordinadorId:String(r[11]||''),registroId:String(r[12]||''),accion:String(r[13]||''),
      supervisorId:String(r[17]||''),leida:!!reads[String(r[0]||'')]
    };
    event.fuenteNombre=getSourceName_(event.fuente);
    event.url=getSourceWebappUrl_(event.fuente);
    if(!viewerCanSee_(user,event)) continue;
    if(onlyUnread&&event.leida) continue;
    result.push(event); if(result.length>=limit) break;
  }
  return result;
}

function markReadGAS(token,notificationId){
  var user=requireCentralUser_(token),id=String(notificationId||'').trim();
  if(!id) return {ok:false,message:'Notificación requerida.'};

  var visible=getNotificationsForUser_(user,APSN.MAX_UNREAD_SCAN,false)
    .some(function(n){return String(n.id||'')===id;});
  if(!visible) return {ok:false,message:'La notificación no existe o no está disponible para este usuario.'};

  var db=getCentralDb_(true),sh=db.getSheetByName(APSN.CENTRAL_SHEETS.LECTURAS),set=getReadSet_(db,user.usuarioId);
  if(!set[id]) sh.appendRow([user.usuarioId,id,new Date()]);
  return {ok:true,unread:getUnreadCountForUser_(user)};
}

function markAllReadGAS(token){
  var user=requireCentralUser_(token),db=getCentralDb_(true),sh=db.getSheetByName(APSN.CENTRAL_SHEETS.LECTURAS);
  var current=getReadSet_(db,user.usuarioId),visible=getNotificationsForUser_(user,APSN.MAX_UNREAD_SCAN,false),rows=[];
  visible.forEach(function(n){if(!current[n.id]) rows.push([user.usuarioId,n.id,new Date()]);});
  if(rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length,3).setValues(rows);
  return {ok:true,unread:getUnreadCountForUser_(user),marked:rows.length};
}

function getReadSet_(db,usuarioId){
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.LECTURAS),out={};
  if(!sh||sh.getLastRow()<2) return out;
  sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues().forEach(function(r){
    if(normalize_(r[0])===normalize_(usuarioId)) out[String(r[1]||'')]=true;
  });
  return out;
}
function getUnreadCountForUser_(user){return getNotificationsForUser_(user,APSN.MAX_UNREAD_SCAN,true).length;}

function viewerCanSee_(user,event){
  var role=normalize_(user.rol),uid=normalize_(user.usuarioId),name=normalize_(user.nombre),ger=normalize_(user.gerenciaId);
  if(role==='DIRECTORA'||role==='DIRECTOR') return true;
  if(role==='GERENTE'){
    if(event.gerenciaId&&ger) return normalize_(event.gerenciaId)===ger;
    return normalize_(event.actorId)===uid||normalize_(event.actorName)===name;
  }
  if(role==='COORDINADOR'){
    if(event.coordinadorId) return normalize_(event.coordinadorId)===uid;
    return normalize_(event.actorId)===uid||normalize_(event.actorName)===name;
  }
  if(role==='SUPERVISOR'){
    if(event.supervisorId) return normalize_(event.supervisorId)===uid;
    return normalize_(event.actorId)===uid||normalize_(event.actorName)===name;
  }
  return normalize_(event.actorId)===uid||normalize_(event.actorName)===name;
}

/* ========================= AUTH CENTRAL ========================= */
function requireCentralUser_(token){
  var t=String(token||'').trim(); if(!t) throw new Error('Sesión central requerida.');
  var url=String(PropertiesService.getScriptProperties().getProperty(APSN.AUTH_URL_PROPERTY)||APSN.AUTH_URL_DEFAULT).trim();
  var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify({action:'validate',token:t,moduleId:'PORTAL'}),muteHttpExceptions:true,followRedirects:true});
  var code=response.getResponseCode(),text=response.getContentText(),data;
  try{data=JSON.parse(text);}catch(e){throw new Error('APS AUTH CENTRAL devolvió una respuesta no válida. HTTP '+code);}
  if(code<200||code>=300||!data||!data.ok||!data.user) throw new Error(data&&data.message?data.message:'Sesión central no válida.');
  return data.user;
}

/* ========================= PUSH PREPARADO ========================= */
function registrarDispositivoGAS(token,fcmToken,plataforma){
  /*
   * Compatibilidad con versiones anteriores.
   * Ya no se registra ningún teléfono/dispositivo manualmente en Apps Script.
   * La PWA registra automáticamente su Firebase Installation ID (FID) en Firebase.
   */
  requireCentralUser_(token);
  return {
    ok:true,
    automatico:true,
    message:'No se requiere registrar dispositivos manualmente. Cada instalación autorizada se registra automáticamente en Firebase.'
  };
}

/**
 * Configura el puente seguro Apps Script -> Firebase Functions.
 * El secreto se guarda en Script Properties; no debe quedar en el código.
 */
function configurarPushBroadcastAutomatico(secret,endpoint){
  var s=String(secret||'').trim();
  var e=String(endpoint||APSN.PUSH_BROADCAST_DEFAULT).trim();

  if(s.length<32) throw new Error('El secreto de push debe tener al menos 32 caracteres.');
  if(!/^https:\/\/[a-z0-9.-]+\/(?:api\/)?push-broadcast(?:[?#].*)?$/i.test(e)){
    throw new Error('Endpoint de push inválido.');
  }

  PropertiesService.getScriptProperties().setProperties({
    APS_PUSH_ENDPOINT:e,
    APS_PUSH_SECRET:s
  },false);

  return {
    ok:true,
    modo:'BROADCAST_TODOS',
    endpoint:e
  };
}

function tryDispatchPush_(event,directory,db){
  try{
    dispatchPushBroadcast_(event,false);
  }catch(e){
    console.log('Push omitido: '+(e.message||String(e)));
  }
}

function dispatchPushBroadcast_(event,throwOnError){
  var props=PropertiesService.getScriptProperties();
  var endpoint=String(
    props.getProperty(APSN.PUSH_ENDPOINT_PROPERTY)||APSN.PUSH_BROADCAST_DEFAULT
  ).trim();
  var secret=String(props.getProperty(APSN.PUSH_SECRET_PROPERTY)||'').trim();

  if(!endpoint||!secret){
    if(throwOnError){
      throw new Error('Configura APS_PUSH_SECRET ejecutando configurarPushBroadcastAutomatico(secret).');
    }
    return {ok:false,configured:false};
  }

  /*
   * El push se envía a todas las instalaciones, pero el texto es genérico.
   * Así ningún usuario recibe en la pantalla bloqueada información que su rol
   * no debería visualizar. El detalle continúa filtrado dentro de la bandeja.
   */
  var response=UrlFetchApp.fetch(endpoint,{
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify({
      secret:secret,
      notification:{
        title:'APS Negocios',
        body:'Tienes nueva actividad en Negocios 2.5.'
      },
      data:{
        id:String(event&&event.id||''),
        fuente:String(event&&event.fuente||''),
        tipo:String(event&&event.tipo||'')
      },
      link:'https://negocios-aps-xyz.web.app/'
    }),
    muteHttpExceptions:true,
    followRedirects:true
  });

  var code=response.getResponseCode();
  var text=response.getContentText();
  var data=null;
  try{data=JSON.parse(text);}catch(_){data={raw:text};}

  if(code<200||code>=300){
    if(throwOnError) throw new Error('Push HTTP '+code+': '+text.slice(0,500));
    console.log('Push HTTP '+code+': '+text.slice(0,500));
    return {ok:false,http:code,response:data};
  }

  return {ok:true,http:code,response:data};
}

function testPushBroadcastGAS(token){
  var user=requireCentralUser_(token),role=normalize_(user.rol);
  if(['DIRECTORA','DIRECTOR','GERENTE'].indexOf(role)===-1){
    throw new Error('No tienes permiso para probar el push.');
  }

  return dispatchPushBroadcast_({
    id:'TEST-'+Date.now(),
    titulo:'APS Negocios · Prueba',
    detalle:'Prueba',
    fuente:'SISTEMA',
    modulo:'PORTAL',
    tipo:'PRUEBA'
  },true);
}

/* ========================= ADMIN / DIAGNÓSTICO ========================= */
function forceSyncGAS(token){
  var user=requireCentralUser_(token),role=normalize_(user.rol);
  if(['DIRECTORA','DIRECTOR','GERENTE'].indexOf(role)===-1) throw new Error('No tienes permiso para forzar la sincronización.');
  return procesarFuentesNotificaciones();
}

function diagnosticoNotificacionesCentral(){
  var out={
    ok:true,version:APSN.VERSION,centralDb:'',fuentes:[],
    rncConfigurado:!!getRncSpreadsheetId_(),
    authUrl:String(PropertiesService.getScriptProperties().getProperty(APSN.AUTH_URL_PROPERTY)||APSN.AUTH_URL_DEFAULT),
    pushConfigurado:!!String(PropertiesService.getScriptProperties().getProperty(APSN.PUSH_SECRET_PROPERTY)||''),
    pushModo:'BROADCAST_TODOS',
    pushEndpoint:String(PropertiesService.getScriptProperties().getProperty(APSN.PUSH_ENDPOINT_PROPERTY)||APSN.PUSH_BROADCAST_DEFAULT),
    rncWebappUrl:'https://script.google.com/macros/s/AKfycbzY9pXzV9X6WF-3ITXyiF0t3UoriFrME67ArjtDl1IRQ7A5H23XuzKfBd6PdAjUvcv_YA/exec'
  };
  try{var db=getCentralDb_(false);out.centralDb=db?db.getUrl():'';}catch(e){out.centralDbError=e.message||String(e);}
  [APSN.SOURCES.PRODUCTIVIDAD,APSN.SOURCES.CARNETS,APSN.SOURCES.VISITAS,APSN.SOURCES.RNC].forEach(function(source){
    try{
      var ss=SpreadsheetApp.openById(source.id==='RNC'?getRncSpreadsheetId_():source.spreadsheetId);
      out.fuentes.push({id:source.id,ok:true,spreadsheet:ss.getName(),sheets:source.sheets.map(function(d){
        var sh=ss.getSheetByName(d.name); return {name:d.name,exists:!!sh,rows:sh?Math.max(0,sh.getLastRow()-1):-1};
      })});
    }catch(e){out.fuentes.push({id:source.id,ok:false,error:e.message||String(e)});}
  });
  console.log(JSON.stringify(out,null,2)); return out;
}

/* ========================= ESTADO FUENTES ========================= */
function getSourcesStatus_(){
  var db=getCentralDb_(false); if(!db) return [];
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.FUENTES); if(!sh||sh.getLastRow()<2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,6).getValues().map(function(r){
    var fuente=String(r[0]||'');
    return {
      fuente:fuente,
      nombre:getSourceName_(fuente),
      url:getSourceWebappUrl_(fuente),
      ultimaRevision:formatDateTime_(r[1]),
      ok:normalize_(r[2])==='SI',
      mensaje:String(r[3]||''),
      filas:Number(r[4]||0),
      eventos:Number(r[5]||0)
    };
  });
}

function saveSourceStatus_(db,sourceId,when,ok,message,checked,events){
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.FUENTES),vals=sh.getDataRange().getDisplayValues(),found=0;
  for(var i=1;i<vals.length;i++) if(String(vals[i][0]||'')===sourceId){found=i+1;break;}
  var row=[sourceId,when,ok?'SI':'NO',message,Number(checked||0),Number(events||0)];
  if(found) sh.getRange(found,1,1,row.length).setValues([row]); else sh.appendRow(row);
}

/* ========================= STATE STORE ========================= */
function loadStateStore_(db){
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.ESTADO),values=sh.getDataRange().getValues(),map={},newRows=[],changed=[];
  for(var i=1;i<values.length;i++){
    var key=String(values[i][0]||''); if(!key) continue;
    map[key]={fingerprint:String(values[i][1]||''),row:i+1};
  }
  return {
    map:map,newRows:newRows,changed:changed,
    add:function(key,fingerprint,source,sheet,recordId){
      this.map[key]={fingerprint:fingerprint,row:0};
      this.newRows.push([key,fingerprint,new Date(),source,sheet,recordId]);
    },
    update:function(key,fingerprint){
      var item=this.map[key]; if(!item) return;
      item.fingerprint=fingerprint;
      if(item.row) this.changed.push({row:item.row,fingerprint:fingerprint});
    }
  };
}
function flushStateStore_(db,store){
  var sh=db.getSheetByName(APSN.CENTRAL_SHEETS.ESTADO);
  if(store.newRows.length){
    var start=sh.getLastRow()+1;
    sh.getRange(start,1,store.newRows.length,6).setValues(store.newRows);
    for(var i=0;i<store.newRows.length;i++){var key=store.newRows[i][0];if(store.map[key]) store.map[key].row=start+i;}
  }
  store.changed.forEach(function(c){sh.getRange(c.row,2,1,2).setValues([[c.fingerprint,new Date()]]);});
}

/* ========================= BASE CENTRAL ========================= */
function getCentralDb_(createIfMissing){
  var props=PropertiesService.getScriptProperties(),id=String(props.getProperty(APSN.DB_PROPERTY)||'').trim();
  if(id){try{return SpreadsheetApp.openById(id);}catch(_){}}
  if(!createIfMissing) return null;
  var ss=SpreadsheetApp.create('APS Notificaciones Central');
  props.setProperty(APSN.DB_PROPERTY,ss.getId());
  ss.getSheets()[0].setName(APSN.CENTRAL_SHEETS.NOTIFICACIONES);
  return ss;
}
function ensureCentralSheet_(db,name,headers){
  var sh=db.getSheetByName(name)||db.insertSheet(name);
  if(sh.getLastRow()===0){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1); sh.getRange(1,1,1,headers.length).setFontWeight('bold'); return sh;
  }
  var current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getDisplayValues()[0];
  headers.forEach(function(h,idx){if(String(current[idx]||'').trim()!==h) sh.getRange(1,idx+1).setValue(h).setFontWeight('bold');});
  sh.setFrozenRows(1); return sh;
}

/* ========================= HELPERS ========================= */
function rowToObject_(headers,values){
  var o={}; for(var i=0;i<headers.length;i++){var key=String(headers[i]||'').trim()||('COL_'+(i+1));o[key]=values[i];} return o;
}
function rowIsEmpty_(row){return Object.keys(row).every(function(k){return String(row[k]==null?'':row[k]).trim()==='';});}
function firstValue_(row,aliases){
  var keys=Object.keys(row),m={}; keys.forEach(function(k){m[normalize_(k)]=row[k];});
  for(var i=0;i<aliases.length;i++){var v=m[normalize_(aliases[i])];if(v!==undefined&&String(v).trim()!=='') return String(v).trim();}
  return '';
}
function getRecordId_(row,rowNum){
  return firstValue_(row,['ID_SISTEMA','ID SISTEMA','ID','ID REGISTRO','ID Registro','REQUEST ID','Request ID','SOLICITUD ID','Solicitud ID','NUCT'])||('ROW-'+rowNum);
}
function normalize_(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
function hashObject_(obj){
  var keys=Object.keys(obj).sort(),s=keys.map(function(k){return normalize_(k)+'='+String(obj[k]==null?'':obj[k]).trim();}).join('|');
  return hashText_(s);
}
function hashText_(text){
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text||''),Utilities.Charset.UTF_8);
  return bytes.map(function(b){var n=b<0?b+256:b;return ('0'+n.toString(16)).slice(-2);}).join('');
}
function maskId_(v){var d=String(v||'').replace(/\D/g,'');return d.length<=4?d:'***'+d.slice(-4);}
function formatDateTime_(d){
  if(!d) return '';
  try{var date=d instanceof Date?d:new Date(d);if(isNaN(date.getTime())) return String(d||'');return Utilities.formatDate(date,APSN.TZ,'dd/MM/yyyy hh:mm a');}
  catch(_){return String(d||'');}
}

