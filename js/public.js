import {readToys,readSettings,readBasket,writeBasket,watchUpdates,money,escapeHtml,drawToy,grades,categories,statuses,copyText,toast,isLive,safeImageUrl} from './common.js?v=multi16';
let toys=[],settings={},basket=readBasket(),selectedCategory='Todas',searchTerm='',sortMode='newest';
const $=id=>document.getElementById(id);
async function load(){
  try{
    [toys,settings]=await Promise.all([readToys(),readSettings()]);
    toys=toys.filter(t=>t.status!=='hidden');
    basket=basket.filter(id=>toys.some(t=>t.id===id&&t.status==='available'&&t.sale_mode==='fixed'));
    writeBasket(basket);renderAll();
  }catch(error){console.error(error);$('catalogGrid').innerHTML='<p class="empty-state">No fue posible cargar el catálogo. Revisa la conexión o la configuración.</p>';toast('No se pudo cargar el catálogo.');}
}
function renderAll(){
  $('storeTagline').textContent=settings.tagline||'¡Encuentra tu próximo tesoro!';
  $('demoPublicBanner').hidden=isLive();
  $('statTotal').textContent=toys.length;
  $('statAvailable').textContent=toys.filter(t=>t.status==='available').length;
  $('statBattle').textContent=toys.filter(t=>t.sale_mode==='battle'&&t.status==='available').length;
  renderFilters();renderCatalog();renderBattle();renderBasket();
  $('basketCount').textContent=basket.length;
}
function renderFilters(){
 const categoriesList=['Todas',...Object.keys(categories).filter(cat=>toys.some(t=>t.category===cat))];
 $('categoryFilters').innerHTML=categoriesList.map(cat=>`<button type="button" class="filter-pill" data-category="${escapeHtml(cat)}" aria-pressed="${selectedCategory===cat}">${cat==='Todas'?'✨':categories[cat]} ${escapeHtml(cat)}</button>`).join('');
}
function renderCatalog(){
  const filtered=toys.filter(t=>(selectedCategory==='Todas'||t.category===selectedCategory)&&`${t.title} ${t.description||''} ${t.category}`.toLocaleLowerCase('es').includes(searchTerm.toLocaleLowerCase('es')));
  filtered.sort((a,b)=>sortMode==='cheap'?a.price-b.price:sortMode==='expensive'?b.price-a.price:sortMode==='name'?a.title.localeCompare(b.title,'es'):new Date(b.created_at||0)-new Date(a.created_at||0));
  $('catalogCounter').textContent=`${filtered.length} FICHAS`;
  $('catalogGrid').innerHTML=filtered.map(toy=>{
    const battle=toy.sale_mode==='battle';const disabled=toy.status==='sold'||toy.status==='reserved';
    const badge=toy.status==='available'?(battle?'<span class="status-badge battle">⚡ BATTLE</span>':'<span class="status-badge">● DISPONIBLE</span>'):`<span class="status-badge ${toy.status}">${escapeHtml(statuses[toy.status]||toy.status).toUpperCase()}</span>`;
    return `<article class="toy-card grade-${escapeHtml(toy.grade)} ${toy.status==='sold'?'is-sold':''}"><div class="card-visual">${drawToy(toy)}<span class="grade-badge">NIVEL <b>${escapeHtml(toy.grade||'B')}</b></span>${badge}</div><div class="card-body"><div class="type-label">${escapeHtml(categories[toy.category]||'⭐')} TIPO ${escapeHtml(toy.category).toUpperCase()}</div><h3>${escapeHtml(toy.title)}</h3><p class="card-desc">${escapeHtml((toy.description||'').slice(0,85))}</p><div class="card-bottom"><div class="card-price"><small>${battle?'PRECIO DE SALIDA':'PRECIO'}</small>${money(battle?(toy.battle_base??toy.price):toy.price)}</div><button class="card-action" type="button" data-open="${escapeHtml(toy.id)}">${battle?'VER BATTLE':'VER FICHA'} →</button></div></div></article>`;
  }).join('');
  $('catalogEmpty').hidden=filtered.length>0;
}
function renderBattle(){
  const battleToys=toys.filter(t=>t.sale_mode==='battle'&&t.status==='available');
  $('battleGrid').innerHTML=battleToys.length?battleToys.slice(0,3).map(t=>`<div class="battle-card"><div class="battle-toy">${escapeHtml(t.emoji||'⚡')}</div><div><span class="battle-demo-label">BATTLE EN PREPARACIÓN</span><h3>${escapeHtml(t.title)}</h3><p>Salida propuesta · ${grades[t.grade]||'Bueno'}</p><strong>${money(t.battle_base??t.price)}</strong></div></div>`).join(''):`<div class="battle-card"><div class="battle-toy">🏆</div><div><span class="battle-demo-label">PRÓXIMAMENTE</span><h3>¡Las Battle están por llegar!</h3><p>Publicaremos las primeras cuando estén listas.</p></div></div>`;
}
function showToy(id){
 const t=toys.find(x=>x.id===id);if(!t)return;
 const liveBattle=t.sale_mode==='battle';const available=t.status==='available';
 const photos=(t.photos||[]).filter(safeImageUrl);const images=photos.length?photos.map((src,i)=>`<img src="${escapeHtml(safeImageUrl(src))}" alt="${escapeHtml(t.title)} - fotografía ${i+1}" style="${i?'display:none':''}" data-photo-index="${i}">`).join(''):drawToy(t);
 $('toyModalContent').innerHTML=`<div class="modal-layout"><div class="modal-image">${images}</div><div class="modal-copy"><span class="type-label">${escapeHtml(categories[t.category]||'⭐')} ${escapeHtml(t.category).toUpperCase()} · NIVEL ${escapeHtml(t.grade)}</span><h2 id="modalTitle">${escapeHtml(t.title)}</h2><p>${escapeHtml(t.description||'Sin descripción')}</p><div class="modal-meta"><strong>Conservación:</strong> ${escapeHtml(grades[t.grade]||'Sin especificar')}<br><strong>Detalle:</strong> ${escapeHtml(t.condition_note||'Sin observaciones')}<br><strong>Disponibilidad:</strong> ${escapeHtml(statuses[t.status]||t.status)}</div><div class="modal-price">${money(liveBattle?(t.battle_base??t.price):t.price)}</div><p class="modal-small">${liveBattle?'Precio de salida orientativo. La Battle real todavía NO está activa.':'Juguete usado. La selección no confirma compra.'}</p><div class="modal-actions">${!liveBattle&&available?`<button class="action action-primary" id="addFromModal" data-add="${escapeHtml(t.id)}">🎒 Agregar a mi selección</button>`:liveBattle?'<span class="action action-outline">⚡ BATTLE PRÓXIMAMENTE</span>':'<span class="action action-outline">No disponible para nueva selección</span>'}${photos.length>1?'<button type="button" class="action action-light" id="nextPhoto">Siguiente foto →</button>':''}</div></div></div>`;
 let index=0;const next=$('nextPhoto');if(next)next.addEventListener('click',()=>{const imgs=$('toyModalContent').querySelectorAll('[data-photo-index]');imgs[index].style.display='none';index=(index+1)%imgs.length;imgs[index].style.display='block';});
 $('toyModal').showModal();
}
function toggleBasket(id){
 const toy=toys.find(t=>t.id===id);if(!toy||toy.sale_mode==='battle'||toy.status!=='available'){toast('Este juguete no puede agregarse ahora.');return;}
 if(!basket.includes(id))basket.push(id);
 writeBasket(basket);renderBasket();$('basketCount').textContent=basket.length;toast('🎒 ¡Juguete agregado a tu selección!');
 $('toyModal').close();
}
function renderBasket(){
  const active=basket.map(id=>toys.find(t=>t.id===id)).filter(Boolean);
  $('basketContent').innerHTML=active.length?active.map(t=>`<div class="basket-item"><div><strong>${escapeHtml(t.emoji||'🧸')} ${escapeHtml(t.title)}</strong><div>${money(t.price)}</div></div><button type="button" data-remove="${escapeHtml(t.id)}" aria-label="Quitar ${escapeHtml(t.title)}">✕</button></div>`).join(''):'<p class="empty-state">Todavía no has elegido juguetes.</p>';
  const total=active.reduce((sum,t)=>sum+Number(t.price||0),0);
  if(active.length)$('basketContent').insertAdjacentHTML('beforeend',`<div class="basket-item"><strong>TOTAL REFERENCIAL</strong><strong>${money(total)}</strong></div>`);
  $('shareBasket').disabled=active.length===0;
}
async function shareSelection(){
 const chosen=basket.map(id=>toys.find(t=>t.id===id)).filter(Boolean);if(!chosen.length)return;
 const msg=`Hola, soy un adulto interesado en estos juguetes de Toy Garage Kids:\n${chosen.map(t=>`• ${t.title} — ${money(t.price)}`).join('\n')}\nTotal referencial: ${money(chosen.reduce((x,t)=>x+Number(t.price||0),0))}\n¿Podemos confirmar disponibilidad, estado y entrega?`;
 const phone=String(settings.whatsapp||'').replace(/\D/g,'');
 if(phone){window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank','noopener');toast('Se abrió WhatsApp para coordinar con un adulto.');}
 else if(navigator.share){try{await navigator.share({title:'Consulta · Toy Garage Kids',text:msg});toast('Selección compartida.');}catch(err){if(err.name!=='AbortError')toast((await copyText(msg))?'Mensaje copiado.':'No se pudo compartir.');}}
 else toast((await copyText(msg))?'Consulta copiada. Pégala en un mensaje a un adulto.':'No se pudo copiar.');
}
$('categoryFilters').addEventListener('click',event=>{const b=event.target.closest('[data-category]');if(!b)return;selectedCategory=b.dataset.category;renderFilters();renderCatalog();});
$('searchInput').addEventListener('input',event=>{searchTerm=event.target.value;renderCatalog();});
$('sortSelect').addEventListener('change',event=>{sortMode=event.target.value;renderCatalog();});
$('catalogGrid').addEventListener('click',event=>{const b=event.target.closest('[data-open]');if(b)showToy(b.dataset.open);});
$('toyModalContent').addEventListener('click',event=>{const b=event.target.closest('[data-add]');if(b)toggleBasket(b.dataset.add);});
$('closeModal').addEventListener('click',()=>$('toyModal').close());
$('toyModal').addEventListener('click',event=>{if(event.target===$('toyModal'))$('toyModal').close();});
$('basketBtn').addEventListener('click',()=>$('basketDialog').showModal());
$('closeBasket').addEventListener('click',()=>$('basketDialog').close());
$('basketContent').addEventListener('click',event=>{const b=event.target.closest('[data-remove]');if(!b)return;basket=basket.filter(id=>id!==b.dataset.remove);writeBasket(basket);renderBasket();$('basketCount').textContent=basket.length;});
$('shareBasket').addEventListener('click',shareSelection);
watchUpdates(load);load();