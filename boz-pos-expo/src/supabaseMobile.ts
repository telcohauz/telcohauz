/** First-party Telcohauz BOZ Supabase REST adapter.
 * Uses ONLY a public publishable key plus staff JWT. RLS is the authority.
 * Checkout RPC exists but the UI must not enable cash sale before real device QA.
 */
import type {Item,Job} from './demo';
import type {MobileSession} from './mobileApi';
type Requester=typeof fetch;
type JsonObject=Record<string,unknown>;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function obj(v:unknown):JsonObject{
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid backend object');
 return v as JsonObject;
}
function str(v:unknown,label:string):string{
 if(typeof v!=='string'||!v.trim())throw Error('Invalid '+label);
 return v;
}
function nonnegative(v:unknown,label:string):number{
 if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)throw Error('Invalid '+label);
 return v;
}
function arr(v:unknown,label:string):JsonObject[]{
 if(!Array.isArray(v))throw Error('Invalid '+label);
 return v.map(obj);
}
export class BozSupabaseApi{
 private root:string;
 private key:string;
 private transport:Requester;
 constructor(root:string,key:string,transport:Requester=fetch){
  const u=new URL(root);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/'||!u.hostname.endsWith('.supabase.co'))throw Error('Trusted Supabase URL required');
  if(!key.startsWith('sb_publishable_')||key.length<20)throw Error('Publishable key required');
  this.root=u.origin;this.key=key;this.transport=transport;
 }
 private async call(path:string,token?:string,method:'GET'|'POST'='GET',payload?:unknown):Promise<unknown>{
  if(!path.startsWith('/')||path.startsWith('//'))throw Error('Invalid relative API path');
  const r=await this.transport(this.root+path,{
   method,headers:{apikey:this.key,Accept:'application/json',
    ...(payload!==undefined?{'Content-Type':'application/json'}:{}),
    ...(token?{Authorization:'Bearer '+token}:{})},
   ...(payload!==undefined?{body:JSON.stringify(payload)}:{})
  });
  if(!r.ok)throw Error('BOZ backend rejected request (HTTP '+r.status+')');
  return r.json() as Promise<unknown>;
 }
 async health():Promise<string>{
  await this.call('/auth/v1/health');
  return 'Telcohauz BOZ Auth server reachable; sign in to view shop records.';
 }
 async signIn(email:string,password:string):Promise<MobileSession>{
  if(!email.trim()||!password)throw Error('Staff email/password required');
  const v=obj(await this.call('/auth/v1/token?grant_type=password',undefined,'POST',{email:email.trim(),password}));
  const token=str(v.access_token,'access token');
  const user=obj(v.user);
  const uid=str(user.id,'user ID');
  const memberships=arr(await this.call('/rest/v1/pos_memberships?select=shop_id,role&active=eq.true',token),'shop memberships');
  const shops=arr(await this.call('/rest/v1/pos_shops?select=id,name&active=eq.true',token),'shops');
  const allowed=memberships.flatMap(m=>{
   const id=str(m.shop_id,'assigned shop ID');
   const matching=shops.find(x=>x.id===id);
   return matching?[{id,name:str(matching.name,'shop name'),role:str(m.role,'shop role')}]:[];
  });
  if(!allowed.length)throw Error('No active BOZ POS shops assigned to this staff account');
  return {accessToken:token,userId:uid,shops:allowed};
 }
 private check(session:MobileSession,shopId:string){
  if(!UUID.test(shopId)||!session.shops.some(s=>s.id===shopId))throw Error('Shop is not authorized');
  return encodeURIComponent(shopId);
 }
 async inventory(session:MobileSession,shopId:string):Promise<Item[]>{
  const id=this.check(session,shopId);
  const [p,s]=await Promise.all([
   this.call('/rest/v1/pos_products?select=id,shop_id,sku,barcode,name,price_cents&active=eq.true&shop_id=eq.'+id,session.accessToken),
   this.call('/rest/v1/pos_stock?select=shop_id,product_id,available_qty&shop_id=eq.'+id,session.accessToken)
  ]);
  const stocks=new Map(arr(s,'stock').map(x=>[str(x.product_id,'product ID'),x]));
  return arr(p,'products').map(x=>{
   if(x.shop_id!==shopId)throw Error('Cross-shop product returned');
   const stock=stocks.get(str(x.id,'product ID'));
   if(stock&&stock.shop_id!==shopId)throw Error('Cross-shop stock returned');
   return {id:str(x.id,'product ID'),shop:shopId,sku:str(x.sku,'SKU'),
    barcode:typeof x.barcode==='string'?x.barcode:'',
    name:str(x.name,'product'),price:nonnegative(x.price_cents,'selling price'),
    qty:stock?nonnegative(stock.available_qty,'stock'):0};
  });
 }
 async repairs(session:MobileSession,shopId:string):Promise<Job[]>{
  const id=this.check(session,shopId);
  const rows=arr(await this.call('/rest/v1/pos_repairs?select=id,shop_id,ticket_no,device,issue,status&shop_id=eq.'+id,session.accessToken),'repair tickets');
  return rows.map(x=>{
   if(x.shop_id!==shopId)throw Error('Cross-shop repair returned');
   return {id:str(x.id,'repair ID'),shop:shopId,device:str(x.device,'device'),
    issue:str(x.issue,'issue'),status:str(x.status,'status').replace(/_/g,' ')};
  });
 }
 async updateRepair(session:MobileSession,shopId:string,repairId:string,status:string):Promise<{repairId:string;shopId:string;status:string}>{
  this.check(session,shopId);
  const role=session.shops.find(x=>x.id===shopId)?.role;
  if(!['OWNER','ADMIN','TECHNICIAN'].includes(role||''))throw Error('Repair staff role required');
  if(!UUID.test(repairId)||!['PENDING','IN_PROGRESS','READY','COMPLETED','CANCELLED'].includes(status))throw Error('Invalid repair update');
  const v=obj(await this.call('/rest/v1/rpc/pos_admin_update_repair',session.accessToken,'POST',{
   p_shop:shopId,p_repair:repairId,p_status:status
  }));
  if(v.shopId!==shopId||v.repairId!==repairId||v.status!==status)throw Error('Unexpected repair update response');
  return {shopId,repairId,status};
 }
 async submitCashSale(session:MobileSession,shopId:string,idempotencyKey:string,items:{productId:string,quantity:number}[]):Promise<{saleId:string;shopId:string;totalCents:number;replayed:boolean}>{
  this.check(session,shopId);
  if(!UUID.test(idempotencyKey)||!Array.isArray(items)||items.length<1||items.length>100)throw Error('Invalid checkout');
  for(const i of items)if(!UUID.test(i.productId)||!Number.isSafeInteger(i.quantity)||i.quantity<1||i.quantity>1000)throw Error('Invalid sale item');
  const row=obj(await this.call('/rest/v1/rpc/pos_cash_checkout',session.accessToken,'POST',{
   p_shop_id:shopId,p_idempotency_key:idempotencyKey,p_items:items
  }));
  if(row.shopId!==shopId)throw Error('Cross-shop checkout response');
  return {shopId,saleId:str(row.saleId,'sale ID'),totalCents:nonnegative(row.totalCents,'sale total'),replayed:row.replayed===true};
 }
}
