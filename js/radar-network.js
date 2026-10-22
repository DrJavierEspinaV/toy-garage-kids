/* Toy Radar V1.8: tiendas reales por comuna, sin GPS */
import {getClient,isLive,safeImageUrl} from './common.js?v=multi16';
const root=document.getElementById('tgkLiveRadar');
const $=id=>document.getElementById(id);
function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el;}
async function init(){
 if(!root)return;
 const feedback=$('tgkRadarRealStatus');
 if(!isLive()){feedback.textContent='Red todavía no disponible. Puedes explorar la simulación.';return;}
 const client=await getClient();
 const area=$('tgkRadarArea');
 const {data:areas,error:areasError}=await client.from('radar_areas').select('id,label').order('label');
 if(areasError)throw areasError;
 for(const a of areas||[]){const option=node('option','',a.label);option.value=a.id;area.append(option);}
 let owner=null;
 async function getOwner(){
   const {data:{user}}=await client.auth.getUser();
   if(!user){owner=null;return;}
   const {data}=await client.from('stores').select('id,is_published,radar_opt_in,radar_area_id').eq('owner_user_id',user.id).maybeSingle();
   owner=data||null;
 }
 await getOwner();
 async function findStores(){
   const results=$('tgkRadarRealResults');results.replaceChildren();
   if(!area.value){feedback.textContent='Selecciona una comuna para explorar la red real.';return;}
   feedback.textContent='Buscando tiendas participantes...';
   const {data,error}=await client.from('storefronts')
      .select('store_id,slug,display_name,logo_url,tagline')
      .eq('is_published',true).eq('radar_opt_in',true).eq('radar_area_id',area.value)
      .order('display_name').limit(30);
   if(error){feedback.textContent='No fue posible consultar el directorio.';console.error(error);return;}
   const shops=(data||[]).filter(s=>s.store_id!==owner?.id);
   if(!shops.length){feedback.textContent='Aún no hay otras tiendas participantes en esta comuna. Puedes invitar una familia al piloto.';return;}
   feedback.textContent=shops.length+' tienda(s) publicada(s) voluntariamente en la comuna elegida; no se muestra distancia ni domicilio.';
   for(const shop of shops){
     const card=node('article','tgk-radar-real-card'),logo=safeImageUrl(shop.logo_url);
     if(logo){const img=node('img','tgk-radar-real-logo');img.src=logo;img.loading='lazy';img.alt='Logo de '+shop.display_name;card.append(img);}
     else card.append(node('span','tgk-radar-real-logo tgk-radar-real-avatar','🧸'));
     const content=node('div','tgk-radar-real-card-info');
     content.append(node('h4','',shop.display_name),node('p','tgk-radar-real-small',shop.tagline||'Juguetes con una nueva aventura'));
     const actions=node('div','tgk-radar-real-card-actions');
     const visit=node('a','','Ver tienda');visit.href='./tienda.html?slug='+encodeURIComponent(shop.slug);actions.append(visit);
     const request=node('button','','Solicitar conexión');request.type='button';
     request.addEventListener('click',async()=>{
       request.disabled=true;feedback.textContent='';
       try{
         await getOwner();
         if(!owner){feedback.textContent='Inicia sesión como adulto administrador de una tienda para enviar solicitudes.';return;}
         if(!owner.is_published||!owner.radar_opt_in||!owner.radar_area_id){
           feedback.textContent='Activa Toy Radar en tu panel familiar antes de solicitar conexiones.';return;
         }
         const {error:insertError}=await client.from('tgk_connections').insert({from_store_id:owner.id,to_store_id:shop.store_id});
         if(insertError)throw insertError;
         request.textContent='Solicitud enviada';
         feedback.textContent='Solicitud enviada a '+shop.display_name+'. El otro adulto la recibirá en su panel.';
       }catch(e){feedback.textContent=e?.code==='23505'?'Ya existe una solicitud entre estas dos tiendas.':'No se pudo enviar: '+(e?.message||'Error');}
       finally{if(request.textContent!=='Solicitud enviada')request.disabled=false;}
     });
     actions.append(request);content.append(actions);card.append(content);results.append(card);
   }
 }
 area.addEventListener('change',findStores);
 $('tgkRadarRealRefresh').addEventListener('click',async()=>{await getOwner();await findStores();});
}
init().catch(err=>{console.error(err);if(root)$('tgkRadarRealStatus').textContent='No se pudo iniciar la red real. Revisa tu conexión.';});
