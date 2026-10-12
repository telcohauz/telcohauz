import test from 'node:test';
import assert from 'node:assert/strict';
import {selectShopRecords} from '../src/shopView.ts';
const a={shop:'a',id:'a-record'};
const b={shop:'b',id:'b-record'};
test('switching shops immediately hides stale records',()=>{
 assert.deepEqual(selectShopRecords('b','a',[a,b]),[]);
 assert.deepEqual(selectShopRecords('b','',[a,b]),[]);
});
test('only matching and loaded shop records appear',()=>{
 assert.deepEqual(selectShopRecords('b','b',[a,b]),[b]);
 assert.deepEqual(selectShopRecords('a','a',[a,b]),[a]);
});
test('sign-out or incomplete state cannot reveal records',()=>{
 assert.deepEqual(selectShopRecords('','a',[a]),[]);
 assert.deepEqual(selectShopRecords('a','',[a]),[]);
});
