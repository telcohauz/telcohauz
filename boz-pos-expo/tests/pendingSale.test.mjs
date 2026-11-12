import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePendingSale,encodePendingSale} from '../src/pendingSale.ts';
const id='a1111111-1111-4111-8111-111111111111';
const other='b2222222-2222-4222-8222-222222222222';
const item='c3333333-3333-4333-8333-333333333333';
test('serialize/recover idempotent sale request without secrets',()=>{
 const value={key:id,userId:other,shopId:id,items:[{productId:item,quantity:2}]};
 assert.deepEqual(parsePendingSale(encodePendingSale(value)),value);
 assert.doesNotMatch(encodePendingSale(value),/accessToken|password/i);
});
test('reject malformed or unsafe persisted cash records',()=>{
 for(const value of ['garbled','{}',JSON.stringify({key:'wrong',userId:other,shopId:id,items:[]}),
 JSON.stringify({key:id,userId:other,shopId:id,items:[{productId:item,quantity:-1}]}),
 JSON.stringify({key:id,userId:other,shopId:id,items:[{productId:item,quantity:1.5}]})])
 assert.throws(()=>parsePendingSale(value));
});
