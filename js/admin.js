import {readToys,readSettings,writeToy,removeToy,writeSettings,getClient,isLive,newId,uploadPhoto,money,escapeHtml,drawToy,grades,statuses,toast,watchUpdates,safeImageUrl} from './common.js?v=auth-v27';
const $=id=>document.getElementById(id);
let toys=[],settings={},selectedPhotos=[],incomingFiles=[],editingId=null,isSaving=false;
const formFields=['toyTitle','toyCategory','toyGrade','toyDescription','toyConditionNote','toyPrice','toyStatus','toySaleMode','toyEmoji','battleBase','battleStep','battleEnds'];
const setMessage=(id,message,error=false)=>{const el=$(id);el.textContent=message;el.style.color=error?'#bb3253':'#337c4c';};
const authError=message=>setMessage('loginError',message,true);
function showWorkspace(){ $('loginSection').hidden=true;$('adminWorkspace').hidden=false;$('logoutBtn').hidden=!isLive();$('modeBadge').textContent=isLive()?'● CONECTADO A SUPABASE':'🧪 DEMOSTRACIÓN LOCAL';$('demoNote').hidden=isLive();}
function showLogin(){ $('loginSection').hidden=false;$('adminWorkspace').hidden=true;$('logoutBtn').hidden=true;$('modeBadge').textContent='🔒 ACCESO RESTRINGIDO';}
async function allowedAdmin(client){
  const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user)return false;
  const {data,error}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error)throw error;return Boolean(data);
}
async function start(){
  if(isLive()){
    showLogin();try{const client=await getClient();if(await allowedAdmin(client)){showWorkspace();await refresh();}}
    catch(e){console.error(e);authError('No fue posible verificar el acceso. Revisa Supabase y tu conexión.');}
  }else if(['localhost','127.0.0.1',''].includes(location.hostname) || location.protocol==='file:'){showWorkspace();await refresh();}
  else {showLogin(); $('loginForm').hidden=true; authError('Administración deshabilitada: primero conecta Supabase en config.js. Esta página pública nunca habilita el editor de demostración.');}
}
async function refresh(){try{[toys,settings]=await Promise.all([readToys(),readSettings()]);renderInventory();fillSettings();}catch(e){console.error(e);toast('Error cargando datos. Revisa conexión y permisos.');}}
function renderInventory(){
  const total=toys.length;
  const parts=[['Juguetes',total],['Disponibles',toys.filter(t=>t.status==='available').length],['Reservados',toys.filter(t=>t.status==='reserved').length],['Vendidos',toys.filter(t=>t.status==='sold').length]];
  $('adminStats').innerHTML=parts.map(([label,num])=>`<div class="admin-stat"><strong>${num}</strong><small>${label}</small></div>`).join('');
  $('adminList').innerHTML=toys.length?toys.map(t=>`<article class="admin-row"><div class="admin-thumb">${drawToy(t)}</div><div><h3>${escapeHtml(t.title)}</h3><p>${money(t.price)} · Nivel ${escapeHtml(t.grade)} · ${escapeHtml(statuses[t.status]||t.status)}${t.sale_mode==='battle'?' · ⚡ Battle':''}</p></div><div class="admin-item-actions"><button type="button" data-edit="${escapeHtml(t.id)}">Editar</button><button class="admin-delete" type="button" data-delete="${escapeHtml(t.id)}" aria-label="Eliminar definitivamente ${escapeHtml(t.title)}">🗑 Eliminar</button></div></article>`).join(''):'<p>No hay juguetes aún. ¡Agrega el primero!</p>';
}
function fillSettings(){if(document.activeElement?.closest('#settingsForm'))return;$('storeTaglineInput').value=settings.tagline||'';$('whatsappInput').value=settings.whatsapp||'';}
function resetForm(){
 editingId=null;selectedPhotos=[];incomingFiles=[];$('toyForm').reset();$('toyEmoji').value='🧸';$('toyStatus').value='available';$('toyGrade').value='A';$('toySaleMode').value='fixed';$('battleStep').value='500';$('formTitle').textContent='Nuevo juguete';$('toyId').value='';$('toyImages').value='';$('battleFields').hidden=true;renderPreview();setMessage('formMessage','');
}
function editToy(id){
 const toy=toys.find(t=>t.id===id);if(!toy)return;
 editingId=id;selectedPhotos=[...(toy.photos||[])];incomingFiles=[];$('toyImages').value='';
 const map={toyTitle:'title',toyCategory:'category',toyGrade:'grade',toyDescription:'description',toyConditionNote:'condition_note',toyPrice:'price',toyStatus:'status',toySaleMode:'sale_mode',toyEmoji:'emoji',battleBase:'battle_base',battleStep:'battle_step',battleEnds:'battle_ends_at'};
 for(const [node,property] of Object.entries(map))$(node).value=toy[property]==null?'':(node==='battleEnds'?String(toy[property]).slice(0,16):toy[property]);
 $('formTitle').textContent='Editar juguete';$('battleFields').hidden=toy.sale_mode!=='battle';renderPreview();setMessage('formMessage','');$('toyTitle').focus();window.scrollTo({top:Math.max(0,$('formTitle').getBoundingClientRect().top+window.scrollY-25),behavior:'smooth'});
}
function renderPreview(){
 $('imagePreview').innerHTML='';
 selectedPhotos.forEach((src,i)=>{
   const card=document.createElement('div');card.className='preview';const img=document.createElement('img');img.src=safeImageUrl(src);img.alt=`Imagen ${i+1}`;const b=document.createElement('button');b.type='button';b.textContent='×';b.title='Quitar foto';b.addEventListener('click',()=>{selectedPhotos.splice(i,1);renderPreview();});card.append(img,b);$('imagePreview').append(card);
 });
 incomingFiles.forEach((file,i)=>{
   const card=document.createElement('div');card.className='preview';const img=document.createElement('img');const url=URL.createObjectURL(file);img.src=url;img.onload=()=>URL.revokeObjectURL(url);img.alt=`Foto nueva ${i+1}`;const b=document.createElement('button');b.type='button';b.textContent='×';b.title='Quitar foto';b.addEventListener('click',()=>{incomingFiles.splice(i,1);renderPreview();});card.append(img,b);$('imagePreview').append(card);
 });
}
$('toyImages').addEventListener('change',event=>{
 const files=Array.from(event.target.files||[]);if(selectedPhotos.length+incomingFiles.length+files.length>3){toast('Máximo 3 imágenes por juguete.');event.target.value='';return;}
 if(files.some(f=>!f.type.startsWith('image/'))){toast('Selecciona únicamente fotografías.');event.target.value='';return;}
 incomingFiles.push(...files);event.target.value='';renderPreview();
});
$('toySaleMode').addEventListener('change',e=>{$('battleFields').hidden=e.target.value!=='battle';});
$('adminList').addEventListener('click',async event=>{
  const deleteBtn=event.target.closest('[data-delete]');
  if(!deleteBtn){const editBtn=event.target.closest('[data-edit]');if(editBtn)editToy(editBtn.dataset.edit);return;}
  const toy=toys.find(t=>t.id===deleteBtn.dataset.delete);
  if(!toy||isSaving)return;
  const approved=window.confirm('¿Eliminar DEFINITIVAMENTE «'+toy.title+'»?\n\nSe quitará del catálogo y del inventario. También se intentarán borrar sus fotos almacenadas. Esta acción no se puede deshacer.\n\nSi solo quieres dejar de mostrarlo, edita el estado a «Oculto».');
  if(!approved)return;
  isSaving=true;deleteBtn.disabled=true;
  try{
    const result=await removeToy(toy);
    toys=toys.filter(t=>t.id!==toy.id);
    if(editingId===toy.id)resetForm();
    renderInventory();
    toast(result.photoCleanupError?'Juguete eliminado. Atención: no se pudieron borrar todas sus fotos.':'Juguete eliminado definitivamente.');
  }catch(error){
    console.error(error);toast('No fue posible eliminar el juguete: '+(error.message||'Error desconocido'));
    deleteBtn.disabled=false;
  }finally{isSaving=false;}
});
$('newToy').addEventListener('click',()=>{resetForm();$('toyTitle').focus();});
$('resetToy').addEventListener('click',resetForm);
$('toyForm').addEventListener('submit',async event=>{
 event.preventDefault();if(isSaving)return;isSaving=true;$('saveToy').disabled=true;setMessage('formMessage','Guardando...');
 try{
   const id=editingId||newId();const existing=toys.find(t=>t.id===id)||{};
   const price=Number($('toyPrice').value);if(!Number.isInteger(price)||price<0)throw new Error('El precio debe ser un número entero no negativo.');
   if(selectedPhotos.length+incomingFiles.length>3)throw new Error('Máximo 3 fotos.');
   const newPhotos=[];
   for(const file of incomingFiles)newPhotos.push(await uploadPhoto(file,id));
   const saleMode=$('toySaleMode').value;
   const end=$('battleEnds').value;
   const toy={...existing,id,title:$('toyTitle').value.trim(),description:$('toyDescription').value.trim(),category:$('toyCategory').value,grade:$('toyGrade').value,condition_note:$('toyConditionNote').value.trim(),price,sale_mode:saleMode,status:$('toyStatus').value,emoji:$('toyEmoji').value.trim()||'🧸',photos:[...selectedPhotos,...newPhotos],battle_base:saleMode==='battle'?Number($('battleBase').value||price):null,battle_step:saleMode==='battle'?Number($('battleStep').value||500):null,battle_ends_at:saleMode==='battle'&&end?new Date(end).toISOString():null,created_at:existing.created_at||new Date().toISOString()};
   if(!toy.title)throw new Error('Indica el nombre del juguete.');
   if(toy.battle_step!==null&&toy.battle_step<100)throw new Error('El incremento mínimo debe ser de $100 o más.');
   if(!isLive()&&toy.photos.some(p=>p.startsWith('data:'))){const totalChars=toy.photos.join('').length;if(totalChars>2600000)throw new Error('Demasiadas fotos para el modo local. Usa fotografías más pequeñas o conecta Supabase.');}
   const saved=await writeToy(toy);
   const i=toys.findIndex(t=>t.id===id);if(i<0)toys.unshift(saved);else toys[i]=saved;
   renderInventory();editToy(id);incomingFiles=[];selectedPhotos=[...saved.photos];renderPreview();setMessage('formMessage','✓ Juguete guardado. La vista pública ya puede mostrar este cambio.');toast('Juguete guardado correctamente.');
 }catch(e){console.error(e);setMessage('formMessage',`No se guardó: ${e.message||'error inesperado'}`,true);}
 finally{isSaving=false;$('saveToy').disabled=false;}
});
$('settingsForm').addEventListener('submit',async event=>{
 event.preventDefault();const whatsapp=$('whatsappInput').value.replace(/\D/g,'');
 if(whatsapp&&(!/^\d{8,15}$/.test(whatsapp))){setMessage('settingsMessage','Número inválido. Usa código de país y 8 a 15 dígitos.',true);return;}
 try{const data={tagline:$('storeTaglineInput').value.trim(),whatsapp};await writeSettings(data);settings=data;setMessage('settingsMessage','✓ Configuración guardada.');toast('Configuración actualizada.');}catch(e){setMessage('settingsMessage',`Error: ${e.message}`,true);}
});
$('loginForm').addEventListener('submit',async event=>{
 event.preventDefault();authError('');try{
   const client=await getClient();const {error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
   if(error)throw error;
   if(!await allowedAdmin(client)){await client.auth.signOut();throw new Error('La cuenta no está registrada como administradora.');}
   showWorkspace();await refresh();
 }catch(e){authError(e.message||'Error de acceso');}
});
$('logoutBtn').addEventListener('click',async()=>{try{await (await getClient()).auth.signOut();}finally{showLogin();resetForm();}});
resetForm();start();