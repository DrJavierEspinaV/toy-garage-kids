import {getClient,isLive,safeImageUrl} from './common.js?v=auth-v27';
const area=document.getElementById('platformArea'),grid=document.getElementById('platformStoreGrid'),status=document.getElementById('platformStoresStatus'),form=document.getElementById('platformAreaForm'),button=document.getElementById('platformSearchButton');
const el=(tag,txt,cls)=>{const x=document.createElement(tag);x.textContent=txt||'';if(cls)x.className=cls;return x;};
const note=s=>status.textContent=s;
function card(s){
 const link=s.slug==='cristobal-isidora'?new URL('./index.html',location.href):new URL('./tienda.html',location.href);
 if(s.slug!=='cristobal-isidora')link.searchParams.set('slug',s.slug);
 const box=el('article','','store-card'),info=el('div','','store-card-info');
 const fallback=el('div','🧸','store-icon');fallback.setAttribute('aria-hidden','true');
 const src=safeImageUrl(s.logo_url);
 if(src){const img=el('img');img.src=src;img.alt='Logo de '+s.display_name;img.loading='lazy';img.width=122;img.height=122;img.addEventListener('error',()=>img.replaceWith(fallback),{once:true});box.append(img);}
 else box.append(fallback);
 info.append(el('span','♻️ TIENDA FAMILIAR PARTICIPANTE'),el('h3',s.display_name),el('p',s.tagline||'Juguetes con nuevas aventuras'));
 const a=el('a','🧸 Visitar tienda');a.href=link.href;info.append(a);box.append(info);grid.append(box);
}
async function init(){
 if(!isLive()){note('Directorio sin conexión.');return;}
 const db=await getClient(),labels=new Map();
 const {data:zones,error}=await db.from('radar_areas').select('id,label').order('label');
 if(error)throw error;
 area.replaceChildren();
 const empty=el('option','Selecciona una comuna…');empty.value='';area.append(empty);
 for(const z of zones||[]){labels.set(z.id,z.label);const opt=el('option',z.label);opt.value=z.id;area.append(opt);}
 area.disabled=false;button.disabled=false;
 let sequence=0;
 async function search(){
  const q=++sequence,id=area.value;grid.replaceChildren();
  if(!labels.has(id)){note('Selecciona una comuna para descubrir tiendas.');return;}
  note('Buscando tiendas en '+labels.get(id)+'…');
  const {data,error}=await db.from('storefronts').select('slug,display_name,logo_url,tagline')
   .eq('is_published',true).eq('radar_opt_in',true).eq('radar_area_id',id).order('display_name').limit(60);
  if(q!==sequence)return;
  if(error){note('No se pudieron cargar las tiendas. Intenta nuevamente.');return;}
  for(const s of data||[])card(s);
  note(data?.length?(data.length+' tienda(s) en '+labels.get(id)+'.'):'Aún no hay tiendas participantes en '+labels.get(id)+'.');
 }
 form.addEventListener('submit',e=>{e.preventDefault();search().catch(console.error);});
 area.addEventListener('change',()=>search().catch(console.error));
 const suggested=new URLSearchParams(location.search).get('comuna');
 if(suggested&&labels.has(suggested)){area.value=suggested;await search();}
 else note('Elige una comuna. Puedes explorar sin cuenta y sin descargar la aplicación.');
}
init().catch(e=>{console.error(e);note('No se pudo conectar. Recarga la página.');});
