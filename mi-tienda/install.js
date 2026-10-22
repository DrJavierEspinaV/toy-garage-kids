/* Aplicación instalada independiente. No registra SW fuera de /mi-tienda/. */
(()=>{
 const btn=document.getElementById('installFamilyApp');
 const help=document.getElementById('installHelp');
 let promptEvent=null;
 if('serviceWorker' in navigator && location.protocol==='https:'){
   navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
 }
 const setOffline=()=>{if(!navigator.onLine&&help)help.textContent='Sin conexión. Conéctate a Internet para registrar tu cuenta y gestionar tus juguetes.';};
 window.addEventListener('offline',setOffline);
 window.addEventListener('online',()=>{if(help)help.textContent='En Chrome, usa ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».';});
 setOffline();
 window.addEventListener('beforeinstallprompt',event=>{
   event.preventDefault();promptEvent=event;if(btn)btn.hidden=false;
 });
 if(btn)btn.addEventListener('click',async()=>{
   if(!promptEvent)return;
   const choice=promptEvent;promptEvent=null;btn.hidden=true;
   try{await choice.prompt();}catch{}
 });
 window.addEventListener('appinstalled',()=>{
   if(btn)btn.hidden=true;
   if(help)help.textContent='Aplicación instalada. Ábrela desde el ícono de tu teléfono.';
 });
})();