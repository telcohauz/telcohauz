import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmedSalePrintHtml} from '../src/receiptPrint.ts';
const sale='a1111111-1111-4111-8111-111111111111';
test('confirmed receipt requires exact server sale ID',()=>{
 assert.throws(()=>confirmedSalePrintHtml(sale,'UNSAVED DRAFT'),/Only a server-confirmed/);
 assert.throws(()=>confirmedSalePrintHtml('wrong','BOZ POS · SALE CONFIRMATION'),/UUID/);
});
test('untrusted names cannot inject printer HTML',()=>{
 const input='BOZ POS · SALE CONFIRMATION\\nSale ID: '+sale+'\\nProduct <script>alert(1)</script> & Cable';
 const html=confirmedSalePrintHtml(sale,input);
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('&amp; Cable'));
 assert.ok(!html.includes('<script>'));
});
