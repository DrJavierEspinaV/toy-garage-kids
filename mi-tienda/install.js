/* El piloto PWA se instala SÓLO después de validar un adulto propietario.
 * Nunca mostramos el instalador en el registro público.
 * Esto no es una barrera de compra: la licencia Google Play futura se validará en servidor.
 */
(()=>{
 const panel=document.getElementById('authorizedInstall');
 const button=document.getElementById('installFamilyApp');
 const help=document.getElementById('installHelp');
 const scope=new URL('./',location.href).href;
 let authorized=false;
 let deferred=null;
 let manifest=null;
 const isInstalled=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
 async function clearOldPublicInstallation(){
  // Limpiar el antiguo service worker v19, registrado antes de autenticar.
  try{
   if(!('serviceWorker' in navigator))return;
   const registrations=await navigator.serviceWorker.getRegistrations();
   for(const registration of registrations){
    if(registration.scope===scope)await registration.unregister();
   }
   if('caches' in window){
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('tgk-mi-tienda-shell-')).map(k=>caches.delete(k)));
   }
  }catch(err){console.warn('No se pudo limpiar la instalación anterior',err);}
 }
 function setInstallVisibility(){
  panel.hidden=!authorized||isInstalled;
  button.hidden=!authorized||isInstalled||!deferred;
  if(!authorized||isInstalled)return;
  help.textContent=deferred
   ?'Esta cuenta tiene una tienda activada. Puedes instalar la versión piloto en este dispositivo.'
   :'Si Chrome no muestra el botón, abre el menú ⋮ y selecciona «Instalar aplicación» después de iniciar sesión. El panel seguirá requiriendo contraseña.';
 }
 function enableManifest(){
  if(manifest)return;
  manifest=document.createElement('link');
  manifest.rel='manifest';
  manifest.href='./manifest.webmanifest?v=28';
  document.head.append(manifest);
 }
 async function enableApp(){
  enableManifest();
  // Solo registrar el SW tras autenticar a un propietario real.
  try{
   if('serviceWorker' in navigator&&location.protocol==='https:'){
    await navigator.serviceWorker.register('./sw.js?v=28',{scope:'./'});
   }
  }catch(err){console.warn('Service worker de prueba no disponible',err);}
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  // Chrome puede emitir este evento antes de la validación: nunca mostrarlo hasta autorizar.
  deferred=event;
  setInstallVisibility();
 });
 window.addEventListener('appinstalled',()=>{
  deferred=null;
  panel.hidden=true;
 });
 window.addEventListener('tgk:install-eligibility',async event=>{
  const next=event.detail?.allowed===true;
  authorized=next;
  setInstallVisibility();
  if(next)await enableApp();
  else{
   manifest?.remove();manifest=null;
   // Evitar que una visita futura reutilice el SW antiguo.
   await clearOldPublicInstallation();
  }
  setInstallVisibility();
 });
 button?.addEventListener('click',async()=>{
  if(!authorized||!deferred||!button||button.hidden)return;
  const prompt=deferred;deferred=null;
  button.hidden=true;
  try{await prompt.prompt();await prompt.userChoice;}catch(err){console.warn('Instalación cancelada o no disponible',err);}
  setInstallVisibility();
 });
 // Por defecto no hay manifest ni instalador. Desregistrar SW v19 al abrir el login.
 if(document.body?.dataset?.installAuthorized!=='true')clearOldPublicInstallation();
})();
