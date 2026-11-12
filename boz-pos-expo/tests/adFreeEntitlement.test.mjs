import test from 'node:test';
import assert from 'node:assert/strict';
import {BozSupabaseApi} from '../src/supabaseMobile.ts';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const s={accessToken:'test',userId:'u',shops:[{id:A,name:'Shop',role:'CASHIER'}]};
const key='sb_publishable_1234567890abcdef';
test('ad-free is true only when authorized shop server confirms',async()=>{
 const api=new BozSupabaseApi('https://example.supabase.co',key,async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer test');
  assert.match(url,/shop_id=eq/);
  return {ok:true,status:200,json:async()=>[{shop_id:A,ad_free:true}]};
 });
 assert.equal(await api.adFreeEntitlement(s,A),true);
 await assert.rejects(api.adFreeEntitlement(s,B),/not authorized/);
});
test('missing or foreign entitlement defaults/rejects safely',async()=>{
 const empty=new BozSupabaseApi('https://example.supabase.co',key,async()=>({ok:true,json:async()=>[]}));
 assert.equal(await empty.adFreeEntitlement(s,A),false);
 const wrong=new BozSupabaseApi('https://example.supabase.co',key,async()=>({ok:true,json:async()=>[{shop_id:B,ad_free:true}]}));
 await assert.rejects(wrong.adFreeEntitlement(s,A),/Invalid entitlement/);
});
