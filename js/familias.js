import {getClient,isLive,compressImage,money,newId,copyText,safeImageUrl} from './common.js?v=multi16';
const $=id=>document.getElementById(id);
const SITE_ROOT=new URL('../',import.meta.url);
// La confirmación por correo NUNCA debe regresar a localhost, aunque la prueba se abra desde allí.
const AUTH_REDIRECT_URL=window.TGK_CONFIG?.authRedirectUrl || 'https://drjavierespinav.github.io/toy-garage-kids/mi-tienda/';
const standalone=document.body.dataset.appMode==='standalone';
const ui={auth:$('authPane'),account:$('accountPane'),redeem:$('redeemPane'),founder:$('founderInvitePane'),work:$('familyWorkspace'),radar:$('radarAdminPane')};
let client=null,user=null,store=null,toys=[],saving=false;
const founderId='d4549710-8c53-4901-bbee-f70fdb060f03';
function alertMsg(text,err=false){const n=$('familyAlert');n.textContent=text;n.dataset.error=String(err);}
function signupMsg(text,err=false){const n=$('signupStatus');if(n){n.textContent=text;n.dataset.error=String(err);}alertMsg(text,err);}
function setBusy(form,value){for(const b of form.querySelectorAll('button[type="submit"]'))b.disabled=value;}
function errorText(e){return e?.message||'No fue posible completar la operación.';}
function url(){return new URL('tienda.html?slug='+encodeURIComponent(store.slug),SITE_ROOT).href;}
function empty(node){node.replaceChildren();}
function tag(name,cls,content){const n=document.createElement(name);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n;}
async function init(){
 if(!isLive()){alertMsg('Supabase no está conectado. Este piloto requiere la configuración pública del proyecto.',true);return;}
 client=await getClient();
 await refreshSession();
}

function focusAuthenticatedPanel(){
 // El formulario con #acceso se oculta tras autenticar; mostrar el panel visible.
 if(location.hash==='#acceso'||location.hash==='#registro'){
  const target=new URL(location.href);target.hash='accountPane';
  history.replaceState(null,'',target.href);
  requestAnimationFrame(()=>$('accountPane')?.scrollIntoView({block:'start'}));
 }
}
function configureFounderDashboard(){
 const link=(id,relative)=>{const element=$(id);if(element)element.href=new URL(relative,SITE_ROOT).href;};
 link('founderEditLink','admin.html');
 link('founderCatalogLink','index.html');
 link('founderPosterLink','afiche.html');
 link('founderInviteLink','familias.html#invitar');
 const brandLogo=$('founderLogo');brandLogo.src=new URL('assets/toy-garage-kids-logo.webp',SITE_ROOT).href;
 if($('headerPublicStore')){$('headerPublicStore').href=new URL('index.html',SITE_ROOT).href;$('headerPublicStore').hidden=false;}
 if($('headerManageStore')){$('headerManageStore').href=new URL('admin.html',SITE_ROOT).href;$('headerManageStore').hidden=false;}
}
function configureInvitedDashboard(){
 $('invitedDashboardTitle').textContent=store.display_name;
 const catalogue=url();
 const poster=new URL('afiche-tienda.html?slug='+encodeURIComponent(store.slug),SITE_ROOT).href;
 $('invitedCatalogLink').href=catalogue;
 $('invitedPosterLink').href=store.is_published?poster:'#';
 $('invitedPosterLink').setAttribute('aria-disabled',String(!store.is_published));
 if($('headerPublicStore')){$('headerPublicStore').href=catalogue;$('headerPublicStore').hidden=false;}
 if($('headerManageStore')){$('headerManageStore').href='#toyForm';$('headerManageStore').hidden=false;}
}

