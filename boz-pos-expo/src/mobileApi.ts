/** BOZ POS Mobile API v1.
 * Adapter only: not proof BOS currently implements these routes.
 * Do not expose product/supplier/price administration to the POS app.
 */
import type {Item,Job} from './demo';
export type AssignedShop={id:string;name:string;role:string};
export type MobileSession={accessToken:string;userId:string;shops:AssignedShop[]};
type Requester=typeof fetch;
function object(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid API response shape');
 return value as Record<string,unknown>;
}
function text(value:unknown,label:string):string{
 if(typeof value!=='string'||!value.trim())throw new Error('Invalid '+label);
 return value;
}
function count(value:unknown,label:string):number{
 if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new Error('Invalid '+label);
 return value;
}
export function normalizeApiRoot(input:string):string{
 const url=new URL(input);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)
  throw new Error('Trusted HTTPS API root required');
 return url.href.replace(/\/$/,'');
}
export class BozMobileApi{
 private root:string;
 constructor(endpoint:string,private transport:Requester=fetch){this.root=normalizeApiRoot(endpoint);}
 private async request(path:string,method:'GET'|'POST'='GET',token?:string,payload?:unknown):Promise<unknown>{
  if(!path.startsWith('/mobile/v1/'))throw new Error('Unexpected API path');
  const response=await this.transport(this.root+path,{method,headers:{
   Accept:'application/json',...(payload!==undefined?{'Content-Type':'application/json'}:{}),
   ...(token?{Authorization:'Bearer '+token}:{})},...(payload!==undefined?{body:JSON.stringify(payload)}:{})});
  if(!response.ok)throw new Error('Backend request rejected (HTTP '+response.status+')');
  return response.json() as Promise<unknown>;
 }
 async health():Promise<string>{
  const v=object(await this.request('/mobile/v1/health'));
  return v.status==='ok'?'BOZ mobile API: OK':'Server readiness not confirmed';
 }
 async signIn(email:string,password:string):Promise<MobileSession>{
  if(!email.trim()||!password)throw new Error('Enter login credentials');
  const v=object(await this.request('/mobile/v1/session','POST',undefined,{email:email.trim(),password}));
  if(!Array.isArray(v.shops)||v.shops.length<1)throw new Error('No authorized shops');
  return {accessToken:text(v.accessToken,'access token'),userId:text(v.userId,'user ID'),
   shops:v.shops.map(x=>{const s=object(x);return {id:text(s.id,'shop ID'),name:text(s.name,'shop name'),role:text(s.role,'role')};})};
 }
 private shopPath(s:MobileSession,shopId:string){
  if(!s.shops.some(x=>x.id===shopId))throw new Error('Shop not assigned to session');
  return '/mobile/v1/shops/'+encodeURIComponent(shopId);
 }
 async inventory(s:MobileSession,shopId:string):Promise<Item[]>{
  const v=object(await this.request(this.shopPath(s,shopId)+'/inventory','GET',s.accessToken));
  if(!Array.isArray(v.items))throw new Error('Invalid inventory list');
  return v.items.map(x=>{const r=object(x);const source=text(r.shopId,'shop ID');
   if(source!==shopId)throw new Error('Cross-shop product rejected');
   return {id:text(r.id,'product ID'),shop:source,sku:text(r.sku,'SKU'),
    barcode:typeof r.barcode==='string'?r.barcode:'',name:text(r.name,'product'),
    price:count(r.priceCents,'priceCents'),qty:count(r.availableQty,'availableQty')};
  });
 }
 async repairs(s:MobileSession,shopId:string):Promise<Job[]>{
  const v=object(await this.request(this.shopPath(s,shopId)+'/repairs','GET',s.accessToken));
  if(!Array.isArray(v.jobs))throw new Error('Invalid repairs list');
  return v.jobs.map(x=>{const r=object(x);const source=text(r.shopId,'shop ID');
   if(source!==shopId)throw new Error('Cross-shop repair rejected');
   return {id:text(r.id,'repair ID'),shop:source,device:text(r.device,'device'),
    issue:text(r.issue,'issue'),status:text(r.status,'status')};
  });
 }
}
