/* Battle Arena V1: visor y oferta adulta. Controles reales en servidor PostgreSQL.
 * No expone identidades de otros ofertantes, pagos ni datos bancarios.
 */
import {getClient,isLive,money,safeImageUrl} from './common.js?v=auth-v27';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const slug=(params.get('slug')||'').trim(),toyId=(params.get('toy')||'').trim();
const validSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/, validUUID=/^[a-f0-9-]{36}$/i;
let client=null,battle=null,toy=null,store=null,user=null;
const node=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
function report(message){$('battleStatus').textContent=message;}
function setUser(ready){
 $('battleLoginPanel').hidden=!ready||!!user;
 $('battleBidPanel').hidden=!ready||!user;
 if(user)$('battleUserLabel').textContent='Adulto: '+(user.email||'Sesión iniciada');
}
async function readMessages(){
 if(!user||!battle)return;
 const {data,error}=await client.from('tgk_battle_notifications')
  .select('id,title,message,created_at').eq('battle_id',battle.id).order('created_at',{ascending:false}).limit(10);
 if(error||!data?.length){$('battleMessages').hidden=true;return;}
 $('battleMessages').hidden=false;
 const root=$('battleMessageList');root.replaceChildren();
 for(const m of data){const item=node('article','tgk-battle-alert');
 item.append(node('strong','',m.title),node('p','',m.message));root.append(item);}
}
function tick(){
 if(!battle)return;
 const remains=new Date(battle.ends_at).getTime()-Date.now();
 if(remains<=0){$('battleClock').textContent='Terminó';$('battleBidForm').querySelector('button[type=submit]').disabled=true;return;}
 const secs=Math.floor(remains/1000);
 $('battleClock').textContent=[Math.floor(secs/86400),Math.floor(secs%86400/3600),Math.floor(secs%3600/60),secs%60].map((x,i)=>i===0?String(x)+'d':String(x).padStart(2,'0')).join(' · ');
}
async function refresh(){
 const {data:b,error}=await client.from('tgk_battles')
  .select('id,opening_bid,bid_step,highest_bid,bid_count,ends_at,state').eq('toy_id',toyId).maybeSingle();
 if(error)throw error;
 battle=b;
 if(!b){report('Esta Battle todavía no ha sido activada por el adulto vendedor.');setUser(false);return;}
 const ongoing=b.state==='active'&&new Date(b.ends_at).getTime()>Date.now();
 $('battleHighest').textContent=money(b.highest_bid??b.opening_bid);
 $('battleMinimum').textContent=money(b.highest_bid==null?b.opening_bid:b.highest_bid+b.bid_step);
 $('battleCount').textContent=b.bid_count;
 $('battleBidForm').elements.amount.min=String(b.highest_bid==null?b.opening_bid:b.highest_bid+b.bid_step);
 $('battleBidForm').elements.amount.value=String(b.highest_bid==null?b.opening_bid:b.highest_bid+b.bid_step);
 report(ongoing?'🟢 Battle activa: solo participan adultos de tiendas invitadas.':
 b.state==='closed'?(b.bid_count?'🏁 Battle finalizada. El ganador recibió un aviso privado.':'🏁 Battle finalizada sin ofertas.'):'⌛ Finalizando Battle. El servidor está comprobando las ofertas.');
 // Tras el cierre también permitimos iniciar sesión para consultar el aviso privado.
 setUser(true);
 if(!ongoing)$('battleBidPanel').hidden=true;
 tick();if(user)await readMessages();
}
async function start(){
 if(!validSlug.test(slug)||!validUUID.test(toyId))return report('Enlace de Battle no válido.');
 const returnUrl=new URL(slug==='cristobal-isidora'?'./index.html':'./tienda.html',location.href);
 if(slug!=='cristobal-isidora')returnUrl.searchParams.set('slug',slug);
 $('battleBack').href=returnUrl.href;
 if(!isLive())return report('Battle Arena necesita conexión al servidor.');
 client=await getClient();
 const {data:st,error:sErr}=await client.from('storefronts')
  .select('store_id,display_name,is_published').eq('slug',slug).eq('is_published',true).maybeSingle();
 if(sErr||!st)return report('La tienda no está publicada.');
 store=st;
 const {data:t,error:tErr}=await client.from('toys')
  .select('id,title,description,status,photos,emoji').eq('id',toyId).eq('store_id',st.store_id).maybeSingle();
 if(tErr||!t)return report('Este juguete no está disponible.');
 toy=t;
 $('battleTitle').textContent='⚡ '+toy.title;
 $('battleDescription').textContent=toy.description||'Este juguete quiere vivir una nueva aventura.';
 const src=safeImageUrl(toy.photos?.[0]);
 if(src){const img=node('img','tgk-battle-photo');img.src=src;img.alt='Fotografía de '+toy.title;$('battlePhoto').append(img);}
 else $('battlePhoto').append(node('div','tgk-battle-no-photo',toy.emoji||'🧸'));
 const {data:{user:u}}=await client.auth.getUser();user=u;
 await refresh();
 setInterval(()=>{tick();refresh().catch(e=>console.warn(e));},15000);
}
$('battleLoginForm').addEventListener('submit',async e=>{
 e.preventDefault();const f=e.currentTarget;
 try{report('Verificando la cuenta del adulto...');
 const {data,error}=await client.auth.signInWithPassword({email:f.elements.email.value.trim(),password:f.elements.password.value});
 if(error)throw error;user=data.user;f.elements.password.value='';
 await refresh();
 report('Cuenta validada. Revisa el mínimo antes de confirmar tu oferta.');
 }catch(err){report('No se pudo ingresar: '+(err?.message||'Error de acceso'));}
});
$('battleLogout').addEventListener('click',async()=>{
 await client.auth.signOut();user=null;await refresh();$('battleMessages').hidden=true;
});
$('battleBidForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!user||!battle)return;
 const f=event.currentTarget;const value=Number(f.elements.amount.value);
 if(!window.confirm('¿Confirmas ofertar '+money(value)+' por este juguete? La oferta quedará registrada.'))return;
 const button=f.querySelector('button');button.disabled=true;
 try{
  const {error}=await client.rpc('tgk_place_bid',{p_battle_id:battle.id,p_amount:value});
  if(error)throw error;
  await refresh();
  report('✓ ¡Oferta registrada! Si otra persona ofrece más, podrás volver a participar.');
 }catch(err){await refresh().catch(()=>{});report('No se aceptó la oferta: '+(err?.message||'Error del servidor'));}
 finally{button.disabled=false;}
});
start().catch(err=>{console.error(err);report('No se pudo cargar la Battle. Intenta nuevamente.');});
