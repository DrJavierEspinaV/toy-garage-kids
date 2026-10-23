/* Toy Garage Kids · V2.0: catálogo público independiente, navegación y consultas.
 * No se realizan pagos, reservas ni ofertas reales.
 * Cada carrito se guarda únicamente bajo el identificador de su propia tienda.
 */
import {getClient,isLive,money,safeImageUrl,categories,grades,statuses,copyText} from './common.js?v=multi16';

const $=id=>document.getElementById(id);
const slug=(new URLSearchParams(location.search).get('slug')||'').trim().toLowerCase();
const validSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
let store=null, toys=[],cart=[],category='Todas',query='',order='newest';
let toastTimer=null;
const cartKey='tgk-selection-v2:'+slug;

function node(tag,cls,value){
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(value!==undefined)element.textContent=String(value);
 return element;
}
function notify(message){
 const toast=$('familyPublicToast');toast.textContent=message;
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{toast.textContent='';},4000);
}
function error(message){
 $('publicStore').hidden=true;
 const box=$('storeError');box.hidden=false;box.replaceChildren(node('h2','',message),node('p','','Comprueba el enlace del catálogo o pide ayuda al adulto que lo compartió.'));
}
function put(ids){
 cart=[...new Set(ids)].filter(id=>toys.some(t=>t.id===id && t.status==='available' && t.sale_mode!=='battle'));
 try{localStorage.setItem(cartKey,JSON.stringify(cart));}catch{/* navegadores privados */}
 $('basketCount').textContent=cart.length;
 renderCart();
}
function loadCart(){
 let stored=[];
 try{const value=JSON.parse(localStorage.getItem(cartKey)||'[]');if(Array.isArray(value))stored=value.filter(x=>typeof x==='string');}catch{}
 put(stored);
}
function visibleToys(){
 const term=query.toLocaleLowerCase('es');
 const filtered=toys.filter(t=>(category==='Todas'||t.category===category) &&
  [t.title,t.description,t.category].some(x=>String(x||'').toLocaleLowerCase('es').includes(term)));
 filtered.sort((a,b)=>order==='cheap'?a.price-b.price:order==='expensive'?b.price-a.price:
   order==='name'?a.title.localeCompare(b.title,'es'):(new Date(b.created_at||0)-new Date(a.created_at||0)));
 return filtered;
}
function imageFor(t){
 const shell=node('div','card-visual');
 const src=safeImageUrl(t.photos?.[0]);
 if(src){const img=node('img','family-public-photo');img.src=src;img.alt='Fotografía de '+t.title;img.loading='lazy';shell.append(img);}
 else shell.append(node('span','family-public-placeholder',t.emoji||categories[t.category]||'🧸'));
 const badge=node('span','status-badge'+(t.status==='available'?'':' '+t.status),
    t.status==='available'?(t.sale_mode==='battle'?'⚡ BATTLE':'● DISPONIBLE'):(statuses[t.status]||t.status).toUpperCase());
 shell.append(badge);
 shell.append(node('span','grade-badge','NIVEL '+(t.grade||'B')));
 return shell;
}
function renderFilters(){
 const el=$('categoryFilters');el.replaceChildren();
 const available=['Todas',...Object.keys(categories).filter(c=>toys.some(t=>t.category===c))];
 for(const c of available){
   const b=node('button','filter-pill',(c==='Todas'?'✨':categories[c]||'⭐')+' '+c);
   b.type='button';b.dataset.category=c;b.setAttribute('aria-pressed',String(category===c));
   b.addEventListener('click',()=>{category=c;renderFilters();renderCatalogue();});
   el.append(b);
 }
}
function renderCatalogue(){
 const filtered=visibleToys(),root=$('catalogGrid');root.replaceChildren();
 $('catalogCounter').textContent=filtered.length+' FICHAS';
 $('catalogEmpty').hidden=filtered.length>0;
 for(const t of filtered){
  const card=node('article','toy-card grade-'+(t.grade||'B'));
  card.append(imageFor(t));
  const body=node('div','card-body');
  body.append(node('div','type-label',(categories[t.category]||'⭐')+' '+t.category.toUpperCase()),node('h3','',t.title));
  body.append(node('p','card-desc',String(t.description||'Juguete en busca de una nueva aventura').slice(0,120)));
  const foot=node('div','card-bottom');
  const price=node('div','card-price');
  price.append(node('small','',t.sale_mode==='battle'?'PRECIO DE SALIDA':'PRECIO'),node('span','',money(t.sale_mode==='battle'?(t.battle_base??t.price):t.price)));
  foot.append(price);body.append(foot);
  const actions=node('div','family-public-card-actions');
  const detail=node('button','family-detail-button','🔎 Ver ficha');detail.type='button';detail.addEventListener('click',()=>openToy(t.id));actions.append(detail);
  if(t.status==='available'&&t.sale_mode!=='battle'){
   const add=node('button','family-add-button',cart.includes(t.id)?'✓ En selección':'🎒 Agregar');
   add.type='button';add.addEventListener('click',()=>addToy(t.id));actions.append(add);
  }else{
   const label=node('span','family-public-unavailable',t.sale_mode==='battle'?'⚡ Ofertas no habilitadas':(statuses[t.status]||'No disponible'));
   actions.append(label);
  }
  body.append(actions);card.append(body);root.append(card);
 }
}
function renderBattle(){
 const root=$('familyBattlePreview');root.replaceChildren();
 const featured=toys.filter(t=>t.sale_mode==='battle'&&t.status==='available').slice(0,3);
 if(!featured.length){
  root.append(node('div','family-public-battle-empty','🏆 Aún no hay Battle activas. Las ofertas reales están en preparación.'));
  return;
 }
 for(const t of featured){
  const card=node('div','battle-card');
  card.append(node('div','battle-toy',t.emoji||'⚡'));
  const details=node('div');details.append(node('span','battle-demo-label','⚡ OFERTAS NO HABILITADAS'),node('h3','',t.title),
    node('p','','Precio de salida orientativo · '+(grades[t.grade]||'Usado')),node('strong','',money(t.battle_base??t.price)));
  card.append(details);root.append(card);
 }
}
function addToy(id){
 const t=toys.find(x=>x.id===id);
 if(!t||t.status!=='available'||t.sale_mode==='battle'){notify('Este juguete no puede seleccionarse ahora.');return;}
 if(!cart.includes(id))put([...cart,id]);
 else notify('Este juguete ya está en tu selección.');
 if(cart.includes(id))notify('🎒 '+t.title+' agregado a tu selección.');
 renderCatalogue();
 const dialog=$('toyDialog');if(dialog.open)dialog.close();
}
function openToy(id){
 const t=toys.find(x=>x.id===id);if(!t)return;
 const dialog=$('toyDialog'),root=$('toyDialogBody');root.replaceChildren();
 $('toyDialogTitle').textContent=t.title;
 const sources=(t.photos||[]).map(safeImageUrl).filter(Boolean);
 if(sources.length){
  const img=node('img','family-public-detail-photo');img.src=sources[0];img.alt='Foto de '+t.title;root.append(img);
  if(sources.length>1){
   let i=0;const next=node('button','family-secondary','Ver siguiente fotografía →');
   next.type='button';next.addEventListener('click',()=>{i=(i+1)%sources.length;img.src=sources[i];img.alt='Foto '+(i+1)+' de '+t.title;});
   root.append(next);
  }
 } else root.append(node('div','family-public-no-photo',t.emoji||'🧸'));
 root.append(node('p','family-public-detail-info',t.description||'Sin descripción adicional'));
 root.append(node('p','family-public-detail-info','Tipo: '+t.category+' · Conservación: '+(grades[t.grade]||'Sin especificar')));
 if(t.condition_note)root.append(node('p','family-public-detail-info','Observaciones: '+t.condition_note));
 root.append(node('p','family-public-detail-info','Estado: '+(statuses[t.status]||t.status)));
 root.append(node('strong','family-public-detail-price',money(t.sale_mode==='battle'?(t.battle_base??t.price):t.price)));
 if(t.status==='available'&&t.sale_mode!=='battle'){
   const action=node('button','action action-primary','🎒 Agregar a mi selección');
   action.type='button';action.addEventListener('click',()=>addToy(t.id));root.append(action);
 }else root.append(node('p','family-public-detail-info',t.sale_mode==='battle'?'⚡ Battle en preparación. No se admiten ofertas reales.':'Este juguete no está disponible para solicitar.'));
 dialog.showModal();
}
function renderCart(){
 const root=$('basketContent');root.replaceChildren();
 const selected=cart.map(id=>toys.find(t=>t.id===id)).filter(Boolean);
 if(!selected.length)root.append(node('p','empty-state','Tu selección está vacía. Elige un juguete de esta tienda.'));
 for(const t of selected){
  const row=node('div','family-public-cart-item');
  const info=node('div');info.append(node('strong','',t.title),node('p','',money(t.price)));
  const remove=node('button','','Quitar');remove.type='button';remove.setAttribute('aria-label','Quitar '+t.title);
  remove.addEventListener('click',()=>{put(cart.filter(id=>id!==t.id));renderCatalogue();});
  row.append(info,remove);root.append(row);
 }
 if(selected.length){
  const total=selected.reduce((sum,t)=>sum+Number(t.price||0),0);
  const row=node('div','family-public-cart-item');
  row.append(node('strong','','TOTAL REFERENCIAL'),node('strong','',money(total)));root.append(row);
 }
 $('shareBasket').disabled=!selected.length;
}
function buildInquiry(){
 const selected=cart.map(id=>toys.find(t=>t.id===id)).filter(Boolean);
 if(!selected.length)return '';
 const total=selected.reduce((n,t)=>n+Number(t.price||0),0);
 return '¡Hola! Soy un adulto interesado en estos juguetes de '+store.display_name+':\n'
  +selected.map(t=>'• '+t.title+' — '+money(t.price)).join('\n')
  +'\nTotal referencial: '+money(total)
  +'\nCatálogo: '+location.href.split('#')[0]
  +'\n¿Podemos confirmar disponibilidad, estado del producto y una forma segura de coordinar la entrega?\n'
  +'Entiendo que esto no realiza pagos ni confirma reservas.';
}
async function inquiry(){
 if(!store||!cart.length)return;
 const message=buildInquiry();
 const phone=String(store.contact_whatsapp||'').replace(/\D/g,'');
 if(phone){
   const dest='https://wa.me/'+phone+'?text='+encodeURIComponent(message);
   window.open(dest,'_blank','noopener');
   notify('Abriendo WhatsApp del adulto responsable para consultar.');
   return;
 }
 if(navigator.share){
   try{
     await navigator.share({title:'Consulta · '+store.display_name,text:message,url:location.href.split('#')[0]});
     notify('Consulta compartida. Recuerda enviarla al adulto responsable.');
     return;
   }catch(e){if(e.name==='AbortError')return;}
 }
 const copied=await copyText(message);
 notify(copied?'Consulta copiada. Envíala al adulto administrador de la tienda.':'No se pudo compartir. Copia el enlace y contacta al adulto.');
}
async function main(){
 if(!validSlug.test(slug)||slug.length>80)return error('El enlace de esta tienda no es válido.');
 if(!isLive())return error('La tienda no está disponible en este momento.');
 const client=await getClient();
 const {data:shop,error:shopError}=await client.from('storefronts')
  .select('store_id,slug,display_name,logo_url,tagline,contact_whatsapp')
  .eq('slug',slug).eq('is_published',true).maybeSingle();
 if(shopError||!shop)return error('Esta tienda no está publicada o no existe.');
 const {data:items,error:itemsError}=await client.from('toys')
  .select('id,title,description,condition_note,price,status,category,grade,photos,emoji,sale_mode,battle_base,created_at')
  .eq('store_id',shop.store_id).neq('status','hidden').order('created_at',{ascending:false});
 if(itemsError)return error('No se pudo cargar el inventario de esta familia.');
 store=shop;toys=items||[];$('publicStore').hidden=false;$('storeError').hidden=true;
 document.title=store.display_name+' · Mi Tienda';
 $('publicTitle').textContent=store.display_name;
 $('storeHeaderTitle').textContent=store.display_name;
 $('storeFooterTitle').textContent='🧸 '+store.display_name;
 $('publicTagline').textContent=store.tagline||'¡Cada juguete merece una nueva aventura!';
 const logo=safeImageUrl(store.logo_url);
 if(logo){$('publicLogo').src=logo;$('publicLogo').hidden=false;}
 $('publicTotal').textContent=toys.length;
 $('publicAvailable').textContent=toys.filter(t=>t.status==='available'&&t.sale_mode!=='battle').length;
 $('publicBattles').textContent=toys.filter(t=>t.sale_mode==='battle'&&t.status==='available').length;
 $('searchInput').addEventListener('input',e=>{query=e.target.value.trim();renderCatalogue();});
 $('sortSelect').addEventListener('change',e=>{order=e.target.value;renderCatalogue();});
 $('basketBtn').addEventListener('click',()=>{$('basketDialog').showModal();});
 $('closeBasket').addEventListener('click',()=>$('basketDialog').close());
 $('closeToy').addEventListener('click',()=>$('toyDialog').close());
 $('shareBasket').addEventListener('click',inquiry);
 for(const dialogId of ['basketDialog','toyDialog']){
  const d=$(dialogId);d.addEventListener('click',event=>{
   if(event.target===d)d.close();
  });
 }
 loadCart();renderFilters();renderCatalogue();renderBattle();
}
main().catch(e=>{console.error(e);error('Error al cargar el catálogo de esta familia.');});
