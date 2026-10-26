/* Battle Arena V1: panel adulto común, sin tocar inventarios previos.
 * La base valida servidor, bloqueo concurrente, plazos y permisos.
 */
import {getClient,isLive,money} from './common.js?v=auth-v27';
const $=id=>document.getElementById(id);
const root=$('battleOwnerPane'),form=$('tgkLaunchBattleForm');
let client,owner=null,busy=false;
const create=(type,cls,value)=>{const n=document.createElement(type);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
const label=message=>{$('tgkOwnerBattleStatus').textContent=message};
function battleHref(slug,toyId){
 const url=new URL('./battle.html',import.meta.url);
 url.searchParams.set('slug',slug);url.searchParams.set('toy',toyId);
 return url.href;
}
function addLine(container,parts){
 const row=create('div','tgk-owner-battle-row');
 for(const part of parts)row.append(part);
 container.append(row);return row;
}
async function refresh(){
 if(!owner||!client)return;
 const id=owner.storeId;
 const [{data:toys,error:toyErr},{data:battles,error:battleErr},{data:messages,error:msgErr}]=await Promise.all([
  client.from('toys').select('id,title,status,sale_mode').eq('store_id',id).order('created_at',{ascending:false}),
  client.from('tgk_battles').select('id,toy_id,opening_bid,bid_step,highest_bid,bid_count,ends_at,state,closed_at').eq('store_id',id).order('created_at',{ascending:false}).limit(50),
  client.from('tgk_battle_notifications').select('id,title,message,kind,read_at,created_at,battle_id').order('created_at',{ascending:false}).limit(30)
 ]);
 if(toyErr||battleErr||msgErr)throw toyErr||battleErr||msgErr;
 const launched=new Set((battles||[]).map(x=>x.toy_id));
 const picker=form.elements.toy_id;const current=picker.value;
 picker.replaceChildren(new Option('Selecciona un juguete...', ''));
 const names=new Map((toys||[]).map(x=>[x.id,x.title]));
 for(const toy of toys||[])if(toy.status==='available'&&!launched.has(toy.id))picker.append(new Option(toy.title,toy.id));
 if([...picker.options].some(x=>x.value===current))picker.value=current;
 const list=$('tgkOwnerBattleList');list.replaceChildren();
 if(!(battles||[]).length)list.append(create('p','tgk-battle-hint','No hay Battles registradas todavía.'));
 for(const b of battles||[]){
  const info=create('div');
  const active=b.state==='active' && new Date(b.ends_at).getTime()>Date.now();
  info.append(create('strong','',names.get(b.toy_id)||'Juguete'));
  info.append(create('small','',(active?'🟢 Activa':b.state==='closed'?'🏁 Cerrada':'⌛ Cerrando')+
  ' · '+money(b.highest_bid||b.opening_bid)+' · '+b.bid_count+' ofertas · '+new Date(b.ends_at).toLocaleString('es-CL')));
  const link=create('a','tgk-battle-link','Ver Battle');link.href=battleHref(owner.slug,b.toy_id);link.target='_blank';link.rel='noopener';
  addLine(list,[info,link]);
 }
 const alerts=$('tgkOwnerNoticeList');alerts.replaceChildren();
 if(!(messages||[]).length)alerts.append(create('p','tgk-battle-hint','Aún no hay avisos de Battle.'));
 for(const m of messages||[]){
  const wrap=create('div');wrap.append(create('strong','',m.title),create('p','',m.message));
  const btn=create('button','tgk-battle-link',m.read_at?'✓ Leído':'Marcar como leído');
  btn.type='button';btn.disabled=!!m.read_at;
  btn.addEventListener('click',async()=>{
   const {error}=await client.from('tgk_battle_notifications').update({read_at:new Date().toISOString()}).eq('id',m.id);
   if(!error){btn.textContent='✓ Leído';btn.disabled=true;}else label(error.message);
  });
  addLine(alerts,[wrap,btn]);
 }
 label('Listo. El cierre automático se procesa aproximadamente una vez por minuto.');
}
if(root&&form){
 const defaultEnd=new Date(Date.now()+86400000);
 // convert to browser-local datetime-local correctly
 defaultEnd.setMinutes(defaultEnd.getMinutes()-defaultEnd.getTimezoneOffset());
 form.elements.ends_at.value=defaultEnd.toISOString().slice(0,16);
 window.addEventListener('tgk:owner-ready',async event=>{
  owner=event.detail?.storeId?event.detail:null;
  root.hidden=!owner;
  if(!owner)return;
  try{client=await getClient();await refresh();}
  catch(err){label('No se pudieron cargar las Battles: '+(err?.message||'Error de conexión'));}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!owner||busy)return;
  busy=true;const btn=form.querySelector('button[type=submit]');btn.disabled=true;
  try{
   const toyId=form.elements.toy_id.value;
   const closing=new Date(form.elements.ends_at.value);
   if(!toyId||!Number.isFinite(closing.getTime()))throw Error('Selecciona un juguete y un cierre válido.');
   if(!window.confirm('¿Activar esta Battle? Una vez abierta no podrás modificar el precio ni el plazo.'))return;
   label('Activando Battle...');
   const {error}=await client.rpc('tgk_start_battle',{
    p_toy_id:toyId,p_opening:Number(form.elements.opening.value),
    p_step:Number(form.elements.increment.value),p_ends_at:closing.toISOString()
   });
   if(error)throw error;
   label('¡Battle activada! Ya puede recibir ofertas de adultos registrados.');
   await refresh();
  }catch(err){label('No se pudo activar: '+(err?.message||'Error del servidor'));}
  finally{busy=false;btn.disabled=false;}
 });
 const reload=create('button','tgk-battle-link','↻ Actualizar Battles');
 reload.type='button';reload.addEventListener('click',()=>refresh().catch(e=>label(e.message)));
 root.querySelector('h3')?.before(reload);
}
