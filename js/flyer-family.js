/* Afiche QR público universal V2.4. Textos personalizados en storefronts,
 * propiedad de cada adulto; solo datos publicados y ninguna dirección privada.
 */
import {getClient,isLive,safeImageUrl} from './common.js?v=multi16';
const $=id=>document.getElementById(id);
const slug=String(new URLSearchParams(location.search).get('slug')||'').trim().toLowerCase();
const validSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fallback={
 headline:'MIS JUGUETES BUSCAN NUEVAS AVENTURAS',
 story:'Han sido parte de momentos muy bonitos y ahora están listos para seguir jugando.',
 closing:'Quizás sus próximas aventuras están contigo.',
 cta:'Escanea el QR y conócelos.'
};
function error(message){
 $('flyerNotice').textContent=message;
 $('flyer').hidden=true;
 $('printFlyer').disabled=true;
}
function brandFallback(){
 const image=$('flyerLogo');
 image.hidden=true;
 image.removeAttribute('src');
 $('flyerFallback').hidden=false;
}
$('printFlyer').addEventListener('click',()=>{if(!$('flyer').hidden)window.print();});
async function start(){
 if(!validSlug.test(slug)||slug.length>80)return error('El enlace de esta tienda no es válido.');
 if(!isLive())return error('No fue posible conectar con el catálogo público.');
 const client=await getClient();
 const {data:store,error:queryError}=await client.from('storefronts')
  .select('slug,display_name,tagline,logo_url,is_published,theme_preset,poster_copy')
  .eq('slug',slug).eq('is_published',true).maybeSingle();
 if(queryError||!store)return error('Esta tienda aún no está publicada. Publica el catálogo para imprimir un afiche con QR.');
 const catalog=new URL('./tienda.html',location.href);
 catalog.searchParams.set('slug',store.slug);
 const target=catalog.href;
 document.title='Afiche QR · '+store.display_name;
 document.body.dataset.theme=['galaxia','caramelo','menta','sol','oceano'].includes(store.theme_preset)?store.theme_preset:'galaxia';
 $('backToStore').href=target;
 $('flyerTitle').textContent=store.display_name;
 const text=store.poster_copy&&typeof store.poster_copy==='object'?store.poster_copy:fallback;
 for(const key of ['headline','story','closing','cta']){
  const output={headline:'flyerHeadline',story:'flyerStory',closing:'flyerClosing',cta:'flyerCTA'}[key];
  const value=String(text[key]||fallback[key]).trim();
  $(output).textContent=value;
 }
 $('flyerCatalogUrl').textContent=target;
 const logo=safeImageUrl(store.logo_url);
 if(logo){
  const img=$('flyerLogo');
  img.addEventListener('load',()=>{img.hidden=false;$('flyerFallback').hidden=true;},{once:true});
  img.addEventListener('error',brandFallback,{once:true});
  img.src=logo;
 }else brandFallback();
 if(typeof window.QRCode!=='function')return error('No se pudo cargar el generador de QR. Comprueba tu conexión y actualiza la página.');
 try{
  new window.QRCode($('flyerQr'),{
   text:target,width:216,height:216,colorDark:'#151833',colorLight:'#ffffff',
   correctLevel:window.QRCode.CorrectLevel.M
  });
 }catch(e){console.error(e);return error('Error creando el QR. Actualiza la página e inténtalo otra vez.');}
 $('flyer').hidden=false;
 $('printFlyer').disabled=false;
 $('flyerNotice').textContent='';
}
start().catch(e=>{console.error(e);error('No fue posible preparar este afiche. Vuelve a intentarlo.');});
