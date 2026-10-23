/* Toy Radar V2.3: directorio auténtico. La ilustración de radios NO filtra tiendas.
   La página fundadora y TODAS las tiendas invitadas ejecutan el mismo módulo. */
import {getClient,isLive,safeImageUrl} from './common.js?v=multi16';
const root=document.getElementById('radar');
const $=id=>document.getElementById(id);
const el=(type,cls,value)=>{const n=document.createElement(type);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
const directoryLink=new URL('../tienda.html',import.meta.url);
if(root)main().catch(e=>{console.error(e);$('tgkRadarNotice').textContent='No se pudo iniciar el directorio real. Comprueba la conexión.';});
async function main(){
 const area=$('tgkRadarArea'),results=$('tgkRadarResults'),feedback=$('tgkRadarNotice');
 let radius=1;
 for(const b of root.querySelectorAll('[data-radar-radius]')){
  b.addEventListener('click',()=>{
   radius=Number(b.dataset.radarRadius);
   for(const other of root.querySelectorAll('[data-radar-radius]'))other.setAttribute('aria-pressed',String(other===b));
   $('tgkRadarRadiusLabel').textContent=radius===.5?'500 M · DEMO':radius+' KM · DEMO';
   $('tgkRadarCount').textContent='Escala '+(radius===.5?'500 m':radius+' km')+' ilustrativa. Los resultados dependen solo de la comuna.';
  });
 }
 if(!isLive()){feedback.textContent='El directorio real no está conectado.';return;}
 const client=await getClient();
 const {data:areas,error:areaError}=await client.from('radar_areas').select('id,label').order('label');
 if(areaError)throw areaError;
 const map=new Map((areas||[]).map(x=>[x.id,x.label]));
 for(const a of areas||[]){const opt=el('option','',a.label);opt.value=a.id;area.append(opt);}
 let owner=null;
 async function getOwner(){
  const {data:{user}}=await client.auth.getUser();
  if(!user){owner=null;return;}
  const {data}=await client.from('stores').select('id,is_published,radar_opt_in,radar_area_id').eq('owner_user_id',user.id).maybeSingle();
  owner=data||null;
 }
 async function search(){
  results.replaceChildren();
  if(!area.value){feedback.textContent='Selecciona una comuna para descubrir tiendas reales.';return;}
  feedback.textContent='Buscando tiendas participantes...';
  const selected=area.value;
  const {data,error}=await client.from('storefronts')
   .select('store_id,slug,display_name,logo_url,tagline')
   .eq('is_published',true).eq('radar_opt_in',true).eq('radar_area_id',selected)
   .order('display_name').limit(40);
  if(selected!==area.value)return;
  if(error){console.error(error);feedback.textContent='No se pudo consultar la red. Intenta actualizar.';return;}
  const stores=data||[];
  if(!stores.length){feedback.textContent='Todavía no hay tiendas participantes en '+map.get(selected)+'. Puedes invitar una familia al piloto.';return;}
  feedback.textContent=stores.length+' tienda(s) real(es) que participan en '+map.get(selected)+'. No son ubicaciones exactas.';
  for(const shop of stores){
   const card=el('article','tgk-radar-store tgk-radar-real-result');
   const logo=safeImageUrl(shop.logo_url);
   if(logo){const img=el('img','tgk-radar-store-logo');img.src=logo;img.alt='Logo de '+shop.display_name;img.loading='lazy';card.append(img);}
   else card.append(el('span','tgk-radar-avatar','🧸'));
   const info=el('div','tgk-radar-store-info');
   info.append(el('h4','',shop.display_name),el('p','',shop.tagline||'¡Juguetes con nuevas aventuras!'));
   const actions=el('div','tgk-radar-store-actions');
   const url=new URL(directoryLink);url.searchParams.set('slug',shop.slug);
   const view=el('a','tgk-radar-store-link','Ver tienda');view.href=url.href;actions.append(view);
   const request=el('button','tgk-radar-connect','Conectar');request.type='button';
   request.addEventListener('click',async()=>{
    request.disabled=true;
    try{
     await getOwner();
     if(!owner){feedback.textContent='Para solicitar conexión, el adulto propietario debe iniciar sesión en Mi Tienda.';return;}
     if(owner.id===shop.store_id){feedback.textContent='Esta es tu propia tienda.';return;}
     if(!owner.is_published||!owner.radar_opt_in||!owner.radar_area_id){feedback.textContent='Primero publica tu tienda y habilita Toy Radar desde tu panel.';return;}
     const {error:err}=await client.from('tgk_connections').insert({from_store_id:owner.id,to_store_id:shop.store_id});
     if(err)throw err;
     request.textContent='Solicitada';
     feedback.textContent='Solicitud enviada. El otro adulto podrá responder en su panel.';
    }catch(e){feedback.textContent=e?.code==='23505'?'Ya existe una conexión o solicitud entre esas tiendas.':'No se pudo enviar: '+(e?.message||'Error de servidor');}
    finally{if(request.textContent!=='Solicitada')request.disabled=false;}
   });
   actions.append(request);card.append(info,actions);results.append(card);
  }
 }
 area.addEventListener('change',search);
 $('tgkRadarRealRefresh').addEventListener('click',search);
 const preferred=new URLSearchParams(location.search).get('radar_comuna');
 if(preferred&&map.has(preferred)){area.value=preferred;await search();}
}
