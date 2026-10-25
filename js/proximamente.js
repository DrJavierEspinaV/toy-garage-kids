/* Volver a la tienda de origen sin usar ubicación del visitante. */
(()=>{
 const slug=new URLSearchParams(location.search).get('desde')||'';
 if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=80){
  const url=new URL('./tienda.html',location.href);
  url.searchParams.set('slug',slug);
  const a=document.getElementById('soonReturn');
  a.href=url.href;
  a.textContent='← Volver a la tienda que estabas visitando';
 }
})();
