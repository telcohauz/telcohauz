/**
 * Minimal persisted cash sale envelope for safe replay after restart.
 * Does NOT contain customer PII, passwords or Auth access tokens.
 */
export type PendingSale={
 key:string;shopId:string;userId:string;
 items:{productId:string;quantity:number}[];
};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parsePendingSale(raw:string):PendingSale{
 if(raw.length>16000)throw Error('Pending sale record too large');
 let value:unknown;
 try{value=JSON.parse(raw)}catch{throw Error('Pending sale record is corrupted')}
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Pending sale record invalid');
 const o=value as Record<string,unknown>;
 if(![o.key,o.shopId,o.userId].every(v=>typeof v==='string'&&UUID.test(v)))throw Error('Pending sale IDs invalid');
 if(!Array.isArray(o.items)||o.items.length<1||o.items.length>100)throw Error('Pending sale item list invalid');
 const items=o.items.map(v=>{
  if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Pending sale line invalid');
  const p=v as Record<string,unknown>;
  if(typeof p.productId!=='string'||!UUID.test(p.productId)
  ||!Number.isSafeInteger(p.quantity)||Number(p.quantity)<1||Number(p.quantity)>1000)
   throw Error('Pending sale product/quantity invalid');
  return {productId:p.productId,quantity:Number(p.quantity)};
 });
 return {key:o.key as string,shopId:o.shopId as string,userId:o.userId as string,items};
}
export function encodePendingSale(sale:PendingSale):string{
 const output=JSON.stringify(sale);
 parsePendingSale(output);return output;
}
