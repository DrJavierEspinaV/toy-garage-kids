/* Toy Garage Kids V3.3: compradores adultos gratuitos, sin acceso a tiendas.
 * Las ofertas y avisos se autorizan realmente en Supabase (RLS + RPC).
 */
import {getClient,isLive,money} from './common.js?v=auth-v27';
const $=id=>document.getElementById(id);
const status=$('buyerStatus'),auth=$('buyerAuth'),activate=$('buyerActivate'),account=$('buyerAccount');
const returnLink=$('buyerReturnBattle');
let client=null,user=null,busy=false;
const text=(tag,value,css)=>{const node=document.createElement(tag);node.textContent=String(value);if(css)node.className=css;return node;};
function notice(s){status.textContent=s;}
function returnTarget(){
 const raw=new URLSearchParams(location.search).get('volver');
 if(!raw)return null;
 try{
  const next=new URL(raw,location.href);
  const path=new URL('./battle.html',location.href);
  const query=next.searchParams;
  if(next.origin!==location.origin||next.pathname!==path.pathname||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query.get('slug')||'')||
    !/^[a-f0-9-]{36}$/i.test(query.get('toy')||''))return null;
  return next.href;
 }catch{return null;}
}
const destination=returnTarget();
if(destination){returnLink.href=destination;}
else{ returnLink.href='./plataforma.html#tiendas';returnLink.textContent='🧸 Explorar tiendas y Battles';}
function show(view){auth.hidden=view!=='auth';activate.hidden=view!=='activate';account.hidden=view!=='account';}
function errorMsg(err){return err?.message||'No se pudo completar la operación';}
async function profileOf(uid){
 const {data,error}=await client.from('tgk_buyer_profiles').select('user_id,adult_declared,created_at').eq('user_id',uid).maybeSingle();
 if(error)throw error;return data;
}
async function render(){
 if(!client)return;
 const {data,error}=await client.auth.getUser();
 if(error){console.warn('Sesión no disponible',error);}
 user=error?null:data.user;
 if(!user){show('auth');notice('Explorar es gratis y no requiere cuenta. Para participar en Battles, registra una cuenta adulta sin costo.');return;}
 if(!user.email_confirmed_at){show('auth');notice('Tu correo aún no está confirmado. Abre el enlace de verificación y luego vuelve a iniciar sesión.');return;}
 const profile=await profileOf(user.id);
 if(!profile){show('activate');notice('Sesión confirmada de '+user.email+'. Activa tu perfil de comprador adulto para participar en Battle Arena.');return;}
 show('account');$('buyerEmail').textContent=user.email||'Cuenta adulta confirmada';
 notice('✓ Perfil comprador gratuito activo. Puedes explorar, participar en subastas y consultar tus mensajes.');
 await refreshBidsAndNotices();
}
async function refreshBidsAndNotices(){
 if(!user)return;
 const [bidsResult,alertsResult]=await Promise.all([
  client.from('tgk_bids').select('id,battle_id,amount,created_at').eq('bidder_user_id',user.id).order('created_at',{ascending:false}).limit(25),
  client.from('tgk_battle_notifications').select('id,title,message,kind,read_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(35)
 ]);
 if(bidsResult.error||alertsResult.error)throw bidsResult.error||alertsResult.error;
 const bids=$('buyerBidsList'),notices=$('buyerNoticesList');
 bids.replaceChildren();notices.replaceChildren();
 if(!bidsResult.data?.length)bids.append(text('p','Aún no registras ofertas.'));
 for(const bid of bidsResult.data||[]){
  const box=text('article','','buyer-item');
  box.append(text('strong','⚡ Oferta registrada: '+money(bid.amount)));
  box.append(text('small','Fecha: '+new Date(bid.created_at).toLocaleString('es-CL')));
  bids.append(box);
 }
 if(!alertsResult.data?.length)notices.append(text('p','Aún no hay mensajes sobre tus Battles.'));
 for(const n of alertsResult.data||[]){
  const box=text('article','','buyer-item');
  box.append(text('strong',n.title),text('p',n.message));
  box.append(text('small',new Date(n.created_at).toLocaleString('es-CL')));
  if(!n.read_at){
   const mark=text('button','✓ Marcar como leído','buyer-light');
   mark.type='button';
   mark.addEventListener('click',async()=>{
    mark.disabled=true;
    const {error}=await client.from('tgk_battle_notifications').update({read_at:new Date().toISOString()}).eq('id',n.id);
    if(error){mark.disabled=false;notice('No se pudo guardar el aviso: '+errorMsg(error));}
    else{mark.textContent='✓ Leído';}
   });box.append(mark);
  }
  notices.append(box);
 }
}
function formBusy(form,on){
 const button=form.querySelector('button[type=submit]');if(button)button.disabled=on;
}
$('buyerSignupForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!client||busy)return;
 const form=event.currentTarget;
 if(!form.elements.adult.checked){notice('El registro de compradores está reservado a adultos (18+).');return;}
 busy=true;formBusy(form,true);
 try{
  notice('Solicitando registro gratuito...');
  const {data,error}=await client.auth.signUp({
   email:form.elements.email.value.trim().toLowerCase(),
   password:form.elements.password.value,
   options:{emailRedirectTo:window.TGK_CONFIG?.authBuyerRedirectUrl || 'https://drjavierespinav.github.io/toy-garage-kids/comprador.html'}
  });
  if(error)throw error;
  form.elements.password.value='';
  if(data.session){await render();notice('Cuenta creada. Confirma tu mayoría de edad para activar el perfil comprador.');}
  else notice('Revisa tu correo, confirma la dirección y luego inicia sesión en esta misma página. No necesitas comprar la app.');
 }catch(err){notice('No se pudo registrar: '+errorMsg(err));}
 finally{busy=false;formBusy(form,false);}
});
$('buyerLoginForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!client||busy)return;
 const form=event.currentTarget;busy=true;formBusy(form,true);
 try{
  notice('Verificando correo y contraseña...');
  const {error}=await client.auth.signInWithPassword({
   email:form.elements.email.value.trim(),password:form.elements.password.value
  });
  if(error)throw error;
  form.elements.password.value='';await render();
 }catch(err){notice('No se pudo ingresar: '+errorMsg(err));}
 finally{busy=false;formBusy(form,false);}
});
$('buyerActivationForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!client||busy||!user)return;
 const form=event.currentTarget;
 if(!form.elements.adult.checked){notice('Debes confirmar que tienes al menos 18 años.');return;}
 busy=true;formBusy(form,true);
 try{
  const {error}=await client.from('tgk_buyer_profiles').insert({
   user_id:user.id,adult_declared:true,accepted_terms_version:'buyer-pilot-v1'
  });
  if(error&&error.code!=='23505')throw error;
  await render();
 }catch(err){notice('No se pudo activar el perfil: '+errorMsg(err));}
 finally{busy=false;formBusy(form,false);}
});
$('buyerSignout').addEventListener('click',async()=>{
 if(!client)return;
 const {error}=await client.auth.signOut();
 if(error)notice('No se pudo cerrar la sesión: '+errorMsg(error));
 else{user=null;await render();}
});
$('buyerRefresh').addEventListener('click',async()=>{
 try{await refreshBidsAndNotices();notice('✓ Ofertas y mensajes actualizados.');}
 catch(err){notice('No se pudieron actualizar los datos: '+errorMsg(err));}
});
async function start(){
 if(!isLive()){notice('Este servicio necesita conexión con el servidor.');return;}
 client=await getClient();
 if(!client){notice('No se pudo iniciar la conexión.');return;}
 await render();
}
start().catch(err=>{console.error(err);notice('Error inicializando la cuenta: '+errorMsg(err));});
