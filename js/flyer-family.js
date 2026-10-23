/* Afiche universal V2.1 · usa solo datos PUBLICADOS de la tienda indicada.
 * El afiche tiene un enlace público; no lee información de propietarios ni inventarios privados.
 */
import {getClient,isLive,safeImageUrl} from './common.js?v=multi16';
const $=id=>document.getElementById(id);
const slug=(new URLSearchParams(location.search).get('slug')||'').trim().toLowerCase();
const valid=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const notice=$('flyerNotice');
const showError=message=>{notice.textContent=message;$('flyer').hidden=true;$('printFlyer').disabled=true;};
$('printFlyer').addEventListener('click',()=>{if(!$('#flyer').hidden)window.print();});
function fallbackLogo(){
 const image=$('flyerLogo');image.hidden=true;image.removeAttribute('src');
 $('flyerFallback').hidden=false;
}
async function main(){
 if(!valid.test(slug)||slug.length>80)return showError('Enlace de tienda no válido.');
 if(!isLive())return showError('No fue posible conectar con el directorio de tiendas.');
 const client=await getClient();
 const {data:store,error}=await client.from('storefronts')
  .select('slug,display_name,tagline,logo_url,is_published')
  .eq('slug',slug).eq('is_published',true).maybeSingle();
 if(error||!store)return showError('Esta tienda no está publicada. Publica tu catálogo antes de imprimir un afiche.');
 const catalog=new URL('./tienda.html',location.href);
 catalog.searchParams.set('slug',store.slug);
 const url=catalog.href;
 document.title='Afiche QR · '+store.display_name;
 $('backToStore').href=url;
 $('flyerTitle').textContent=store.display_name;
 $('flyerTagline').textContent=store.tagline||'¡Cada juguete merece una nueva aventura!';
 $('flyerCatalogUrl').textContent=url;
 const logo=safeImageUrl(store.logo_url);
 if(logo){
   const image=$('flyerLogo');image.onload=()=>{image.hidden=false;$('flyerFallback').hidden=true;};
   image.onerror=fallbackLogo;image.src=logo;
 }else fallbackLogo();
 if(typeof window.QRCode!=='function')return showError('No se cargó el generador de QR. Comprueba tu conexión a internet y actualiza la página.');
 try{
  new window.QRCode($('flyerQr'),{text:url,width:214,height:214,colorDark:'#161732',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});
 }catch(e){console.error(e);return showError('No se pudo crear el código QR. Vuelve a intentarlo.');}
 notice.textContent='';
 $('flyer').hidden=false;
 $('printFlyer').disabled=false;
}
main().catch(e=>{console.error(e);showError('No fue posible preparar este afiche. Revisa tu conexión.');});
