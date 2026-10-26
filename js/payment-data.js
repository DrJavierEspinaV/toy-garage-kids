/* Formas de pago de cada tienda. No guarda ni publica datos bancarios. */
export const PAYMENT_DEFAULTS=Object.freeze({
 transfer:false,
 cash_on_delivery:false,
 arrange_with_adult:true
});
const fields=['transfer','cash_on_delivery','arrange_with_adult'];
export async function getPaymentOptions(client,storeId){
 if(!client||!storeId)throw new Error('Falta la sesión de la tienda.');
 const {data,error}=await client.from('store_payment_options')
  .select('transfer,cash_on_delivery,arrange_with_adult')
  .eq('store_id',storeId).maybeSingle();
 if(error)throw error;
 return data?Object.fromEntries(fields.map(k=>[k,data[k]===true])):{...PAYMENT_DEFAULTS};
}
export async function savePaymentOptions(client,storeId,options){
 if(!client||!storeId)throw new Error('Falta la sesión del propietario.');
 const values=Object.fromEntries(fields.map(key=>[key,options[key]===true]));
 if(!fields.some(key=>values[key]))throw new Error('Selecciona al menos una forma de pago.');
 const {data,error}=await client.from('store_payment_options')
  .upsert({store_id:storeId,...values,updated_at:new Date().toISOString()},{onConflict:'store_id'})
  .select('store_id,transfer,cash_on_delivery,arrange_with_adult').single();
 if(error)throw error;
 if(!data)throw new Error('No se confirmó la actualización.');
 return data;
}
