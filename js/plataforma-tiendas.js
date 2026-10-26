/* Directorio institucional Toy Garage Kids.
   Solo identidades de tiendas publicadas; no importa datos privados ni inicia sesión. */
import {getClient,isLive,safeImageUrl} from './common.js?v=auth-v27';
async function main(){
 if(!isLive())return;
 const client=await getClient();
 const {data,error}=await client.from('storefronts')
  .select('slug,display_name,logo_url,is_published')
  .in('slug',['cristobal-isidora','la-tienda-isi'])
  .eq('is_published',true);
 if(error){console.warn('No se pudo actualizar la identidad pública de las tiendas',error);return;}
 for(const store of data||[]){
  const id=store.slug==='cristobal-isidora'?'Founder':'Isi';
  const title=document.getElementById('platform'+id+'Name');
  if(title)title.textContent=store.display_name;
  const logo=safeImageUrl(store.logo_url);
  if(!logo)continue;
  if(id==='Founder'){
   const image=document.getElementById('platformFounderLogo');
   if(image)image.src=logo;
  }else{
   const fallback=document.getElementById('platformIsiFallback');
   if(!fallback)continue;
   const image=document.createElement('img');
   image.src=logo;image.loading='lazy';
   image.width=122;image.height=122;
   image.alt='Logo de '+store.display_name;
   image.addEventListener('load',()=>fallback.replaceWith(image),{once:true});
  }
 }
}
main().catch(err=>console.warn('Identidades públicas no disponibles',err));
