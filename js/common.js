const CONFIG = window.TGK_CONFIG || {};
const demoKey = CONFIG.demoStorageKey || 'tgk-demo-v1';
export const grades = {S:'Como nuevo',A:'Excelente',B:'Bueno',C:'Con detalles',D:'Incompleto'};
export const categories = {'Vehículos':'🏎️','Peluches':'🧸','Construcción':'🧱','Figuras':'🦖','Juegos':'🎲','Retro':'🕹️','Especiales':'⭐'};
export const statuses = {available:'Disponible',reserved:'Reservado',sold:'Vendido',hidden:'Oculto'};
export const money = value => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(value)||0);
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const safeImageUrl = value => {try{const url=new URL(value,location.href);return ['https:','http:'].includes(url.protocol) || (url.protocol==='data:' && /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value)) ? url.href : '';}catch{return '';}};
export const isLive = () => Boolean(CONFIG.supabaseUrl?.trim() && CONFIG.supabasePublishableKey?.trim());
let supabasePromise;
export async function getClient(){
  if(!isLive())return null;
  if(!supabasePromise){supabasePromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({createClient})=>createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true}}));}
  return supabasePromise;
}
const memoryStore=new Map();
const LS = {get(k){try{const raw=localStorage.getItem(k);return raw===null?(memoryStore.get(k)||null):JSON.parse(raw);}catch{return memoryStore.get(k)||null;}},set(k,v){memoryStore.set(k,v);try{localStorage.setItem(k,JSON.stringify(v));}catch(error){if(location.protocol!=='file:')throw error;}}};
export const localKeys = {toys:`${demoKey}:toys`,settings:`${demoKey}:settings`,basket:`${demoKey}:basket`};
export async function readToys(){
  if(isLive()){
    const client=await getClient(); const {data,error}=await client.from('toys').select('*').order('created_at',{ascending:false});
    if(error)throw error; return data||[];
  }
  const stored=LS.get(localKeys.toys); if(Array.isArray(stored))return stored;
  const result=await fetch('./data/juguetes.json',{cache:'no-store'});if(!result.ok)throw new Error('Abre este proyecto mediante un servidor local; consulta README.md');
  return result.json();
}
export async function writeToy(toy){
  if(isLive()){
    const client=await getClient();const {data,error}=await client.from('toys').upsert(toy,{onConflict:'id'}).select().single();
    if(error)throw error;return data;
  }
  const all=await readToys(); const index=all.findIndex(t=>t.id===toy.id);
  if(index>=0)all[index]=toy;else all.unshift(toy);
  LS.set(localKeys.toys,all);return toy;
}
export async function removeToy(toy){
  if(!toy?.id)throw new Error('No se identificó el juguete.');
  if(isLive()){
    const client=await getClient();
    const {data,error}=await client.from('toys').delete().eq('id',toy.id).select('id');
    if(error)throw error;
    if(!data?.length)throw new Error('No se pudo eliminar el juguete. Comprueba tu sesión y permisos.');
    const paths=(toy.photos||[]).flatMap(src=>{
      try{
        const url=new URL(src);
        if(url.origin!==new URL(CONFIG.supabaseUrl).origin)return [];
        const prefix='/storage/v1/object/public/toy-photos/';
        if(!url.pathname.startsWith(prefix))return [];
        const path=decodeURIComponent(url.pathname.slice(prefix.length));
        return path.startsWith(toy.id+'/')&&/\\.jpe?g$/i.test(path)?[path]:[];
      }catch{return [];}
    });
    if(paths.length){
      const {error:photoError}=await client.storage.from('toy-photos').remove(paths);
      if(photoError)return {photoCleanupError:photoError.message};
    }
    return {};
  }
  const all=await readToys();
  if(!all.some(item=>item.id===toy.id))throw new Error('El juguete ya no figura en el inventario.');
  LS.set(localKeys.toys,all.filter(item=>item.id!==toy.id));
  return {};
}
const defaultSettings={tagline:'Explora juguetes increíbles que buscan nuevos compañeros de juego. ¡Encuentra tu próximo tesoro!',whatsapp:''};
export async function readSettings(){
  if(isLive()){
    const client=await getClient();const {data,error}=await client.from('store_settings').select('tagline,whatsapp').eq('id',1).maybeSingle();
    if(error)throw error;return {...defaultSettings,...data};
  }
  return {...defaultSettings,...(LS.get(localKeys.settings)||{})};
}
export async function writeSettings(settings){
  if(isLive()){
    const client=await getClient();const {error}=await client.from('store_settings').upsert({id:1,...settings},{onConflict:'id'});if(error)throw error;
  }else LS.set(localKeys.settings,settings);
}
export function readBasket(){return LS.get(localKeys.basket)||[];}
export function writeBasket(items){LS.set(localKeys.basket,items);}
export function toast(message){const node=document.getElementById('toast');if(!node){alert(message);return;}node.textContent=message;node.classList.add('show');clearTimeout(node.timer);node.timer=setTimeout(()=>node.classList.remove('show'),3200);}
export async function copyText(text){
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}}
  catch{}
  const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();let ok=false;try{ok=document.execCommand('copy');}catch{}field.remove();return ok;
}
export function newId(){return crypto.randomUUID?crypto.randomUUID():`demo-${Date.now()}-${Math.floor(Math.random()*100000)}`;}
export function drawToy(toy){const image=safeImageUrl(toy.photos?.[0]);return image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(toy.title)}" loading="lazy">`:`<span class="toy-emoji" role="img" aria-label="Juguete">${escapeHtml(toy.emoji||categories[toy.category]||'🧸')}</span>`;}
export function watchUpdates(callback){
  if(!isLive()){
    window.addEventListener('storage',event=>{if([localKeys.toys,localKeys.settings].includes(event.key))callback();});return ()=>{};
  }
  // Lectura periódica de respaldo; la emisión instantánea requerirá habilitar Realtime.
  const timer=setInterval(()=>{if(!document.hidden)callback();},20000);
  return ()=>clearInterval(timer);
}
export async function compressImage(file){
  if(!file.type.startsWith('image/'))throw new Error('Selecciona una imagen válida.');
  if(file.size>15*1024*1024)throw new Error('La foto supera 15 MB.');
  const bitmap=await createImageBitmap(file);
  const maxSide=1100;const ratio=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo procesar la foto.')),'image/jpeg',.75));
}
export async function uploadPhoto(file,toyId){
  const blob=await compressImage(file);
  if(!isLive()){
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));reader.readAsDataURL(blob);});
  }
  const client=await getClient();const filename=`${toyId}/${newId()}.jpg`;
  const {error}=await client.storage.from('toy-photos').upload(filename,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw error;
  return client.storage.from('toy-photos').getPublicUrl(filename).data.publicUrl;
}