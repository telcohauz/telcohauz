import test from 'node:test';
import assert from 'node:assert/strict';
import products from './data/products.json' with { type: 'json' };
import { validateCatalog, canSell, publicProduct, findDuplicateCandidates } from './catalog.ts';
const now = new Date('2026-11-12T00:00:00Z');
const approved = () => ({ ...products[0], reviewStatus: 'approved', availability: 'available', approvedChannels: ['web', 'hero'], supplier: 'easyapply', commissionSen: 1000, verifiedBy: 'authorized-reviewer', verifiedAt: '2026-11-11T00:00:00Z', evidenceUrl: 'https://example.org/provider-evidence' });
test('imported records keep unique IDs and provenance and remain on hold', () => {
  validateCatalog(products); assert.ok(products.length > 0);
  for (const p of products) { assert.equal(p.reviewStatus,'hold'); assert.equal(canSell(p,'hero',now),false); }
});
test('pending products never expose prices or application permission', () => {
  const p = publicProduct(products[0], 'hero', now); assert.equal(p.priceMonthlySen,null); assert.equal(p.commissionSen,null); assert.equal(p.canApply,false);
});
test('HERO admits only approved EasyApply telco plans with commission', () => {
  assert.equal(canSell(approved(),'hero',now),true);
  for (const patch of [{domain:'physical_product'},{supplier:'other'},{commissionSen:null},{reviewStatus:'hold'},{approvedChannels:['web']},{availability:'pending_verification'}]) assert.equal(canSell({...approved(),...patch},'hero',now),false);
});
test('stale, future, missing or invalid verification cannot unlock applications', () => {
  for (const patch of [{verifiedAt:'2025-01-01'},{verifiedAt:'2027-01-01'},{verifiedBy:null},{evidenceUrl:'javascript:alert(1)'},{commissionSen:-1}]) assert.equal(canSell({...approved(),...patch},'hero',now),false);
});
test('duplicate IDs and fractional or negative money are rejected', () => {
  assert.throws(()=>validateCatalog([products[0],products[0]]));
  assert.throws(()=>validateCatalog([{...products[0],priceMonthlySen:0.5}]));
});
test('duplicate proposals preserve both records and distinguish product domains', () => {
  const pair=[products[0],{...products[0],id:'another'}]; assert.equal(findDuplicateCandidates(pair).length,1); assert.equal(pair.length,2);
  assert.equal(findDuplicateCandidates([pair[0],{...pair[1],domain:'physical_product'}]).length,0);
});
