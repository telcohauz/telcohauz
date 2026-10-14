import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChannelOrder, planShopeeReservation } from './core.mjs';

const fixture = () => ({ channel: 'shopee', shopId: 'shop-1', accountId: 'seller-1',
  externalOrderId: 'SP-100', status: 'READY_TO_SHIP', paymentVerified: true,
  lines: [{ externalLineKey: 'line-1', channelSku: 'ZM-TEST', quantity: 2, unitPriceSen: 1900 }] });
const approved = { authorizedShopId: 'shop-1', remoteOrderVerified: true, ownerApproved: true };
const mapping = [{ shopId: 'shop-1', accountId: 'seller-1', channelSku: 'ZM-TEST', bozSku: 'BOZ-TEST', verified: true }];

test('normalizes order using integer sen', () => {
  assert.equal(normalizeChannelOrder(fixture()).lines[0].unitPriceSen, 1900);
});
test('rejects duplicate order-line identifiers', () => {
  const order = fixture(); order.lines.push({ ...order.lines[0] });
  assert.throws(() => normalizeChannelOrder(order), /duplicate line reference/);
});
test('rejects negative or fractional quantities', () => {
  for (const qty of [-1, 1.5, 0]) { const order = fixture(); order.lines[0].quantity = qty;
    assert.throws(() => normalizeChannelOrder(order)); }
});
test('unverified payment, seller API or owner approval keeps stock on HOLD', () => {
  const order = fixture(); order.paymentVerified = false;
  assert.equal(planShopeeReservation(order, mapping, approved).state, 'HOLD');
  order.paymentVerified = true;
  assert.equal(planShopeeReservation(order, mapping, { ...approved, remoteOrderVerified: false }).state, 'HOLD');
  assert.equal(planShopeeReservation(order, mapping, { ...approved, ownerApproved: false }).state, 'HOLD');
});
test('protects tenants and unverified SKU mappings', () => {
  assert.equal(planShopeeReservation(fixture(), mapping, { ...approved, authorizedShopId: 'shop-2' }).state, 'HOLD');
  assert.equal(planShopeeReservation(fixture(), [{ ...mapping[0], shopId: 'shop-2' }], approved).state, 'HOLD');
  assert.equal(planShopeeReservation(fixture(), [{ ...mapping[0], verified: false }], approved).state, 'HOLD');
});
test('refund or cancellation cannot reserve stock', () => {
  for (const status of ['CANCELLED', 'REFUNDED', 'RETURNED']) {
    assert.equal(planShopeeReservation({ ...fixture(), status }, mapping, approved).state, 'HOLD');
  }
});
test('replayed Shopee events generate the same reservation idempotency key', () => {
  const a = planShopeeReservation(fixture(), mapping, approved);
  const b = planShopeeReservation({ ...fixture(), status: 'PROCESSED' }, mapping, approved);
  assert.equal(a.state, 'READY_FOR_TRANSACTIONAL_REVIEW');
  assert.equal(a.intents[0].idempotencyKey, b.intents[0].idempotencyKey);
  assert.equal(a.intents[0].state, 'HOLD');
});
test('Loyverse receipts do not generate duplicate BOZ stock reservations', () => {
  assert.equal(planShopeeReservation({ ...fixture(), channel: 'loyverse' }, mapping, approved).reason,
    'OTHER_CHANNEL_STOCK_ACCOUNTING');
});
