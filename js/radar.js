/* Toy Radar integrado V1.5: demostración local, sin API, GPS ni comunicaciones reales. */
(()=>{
"use strict";
const root=document.getElementById("radar");if(!root)return;
const data=[
 {name:"La caja de tesoros",icon:"🧩",km:.4,deg:-120,desc:"Juegos y rompecabezas"},
 {name:"Planeta Peluches",icon:"🧸",km:.8,deg:-27,desc:"Peluches y figuras"},
 {name:"Misión Retro",icon:"🚗",km:.95,deg:108,desc:"Vehículos y juguetes retro"},
 {name:"El baúl de aventuras",icon:"🚀",km:2.1,deg:43,desc:"Bloques y construcción"},
 {name:"Mini Colección",icon:"🎲",km:2.7,deg:190,desc:"Juegos de mesa"}
];
const $=id=>document.getElementById(id);
const markers=$("tgkRadarMarkers"),results=$("tgkRadarResults"),feedback=$("tgkRadarNotice"),counter=$("tgkRadarCount"),radiusLabel=$("tgkRadarRadiusLabel");
let radius=1;
function node(type,cls,value){const e=document.createElement(type);if(cls)e.className=cls;if(value)e.textContent=value;return e;}
function render(){
 markers.replaceChildren();results.replaceChildren();feedback.textContent="";
 const nearby=data.filter(s=>s.km<=radius);
 nearby.forEach(s=>{
  const angle=s.deg*Math.PI/180,distance=s.km/radius*41;
  const point=node("button","tgk-radar-marker",s.icon);point.type="button";point.style.left=(50+Math.cos(angle)*distance)+"%";point.style.top=(50+Math.sin(angle)*distance)+"%";
  point.setAttribute("aria-label","Tienda ficticia: "+s.name);
  point.addEventListener("click",()=>{feedback.textContent="Ejemplo: "+s.name+". Todavía no hay conexiones reales.";});
  markers.append(point);
  const card=node("article","tgk-radar-store"),info=node("div","tgk-radar-store-info"),title=node("h4","",s.name),desc=node("p","",s.desc+" · "+s.km.toLocaleString("es-CL")+" km ficticios"),btn=node("button","tgk-radar-connect","Conectar");
  info.append(title,desc);btn.type="button";btn.addEventListener("click",()=>{feedback.textContent="Simulación: no se envió ninguna solicitud a "+s.name+".";});
  card.append(node("span","tgk-radar-avatar",s.icon),info,btn);results.append(card);
 });
 if(!nearby.length)results.append(node("p","","Sin tiendas ficticias dentro del radio."));
 radiusLabel.textContent=radius===.5?"500 M":radius+" KM";
 counter.textContent=nearby.length+" tiendas ficticias en "+(radius===.5?"500 m":radius+" km");
 root.querySelectorAll("[data-radar-radius]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.radarRadius)===radius)));
}
root.querySelectorAll("[data-radar-radius]").forEach(b=>b.addEventListener("click",()=>{radius=Number(b.dataset.radarRadius);render();}));
render();
})();
