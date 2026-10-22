import {getClient,isLive,money,safeImageUrl} from './common.js?v=multi16';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),slug=(params.get('slug')||'').toLowerCase();
function el(t,cls,content){const x=document.createElement(t);if(cls)x.className=cls;if(content!==undefined)x.textContent=String(content);return x;}
function showError(message){$('storeError').hidden=false;$('storeError').replaceChildren(el('h2','',message),el('p','','Puedes regresar a la tienda fundadora o consultar al adulto que te compartió el enlace.'));}
async function main(){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)return showError('Enlace de tienda inválido.');
 if(!isLive())return showError('El catálogo no está disponible en este momento.');
 const client=await getClient();
 const {data:store,error:storeErr}=await client.from('storefronts').select('store_id,slug,display_name,logo_url,tagline').eq('slug',slug).eq('is_published',true).maybeSingle();
 if(storeErr||!store)return showError('Esta tienda no está publicada o no existe.');
 const {data:toys,error:toyErr}=await client.from('toys').select('id,title,description,price,status,category,grade,photos,emoji').eq('store_id',store.store_id).neq('status','hidden').order('created_at',{ascending:false});
 if(toyErr)return showError('No fue posible cargar los juguetes.');
 $('storeError').hidden=true;$('publicStore').hidden=false;document.title=store.display_name+' · Toy Garage Kids';
 $('publicTitle').textContent=store.display_name;$('publicTagline').textContent=store.tagline||'¡Cada juguete merece una nueva aventura!';
 const logo=safeImageUrl(store.logo_url);if(logo){$('publicLogo').src=logo;$('publicLogo').hidden=false;}
 $('publicCount').textContent=(toys||[]).length+' juguetes';
 const root=$('publicToys');root.replaceChildren();
 if(!(toys||[]).length){root.append(el('p','','Esta familia está preparando su colección. ¡Vuelve pronto!'));return;}
 for(const t of toys){
 const card=el('article','family-product'),media=el('div','family-product-media');
 const imgUrl=safeImageUrl(t.photos?.[0]);
 if(imgUrl){const img=el('img');img.src=imgUrl;img.loading='lazy';img.alt=t.title;media.append(img);}else media.textContent=t.emoji||'🧸';
 const body=el('div','family-product-body');body.append(el('strong','',t.title));
 body.append(el('p','',t.description||t.category));
 const foot=el('div');foot.style.display='flex';foot.style.justifyContent='space-between';foot.style.alignItems='center';foot.style.gap='9px';foot.append(el('span','family-price',money(t.price)),el('span','family-pill',t.status==='available'?'Disponible':t.status==='reserved'?'Reservado':'Vendido'));body.append(foot);card.append(media,body);root.append(card);
 }
}
main().catch(err=>{console.error(err);showError('No se pudo cargar esta tienda.');});
