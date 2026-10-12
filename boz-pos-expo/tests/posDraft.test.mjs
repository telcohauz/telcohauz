import test from 'node:test';
import assert from 'node:assert/strict';
import {addCartUnit,cartLines,cartTotalCents,buildDraftReceipt} from '../src/posDraft.ts';
const a={id:'a1',shop:'a',sku:'A',barcode:'001',name:'Cable',price:1250,qty:2};
const b={id:'b1',shop:'b',sku:'B',barcode:'002',name:'Charger',price:1000,qty:5};
test('cart enforces active shop before addition',()=>{
 assert.throws(()=>addCartUnit({},b,'a'),/different shop/);
 assert.deepEqual(addCartUnit({},a,'a'),{a1:1});
});
test('cart cannot over-reserve demo stock',()=>{
 const twice=addCartUnit({a1:1},a,'a');assert.equal(twice.a1,2);
 assert.throws(()=>addCartUnit(twice,a,'a'),/Not enough/);
 assert.throws(()=>addCartUnit({a1:-1},a,'a'),/Invalid/);
});
test('cart lines reject unauthorized products and unknown IDs',()=>{
 assert.throws(()=>cartLines([a,b],{b1:1},'a'),/outside this shop/);
 assert.throws(()=>cartLines([a],{unknown:1},'a'),/outside this shop/);
 assert.throws(()=>cartLines([a],{a1:3},'a'),/exceeds available/);
});
test('all money is nonnegative integer sen with safe totals',()=>{
 assert.equal(cartTotalCents(cartLines([a],{a1:2},'a')),2500);
 assert.throws(()=>addCartUnit({}, {...a,price:-5},'a'),/Invalid price/);
 assert.throws(()=>cartLines([{...a,price:0.5}],{a1:1},'a'),/Invalid price/);
});
test('draft is explicitly non-transactional and contains no private credentials',()=>{
 const r=buildDraftReceipt([a,b],{a1:2},'a','Sample Shop','2026-10-12');
 assert.match(r,/UNSAVED DRAFT/);assert.match(r,/NOT A TAX INVOICE/);
 assert.match(r,/RM 25.00/);assert.match(r,/NO PAYMENT TAKEN/);
 assert.doesNotMatch(r,/Charger/);
 assert.throws(()=>buildDraftReceipt([a],{},'a','Sample Shop'),/Add an item/);
});
