/* La compra comercial exige enlace real de Google Play + validación de licencia servidor.
   Solo el piloto permite alta con invitación fundadora. Los catálogos son públicos. */
(()=>{
 const cfg=window.TGK_CONFIG||{};
 const commercial=cfg.acquisitionMode==='commercial';
 const url=String(cfg.playStoreUrl||'').trim();
 const valid=/^https:\/\/play\.google\.com\/store\/apps\/details\?id=[a-zA-Z][a-zA-Z0-9_.]+(?:&[^#]*)?$/.test(url);
 for(const a of document.querySelectorAll('[data-create-store]')){
  if(!commercial){a.href=new URL('./mi-tienda/#registro',location.href).href;a.title='Piloto solo por invitación de la familia fundadora';}
  else if(valid){a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.title='Comprar y descargar la aplicación desde Google Play';}
  else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.textContent='📲 Próximamente en Google Play';a.title='Enlace comercial todavía no configurado';}
 }
 for(const el of document.querySelectorAll('[data-create-store-note]')){
   el.textContent=commercial?'Compra única en Google Play, al publicarse la aplicación.':'Piloto por invitación de la tienda fundadora · Solo adultos.';
 }
})();
