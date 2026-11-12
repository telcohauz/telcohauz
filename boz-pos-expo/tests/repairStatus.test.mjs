import test from 'node:test';
import assert from 'node:assert/strict';
import {BozSupabaseApi} from '../src/supabaseMobile.ts';
const shop='a1111111-1111-4111-8111-111111111111',job='b2222222-2222-4222-8222-222222222222';
const session={accessToken:'test',userId:'u',shops:[{id:shop,name:'A',role:'TECHNICIAN'}]};
test('repair status retains canonical enum for workflow decisions',async()=>{
 const api=new BozSupabaseApi('https://example.supabase.co','sb_publishable_1234567890abcdef',async()=>({
 ok:true,status:200,json:async()=>[{id:job,shop_id:shop,ticket_no:'R1',device:'Phone',issue:'Port',status:'IN_PROGRESS'}]}));
 const list=await api.repairs(session,shop);
 assert.equal(list[0].status,'IN_PROGRESS');
});
