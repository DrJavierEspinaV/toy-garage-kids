/* Un enlace para adquirir la aplicación, otro para gestionar tiendas existentes.
 * Invitaciones de prueba: solo mediante enlace privado desde el fundador.
 * Nunca inventar la ficha de Google Play.
 */
(()=>{
 const cfg=window.TGK_CONFIG||{};
 const realPlay=cfg.acquisitionMode==='commercial' &&
   /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[a-zA-Z][a-zA-Z0-9_.]+(?:&[^#]*)?$/.test(String(cfg.playStoreUrl||''));
 const destination=new URL('./proximamente.html',location.href);
 const slug=new URLSearchParams(location.search).get('slug')||'';
 if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=80)destination.searchParams.set('desde',slug);
 for(const a of document.querySelectorAll('[data-create-store]')){
  a.href=realPlay?cfg.playStoreUrl:destination.href;
  a.title=realPlay?'Comprar en Google Play':'Próximamente en Google Play; todavía no disponible para comprar';
  a.removeAttribute('aria-disabled');
  if(realPlay){a.target='_blank';a.rel='noopener noreferrer';}
  else{a.removeAttribute('target');a.removeAttribute('rel');}
 }
 for(const note of document.querySelectorAll('[data-create-store-note]')){
  note.textContent='Próximamente en Google Play · Pago único, sin suscripciones. Los registros del piloto son solo por invitación privada.';
 }
})();
