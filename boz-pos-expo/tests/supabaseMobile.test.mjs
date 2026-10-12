import test from 'node:test';
import assert from 'node:assert/strict';
import {BozSupabaseApi} from '../src/supabaseMobile.ts';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222',P='c3333333-3333-4333-8333-333333333333';
const root='https://example.supabase.co',key='sb_publishable_1234567890abcdef';
const user={accessToken:'jwt-for-test',userId:'u',shops:[{id:A,name:'A',role:'CASHIER'}]};
function fake(routes){return async(url,req)=>{const q=String(url).replace(root,'');const r=routes[q];if(r===undefined)throw Error('Unexpected path: '+q);return {ok:true,status:200,json:async()=>r}}}
test('reject endpoints with credentials or wrong schemes and secret keys',()=>{
 for(const url of ['http://example.supabase.co','https://u:pw@example.supabase.co','https://example.com','https://example.supabase.co/other'])assert.throws(()=>new BozSupabaseApi(url,key));
 assert.throws(()=>new BozSupabaseApi(root,'sb_secret_example'));
});
test('staff login only returns server-assigned and visible active shops',async()=>{
 const api=new BozSupabaseApi(root,key,fake({
 '/auth/v1/token?grant_type=password':{access_token:'jwt',user:{id:'user-1'}},
 '/rest/v1/pos_memberships?select=shop_id,role&active=eq.true':[{shop_id:A,role:'CASHIER'}],
 '/rest/v1/pos_shops?select=id,name&active=eq.true':[{id:A,name:'Shop A'},{id:B,name:'Shop B'}]
 }));
 const s=await api.signIn('staff@example.test','pw');
 assert.deepEqual(s.shops,[{id:A,name:'Shop A',role:'CASHIER'}]);
});
test('client rejects unassigned shop before network request',async()=>{
 let calls=0;const api=new BozSupabaseApi(root,key,async()=>{calls++;throw Error('No calls expected')});
 await assert.rejects(api.inventory(user,B),/not authorized/);
 await assert.rejects(api.repairs(user,B),/not authorized/);
 await assert.rejects(api.submitCashSale(user,B,P,[{productId:P,quantity:1}]),/not authorized/);
 assert.equal(calls,0);
});
test('inventory derives stock from per-shop server records and cents',async()=>{
 const api=new BozSupabaseApi(root,key,fake({
 ['/rest/v1/pos_products?select=id,shop_id,sku,barcode,name,price_cents&active=eq.true&shop_id=eq.'+A]:
 [{id:P,shop_id:A,sku:'CABLE',barcode:'9550001',name:'Cable',price_cents:1280}],
 ['/rest/v1/pos_stock?select=shop_id,product_id,available_qty&shop_id=eq.'+A]:
 [{shop_id:A,product_id:P,available_qty:4}]
 }));
 const x=await api.inventory(user,A);assert.equal(x[0].price,1280);assert.equal(x[0].qty,4);
});
test('malicious cross-shop inventory response is never displayed',async()=>{
 const api=new BozSupabaseApi(root,key,fake({
 ['/rest/v1/pos_products?select=id,shop_id,sku,barcode,name,price_cents&active=eq.true&shop_id=eq.'+A]:
 [{id:P,shop_id:B,sku:'X',name:'Outside shop',price_cents:10}],
 ['/rest/v1/pos_stock?select=shop_id,product_id,available_qty&shop_id=eq.'+A]:[]
 }));
 await assert.rejects(api.inventory(user,A),/Cross-shop/);
});
test('server RPC receives authenticated token and no client-authoritative prices',async()=>{
 const api=new BozSupabaseApi(root,key,async(url,req)=>{
  assert.equal(url,root+'/rest/v1/rpc/pos_cash_checkout');
  assert.equal(req.headers.Authorization,'Bearer jwt-for-test');
  assert.equal(req.headers.apikey,key);
  const data=JSON.parse(req.body);
  assert.deepEqual(Object.keys(data).sort(),['p_idempotency_key','p_items','p_shop_id']);
  return {ok:true,status:200,json:async()=>({saleId:P,shopId:A,totalCents:1280,replayed:false})};
 });
 const x=await api.submitCashSale(user,A,P,[{productId:P,quantity:1}]);
 assert.equal(x.totalCents,1280);
});