async function refreshSession(){
 const {data,error}=await client.auth.getUser();
 user=error?null:data.user;
 ui.auth.hidden=!!user;ui.account.hidden=!user;
 ui.redeem.hidden=true;ui.founder.hidden=true;ui.work.hidden=true;ui.radar.hidden=true;
 $('founderDashboard').hidden=true;$('invitedDashboard').hidden=true;store=null;
 document.body.classList.toggle('family-signed-in',!!user);
 const headerAccount=$('headerMyAccount');
 if(headerAccount){headerAccount.textContent=user?'🔑 Mi cuenta':'🔑 Ingresar';headerAccount.href=user?'#accountPane':'#acceso';}
 for(const name of ['headerPublicStore','headerManageStore'])if($(name))$(name).hidden=true;
 if(!user){if(location.hash==='#registro')requestAnimationFrame(()=>$('registro')?.scrollIntoView({block:'start'}));return;}
 $('familySignedUser').textContent='Adulto responsable: '+(user.email||'sesión activa');
 const {data:owned,error:storeError}=await client.from('stores').select('id,slug,display_name,logo_url,tagline,is_published,radar_opt_in,radar_area_id,contact_whatsapp,public_whatsapp_opt_in').eq('owner_user_id',user.id).maybeSingle();
 if(storeError){alertMsg('No se pudo comprobar tu tienda: '+storeError.message,true);return;}
 store=owned;
 const {data:admin}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
 const isFounder=!!admin && store?.id===founderId;
 ui.founder.hidden=!isFounder||standalone;
 ui.radar.hidden=!store;
 if(isFounder){
   configureFounderDashboard();
   $('founderDashboard').hidden=false;
   alertMsg('Sesión fundadora activa. Utiliza «Administrar juguetes» para abrir tu Centro de Control o «Ver tienda pública» para regresar al catálogo.');
 }else if(store){
   configureInvitedDashboard();
   $('invitedDashboard').hidden=false;
 }
 if(store)await loadRadarPanel();
 if(isFounder){
   focusAuthenticatedPanel();
   if(location.hash==='#invitar'&&!standalone)requestAnimationFrame(()=>$('invitar')?.scrollIntoView({block:'start'}));
   return;
 }
 ui.redeem.hidden=!!store;
 ui.work.hidden=!store;
 if(store){fillSettings();await loadInventory();}
 else alertMsg('Sesión iniciada. Introduce la invitación recibida para activar tu tienda; todavía no tienes catálogo.');
 focusAuthenticatedPanel();
}
$('signupForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget,v=new FormData(form);
 if(!v.get('adult'))return signupMsg('Confirma que eres un adulto responsable.',true);
 if(!client)return signupMsg('Conectando con el servidor. Comprueba tu conexión e inténtalo de nuevo.',true);
 setBusy(form,true);signupMsg('Creando cuenta. Mantén esta página abierta hasta ver el resultado.');
 try{
  const email=String(v.get('email')||'').trim().toLowerCase();
  const password=String(v.get('password')||'');
  if(password.length<8)throw Error('La contraseña debe tener al menos 8 caracteres.');
  const redirectTo=AUTH_REDIRECT_URL;
  const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
  if(error)throw error;
  if(!data?.user)throw Error('El servidor no confirmó el registro. Intenta iniciar sesión o vuelve a intentarlo.');
  form.reset();
  signupMsg(data.session
   ?'Cuenta creada. Ya tienes acceso: activa tu tienda con el código privado que recibiste.'
   :'Solicitud recibida. Abre tu correo y confirma la dirección. Después regresa aquí, inicia sesión y utiliza tu código de invitación.');
  if(data.session)await refreshSession();
 }catch(err){signupMsg('No fue posible crear la cuenta: '+errorText(err),true);}
 finally{setBusy(form,false);}
});
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,v=new FormData(form);setBusy(form,true);
 try{
  const {error}=await client.auth.signInWithPassword({email:String(v.get('email')).trim(),password:String(v.get('password'))});
  if(error)throw error;
  form.reset();alertMsg('Sesión iniciada.');await refreshSession();
 }catch(err){alertMsg('Error de acceso: '+errorText(err),true);}
 finally{setBusy(form,false);}
});
$('familySignout').addEventListener('click',async()=>{if(!client)return;await client.auth.signOut();alertMsg('Sesión cerrada.');await refreshSession();});
$('inviteForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget;setBusy(form,true);
 try{
  const email=String(new FormData(form).get('email')).trim();
  const {data,error}=await client.rpc('tgk_issue_family_invite',{p_email:email});
  if(error)throw error;
  $('inviteCode').textContent=data;$('inviteOutput').hidden=false;
  alertMsg('Invitación generada para '+email+'. Debes compartir el código de forma privada: no se envió un correo automático.');
 }catch(err){alertMsg('Error creando invitación: '+errorText(err),true);}
 finally{setBusy(form,false);}
});
$('copyInvite').addEventListener('click',async()=>{const ok=await copyText($('inviteCode').textContent);alertMsg(ok?'Código copiado.':'No se pudo copiar. Selecciona el código manualmente.',!ok);});
$('copyInviteMessage').addEventListener('click',async()=>{
 const code=$('inviteCode').textContent;
 if(!code)return alertMsg('Primero genera la invitación.',true);
 const email=$('inviteForm').elements.email.value.trim();
 const joinUrl=new URL('mi-tienda/#registro',SITE_ROOT).href;
 const msg='¡Hola! Te invito al piloto de tiendas familiares Toy Garage Kids.\n\n1. Abre este enlace desde tu teléfono: '+joinUrl+'\n2. Crea una cuenta de adulto con este correo: '+email+'\n3. Confirma el correo e inicia sesión.\n4. Activa tu tienda con este código de invitación (14 días, un solo uso): '+code+'\n\nPuedes elegir el nombre y el logo de tu tienda y publicar tus propios juguetes. Actualmente es un piloto privado.';
 const ok=await copyText(msg);
 alertMsg(ok?'Invitación completa copiada. Compártela por WhatsApp o correo al adulto invitado.':'No se pudo copiar el mensaje.',!ok);
});
$('redeemForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,v=new FormData(form);setBusy(form,true);
 try{
  const {data,error}=await client.rpc('tgk_redeem_family_invite',{p_code:String(v.get('code')).trim(),p_slug:String(v.get('slug')).trim(),p_name:String(v.get('display_name')).trim()});
  if(error)throw error;
  form.reset();alertMsg('¡Tienda creada! Ya puedes personalizarla y publicar tus juguetes.');
  await refreshSession();
 }catch(err){alertMsg('No se pudo activar la tienda: '+errorText(err),true);}
 finally{setBusy(form,false);}
});
function fillSettings(){
 const f=$('settingsForm');f.elements.display_name.value=store.display_name;f.elements.tagline.value=store.tagline||'';
 f.elements.is_published.checked=store.is_published;
 f.elements.contact_whatsapp.value=store.contact_whatsapp||'';
 f.elements.public_whatsapp_opt_in.checked=!!store.public_whatsapp_opt_in;
 const image=$('familyLogoPreview'),safe=safeImageUrl(store.logo_url);
 image.hidden=!safe;if(safe)image.src=safe;
 $('myStoreTitle').textContent=store.display_name;
 $('myStoreStatus').textContent=store.is_published?'🟢 Catálogo publicado · visible mediante enlace':'🔒 Catálogo privado · todavía no publicado';
 $('visitStore').href=url();$('familyStoreLink').href=url();$('familyStoreLink').textContent=url();
 const poster=$('printStorePoster');
 const posterUrl=new URL('afiche-tienda.html?slug='+encodeURIComponent(store.slug),SITE_ROOT).href;
 poster.href=store.is_published?posterUrl:'#';
 poster.hidden=!store.is_published;
 $('posterPublishHint').hidden=!!store.is_published;
 empty($('familyQr'));
 if(window.QRCode){new window.QRCode($('familyQr'),{text:url(),width:150,height:150,correctLevel:window.QRCode.CorrectLevel.M});}
 else $('familyQr').append(tag('p','', 'Abre el enlace de tu tienda para compartirlo.'));
}
$('settingsForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!store||saving)return;const form=e.currentTarget;setBusy(form,true);saving=true;
 try{
  const v=new FormData(form);
  const phone=String(v.get('contact_whatsapp')||'').replace(/\D/g,'');
  const visibleContact=v.get('public_whatsapp_opt_in')==='on';
  if(phone && (phone.length<8||phone.length>15))throw Error('WhatsApp inválido: indica de 8 a 15 dígitos con código de país.');
  if(visibleContact && !phone)throw Error('Ingresa el WhatsApp del adulto antes de habilitar las consultas.');
  const upd={display_name:String(v.get('display_name')).trim(),
    tagline:String(v.get('tagline')).trim(),is_published:v.get('is_published')==='on',
    contact_whatsapp:phone,public_whatsapp_opt_in:visibleContact};
  if(upd.display_name.length<2||upd.display_name.length>90)throw Error('Nombre de tienda inválido.');
  if(upd.tagline.length>220)throw Error('La descripción es demasiado larga (máximo 220 caracteres).');
  const file=form.elements.logo.files[0];
  if(file){
   const blob=await compressImage(file);
   const path=store.id+'/logo/'+newId()+'.jpg';
   const {error:uploadError}=await client.storage.from('family-media').upload(path,blob,{contentType:'image/jpeg',upsert:false});
   if(uploadError)throw uploadError;
   upd.logo_url=client.storage.from('family-media').getPublicUrl(path).data.publicUrl;
  }
  const {data,error}=await client.from('stores').update(upd).eq('id',store.id).select('id,slug,display_name,logo_url,tagline,is_published,radar_opt_in,radar_area_id,contact_whatsapp,public_whatsapp_opt_in').single();
  if(error)throw error;
  store=data;form.elements.logo.value='';fillSettings();configureInvitedDashboard();alertMsg('Tu tienda fue actualizada. '+(store.public_whatsapp_opt_in&&store.is_published?'Los visitantes pueden consultar por WhatsApp al adulto responsable.':'Tu WhatsApp no se muestra públicamente.'));
 }catch(err){alertMsg('No se guardó la tienda: '+errorText(err),true);}
 finally{saving=false;setBusy(form,false);}
});
$('copyStoreLink').addEventListener('click',async()=>{if(!store)return;const ok=await copyText(url());alertMsg(ok?'Enlace copiado.':'No se pudo copiar el enlace.',!ok);});
async function loadInventory(){
 if(!store)return;
 const {data,error}=await client.from('toys').select('*').eq('store_id',store.id).order('created_at',{ascending:false});
 if(error){alertMsg('No se pudo cargar el inventario: '+error.message,true);return;}
 toys=data||[];renderInventory();
}
function renderInventory(){
 const root=$('familyInventory');empty(root);$('myToyCount').textContent=toys.length+' juguetes';
 if(!toys.length){root.append(tag('p','','Aún no tienes juguetes. Publica el primero para comenzar.'));return;}
 for(const t of toys){
  const row=tag('article','family-toy-row');
  const imageUrl=safeImageUrl(t.photos?.[0]);
  if(imageUrl){const image=tag('img','');image.src=imageUrl;image.alt=t.title;image.loading='lazy';row.append(image);}else row.append(tag('span','family-avatar','🧸'));
  const info=tag('div','family-toy-info');info.append(tag('strong','',t.title),tag('small','',money(t.price)+' · '+t.status));
  const actions=tag('div','family-toy-actions'),edit=tag('button','family-secondary','Editar'),del=tag('button','family-secondary','Eliminar');
  edit.type='button';del.type='button';edit.addEventListener('click',()=>editToy(t));del.addEventListener('click',()=>removeToy(t));
  actions.append(edit,del);row.append(info,actions);root.append(row);
 }
}
function editToy(t){
 const f=$('toyForm');f.elements.id.value=t.id;for(const field of ['title','description','category','grade','price','status'])f.elements[field].value=t[field]??'';
 f.elements.photo.value='';$('familySaveToy').textContent='Actualizar juguete';
 f.scrollIntoView({behavior:'smooth',block:'center'});
}
$('clearToy').addEventListener('click',()=>{$('toyForm').reset();$('toyForm').elements.id.value='';$('familySaveToy').textContent='Guardar juguete';});
$('toyForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!store||saving)return;const form=e.currentTarget,v=new FormData(form);
 saving=true;setBusy(form,true);
 try{
  const id=String(v.get('id')||newId()),previous=toys.find(t=>t.id===id);
  const price=Number(v.get('price'));if(!Number.isSafeInteger(price)||price<0)throw Error('El precio debe ser un entero positivo o cero.');
  let photos=[...(previous?.photos||[])];
  const file=form.elements.photo.files[0];
  if(file){
   if(photos.length>=3)throw Error('Máximo 3 fotos. Elimina o reemplaza el juguete antes de añadir otra.');
   const blob=await compressImage(file),path=store.id+'/toys/'+id+'/'+newId()+'.jpg';
   const {error:uploadErr}=await client.storage.from('family-media').upload(path,blob,{contentType:'image/jpeg',upsert:false});
   if(uploadErr)throw uploadErr;
   photos.push(client.storage.from('family-media').getPublicUrl(path).data.publicUrl);
  }
  const payload={...previous,id,store_id:store.id,title:String(v.get('title')).trim(),category:String(v.get('category')),grade:String(v.get('grade')),price,
     status:String(v.get('status')),description:String(v.get('description')||'').trim(),photos,sale_mode:'fixed',emoji:'🧸'};
  const {error}=await client.from('toys').upsert(payload,{onConflict:'id'}).select('id').single();
  if(error)throw error;
  form.reset();form.elements.id.value='';$('familySaveToy').textContent='Guardar juguete';
  await loadInventory();alertMsg('Juguete guardado en tu propia tienda.');
 }catch(err){alertMsg('No se pudo guardar el juguete: '+errorText(err),true);}
 finally{saving=false;setBusy(form,false);}
});
async function removeToy(t){
 if(!window.confirm('¿Eliminar definitivamente «'+t.title+'» de TU tienda?'))return;
 const {data,error}=await client.from('toys').delete().eq('id',t.id).eq('store_id',store.id).select('id');
 if(error||!data?.length){alertMsg('No se pudo eliminar: '+(error?.message||'No tienes permisos.'),true);return;}
 const marker='/storage/v1/object/public/family-media/';
 const paths=(t.photos||[]).flatMap(src=>{try{const u=new URL(src);if(u.origin!==new URL(window.TGK_CONFIG.supabaseUrl).origin||!u.pathname.includes(marker))return [];const path=decodeURIComponent(u.pathname.split(marker)[1]||'');return path.startsWith(store.id+'/toys/'+t.id+'/')?[path]:[];}catch{return[];}});
 if(paths.length){const {error:mediaError}=await client.storage.from('family-media').remove(paths);if(mediaError)alertMsg('Juguete eliminado. Algunas fotografías antiguas no pudieron retirarse: '+mediaError.message,true);}
 await loadInventory();
 if(!$('familyAlert').dataset.error || $('familyAlert').dataset.error==='false')alertMsg('Juguete eliminado.');
}

