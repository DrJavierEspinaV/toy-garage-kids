const $=id=>document.getElementById(id);
const current=new URL('./',location.href);
const saved=sessionStorage.getItem('tgk-poster-url')|| (current.protocol==='https:' ? current.href : '');
$('posterUrl').value=saved;
function isHttpUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&u.hostname!=='';}catch{return false;}}
function render(){
 const input=$('posterUrl').value.trim();const qr=$('posterQr');qr.innerHTML='';
 if(!isHttpUrl(input)){qr.textContent='QR pendiente';$('posterUrlText').textContent='Escribe la URL publicada de la tienda.';return;}
 const target=new URL(input);target.searchParams.set('utm_source','afiche');
 sessionStorage.setItem('tgk-poster-url',input);
 if(typeof QRCode!=='undefined'){new QRCode(qr,{text:target.toString(),width:225,height:225,colorDark:'#191638',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});$('posterUrlText').textContent=target.origin+target.pathname;}
 else{qr.textContent='Biblioteca QR no disponible. Conéctate a internet para generar el código.';$('posterUrlText').textContent='No imprimas este afiche sin verificar el QR.';}
}
$('posterGenerate').addEventListener('click',render);
$('posterPrint').addEventListener('click',()=>{if(!$('posterQr').querySelector('img,canvas')){alert('Debes generar un QR válido antes de imprimir.');return;}window.print();});
// qrcodejs se carga por CDN; el listener load garantiza su disponibilidad cuando sea posible.
window.addEventListener('load',render);