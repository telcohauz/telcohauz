import test from 'node:test';
import assert from 'node:assert/strict';
import {BozSupabaseApi} from '../src/supabaseMobile.ts';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const R='c3333333-3333-4333-8333-333333333333';
const key='sb_publishable_1234567890abcdef';
test('only repair authorized staff may update real repair tickets',async()=>{
 const wrong={accessToken:'test',userId:'u',shops:[{id:A,name:'A',role:'CASHIER'}]};
 const api=new BozSupabaseApi('https://example.supabase.co',key,async()=>{throw Error('Request must not be sent')});
 await assert.rejects(api.updateRepair(wrong,A,R,'READY'),/role/);
 await assert.rejects(api.updateRepair(wrong,B,R,'READY'),/not authorized/);
});
test('correct shop technician uses server-side repair RPC',async()=>{
 const session={accessToken:'staff-jwt',userId:'u',shops:[{id:A,name:'A',role:'TECHNICIAN'}]};
 const api=new BozSupabaseApi('https://example.supabase.co',key,async(url,opts)=>{
  assert.match(url,/rpc\/pos_admin_update_repair$/);
  assert.equal(opts.headers.Authorization,'Bearer staff-jwt');
  const p=JSON.parse(opts.body);
  assert.deepEqual(p,{p_shop:A,p_repair:R,p_status:'READY'});
  return {ok:true,status:200,json:async()=>({shopId:A,repairId:R,status:'READY'})};
 });
 assert.equal((await api.updateRepair(session,A,R,'READY')).status,'READY');
 await assert.rejects(api.updateRepair(session,A,R,'INVALID'),/Invalid repair/);
});