/* V1.8 — preferencias y conexiones entre administradores adultos. */
async function loadRadarPanel(){
 const form=$('radarSettingsForm'),picker=form.elements.radar_area_id;
 const {data:areas,error}=await client.from('radar_areas').select('id,label').order('label');
 if(error){alertMsg('No se pudieron cargar las comunas: '+error.message,true);return;}
 picker.replaceChildren();
 const placeholder=tag('option','','Selecciona una comuna...');placeholder.value='';picker.append(placeholder);
 for(const area of areas||[]){const option=tag('option','',area.label);option.value=area.id;picker.append(option);}
 picker.value=store.radar_area_id||'';form.elements.radar_opt_in.checked=!!store.radar_opt_in;
 $('radarAdminState').textContent=store.radar_opt_in&&store.is_published
  ?'Visible en Toy Radar por comuna. No se comparte dirección ni distancia.'
  : 'Tu tienda no aparece en Toy Radar. Puedes activar la participación cuando esté publicada.';
 await loadConnections();
}
$('radarSettingsForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!store||!client)return;
 const form=e.currentTarget;setBusy(form,true);
 try{
  const optIn=form.elements.radar_opt_in.checked;
  const area=form.elements.radar_area_id.value||null;
  if(optIn&&!store.is_published)throw Error('Primero publica tu catálogo en «Personalizar tienda».');
  if(optIn&&!area)throw Error('Selecciona una comuna para aparecer en Toy Radar.');
  const {data,error}=await client.from('stores').update({radar_opt_in:optIn,radar_area_id:area})
   .eq('id',store.id).select('id,slug,display_name,logo_url,tagline,is_published,radar_opt_in,radar_area_id,contact_whatsapp,public_whatsapp_opt_in').single();
  if(error)throw error;
  store=data;
  $('radarAdminState').textContent=optIn?'Participación activada. Tu tienda aparecerá en la comuna elegida.':'Participación desactivada. Tu tienda deja de aparecer en Toy Radar.';
  alertMsg('Preferencias de Toy Radar guardadas.');
 }catch(err){alertMsg('No se pudo actualizar Toy Radar: '+errorText(err),true);}
 finally{setBusy(form,false);}
});
$('reloadConnections').addEventListener('click',()=>loadConnections());
async function loadConnections(){
 const root=$('familyConnections');empty(root);
 if(!store)return;
 const id=store.id;
 const {data,error}=await client.from('tgk_connections')
   .select('id,from_store_id,to_store_id,status,created_at')
   .or('from_store_id.eq.'+id+',to_store_id.eq.'+id)
   .order('created_at',{ascending:false}).limit(60);
 if(error){root.append(tag('p','', 'No se pudieron consultar las solicitudes: '+error.message));return;}
 const items=data||[];
 if(!items.length){root.append(tag('p','', 'Aún no hay solicitudes de otras familias. Comparte tu tienda o invita a otra familia al piloto.'));return;}
 const ids=[...new Set(items.map(x=>x.from_store_id===id?x.to_store_id:x.from_store_id))];
 const {data:publicShops}=await client.from('storefronts').select('store_id,display_name').in('store_id',ids);
 const names=new Map((publicShops||[]).map(x=>[x.store_id,x.display_name]));
 const statusNames={pending:'Pendiente',accepted:'Aceptada',declined:'Rechazada',blocked:'Bloqueada',cancelled:'Cancelada'};
 for(const item of items){
   const isIncoming=item.to_store_id===id;
   const otherId=isIncoming?item.from_store_id:item.to_store_id;
   const row=tag('article','family-radar-request');
   const details=tag('div','family-radar-request-description');
   details.append(tag('strong','',(isIncoming?'📩 Recibida de ':'📤 Enviada a ')+(names.get(otherId)||'Tienda familiar')));
   details.append(tag('small','',(statusNames[item.status]||item.status)+' · '+new Date(item.created_at).toLocaleDateString('es-CL')));
   row.append(details);
   if(item.status==='pending'){
    const actions=tag('div','family-radar-request-actions');
    const ops=isIncoming?[['accepted','Aceptar'],['declined','Rechazar'],['blocked','Bloquear']]:[['cancelled','Cancelar']];
    for(const [value,label] of ops){
     const b=tag('button','family-secondary',label);b.type='button';
     b.addEventListener('click',async()=>{
      for(const btn of actions.querySelectorAll('button'))btn.disabled=true;
      const {data:updated,error:updateError}=await client.from('tgk_connections').update({status:value})
       .eq('id',item.id).eq('status','pending').eq(isIncoming?'to_store_id':'from_store_id',id).select('id');
      if(updateError||!updated?.length)alertMsg('No se pudo procesar la solicitud: '+(updateError?.message||'No autorizada.'),true);
      else alertMsg('Solicitud '+(statusNames[value]||'actualizada').toLowerCase()+'.');
      await loadConnections();
     });
     actions.append(b);
    }
    row.append(actions);
   }
   root.append(row);
 }
}

init().catch(err=>alertMsg('Error iniciando el portal: '+errorText(err),true));
