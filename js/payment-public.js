/* Catálogo público: métodos aceptados por tienda, sin datos financieros.
   Solo se consultan tiendas publicadas y valores booleanos protegidos por RLS. */
import {getClient,isLive} from './common.js?v=auth-v27';
import {getPaymentOptions} from './payment-data.js?v=29';
const root=document.getElementById('formas-de-pago');
const result=document.getElementById('paymentMethodsPublic');
const msg=(s)=>{if(result)result.textContent=s;};
async function start(){
 if(!root||!result)return;
 const slug=root.dataset.storeSlug||new URLSearchParams(location.search).get('slug')||'';
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80){root.hidden=true;return;}
 if(!isLive()){msg('Consulta las condiciones de pago directamente con el adulto responsable.');return;}
 const client=await getClient();
 const {data:shop,error:shopError}=await client.from('storefronts')
  .select('store_id').eq('slug',slug).eq('is_published',true).maybeSingle();
 if(shopError||!shop){root.hidden=true;return;}
 const methods=await getPaymentOptions(client,shop.store_id);
 const options=[
  ['transfer','🏦 Transferencia bancaria'],
  ['cash_on_delivery','💵 Efectivo al entregar'],
  ['arrange_with_adult','🤝 A convenir con el adulto']
 ];
 result.replaceChildren();
 for(const [key,label] of options){
  if(!methods[key])continue;
  const item=document.createElement('span');
  item.className='tgk-public-pay-method';
  item.textContent=label;
  result.append(item);
 }
 if(!result.children.length)msg('Consulta las formas de pago con el adulto responsable.');
}
start().catch(error=>{console.error(error);msg('Consulta las formas de pago directamente con el adulto responsable.');});
