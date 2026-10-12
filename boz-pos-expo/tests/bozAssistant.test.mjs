import test from 'node:test';
import assert from 'node:assert/strict';
import {answerBozShopQuestion} from '../src/bozAssistant.ts';
const products=[
 {id:'1',shop:'a',sku:'A',barcode:'A',name:'Cable A',price:1500,qty:2},
 {id:'2',shop:'b',sku:'B',barcode:'B',name:'Secret Other Shop',price:9900,qty:1}
];
const repairs=[
 {id:'R1',shop:'a',device:'Phone A',issue:'Screen',status:'Pending'},
 {id:'R2',shop:'b',device:'Private Other Shop',issue:'Battery',status:'Pending'}
];
test('stock assistant is restricted to selected shop',()=>{
 const ans=answerBozShopQuestion('a',products,repairs,'Senarai stok rendah');
 assert.match(ans,/Cable A/);assert.doesNotMatch(ans,/Secret Other Shop/);
});
test('repair assistant cannot reveal other shop jobs',()=>{
 const ans=answerBozShopQuestion('a',products,repairs,'Pending repair');
 assert.match(ans,/Phone A/);assert.doesNotMatch(ans,/Private Other Shop/);
});
test('prices are MYR sen, and no seller costs are invented',()=>{
 assert.match(answerBozShopQuestion('a',products,repairs,'harga produk'),/RM 15.00/);
 assert.doesNotMatch(answerBozShopQuestion('a',products,repairs,'harga produk'),/RM 99.00/);
 assert.match(answerBozShopQuestion('a',products,repairs,'supplier costs'),/not available/i);
});
test('unknown questions do not trigger side effects or model calls',()=>{
 const ans=answerBozShopQuestion('a',products,repairs,'Tolong ubah harga barang');
 assert.equal(typeof ans,'string');
 assert.deepEqual(products[0],{id:'1',shop:'a',sku:'A',barcode:'A',name:'Cable A',price:1500,qty:2});
});
test('requires a shop and handles no data',()=>{
 assert.throws(()=>answerBozShopQuestion('',products,repairs,'stock'),/Shop context/);
 assert.match(answerBozShopQuestion('a',[],[], 'stock'),/No low-stock/);
});
