import { createHash } from 'node:crypto';

const BLOCKED_STATUSES = new Set(['CANCELLED', 'CANCELED', 'RETURNED', 'REFUNDED', 'UNPAID', 'FAILED']);
const CHANNELS = new Set(['shopee', 'loyverse', 'boz_pos']);

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be non-empty text`);
  return value.trim();
}
function integer(value, field, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new TypeError(`${field} must be a safe integer >= ${minimum}`);
  return value;
}

/** Provider adapters must verify authentication and fetch authoritative order details first.
 * This function NEVER verifies a provider webhook signature or moves inventory. */
export function normalizeChannelOrder(input) {
  if (!input || typeof input !== 'object') throw new TypeError('order object required');
  const channel = requiredText(input.channel, 'channel').toLowerCase();
  if (!CHANNELS.has(channel)) throw new TypeError('unsupported sales channel');
  const shopId = requiredText(input.shopId, 'shopId');
  const accountId = requiredText(input.accountId, 'accountId');
  const externalOrderId = requiredText(input.externalOrderId, 'externalOrderId');
  const status = requiredText(input.status, 'status').toUpperCase();
  if (typeof input.paymentVerified !== 'boolean') throw new TypeError('paymentVerified must be boolean');
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new TypeError('order lines are required');
  const lineRefs = new Set();
  const lines = input.lines.map((line, index) => {
    if (!line || typeof line !== 'object') throw new TypeError(`lines[${index}] is invalid`);
    const externalLineKey = requiredText(line.externalLineKey, `lines[${index}].externalLineKey`);
    if (lineRefs.has(externalLineKey)) throw new TypeError('duplicate line reference');
    lineRefs.add(externalLineKey);
    return Object.freeze({
      externalLineKey,
      channelSku: requiredText(line.channelSku, `lines[${index}].channelSku`),
      quantity: integer(line.quantity, `lines[${index}].quantity`, 1),
      unitPriceSen: line.unitPriceSen === undefined ? null : integer(line.unitPriceSen, `lines[${index}].unitPriceSen`),
    });
  });
  return Object.freeze({ channel, shopId, accountId, externalOrderId, status,
    paymentVerified: input.paymentVerified, lines: Object.freeze(lines) });
}

/** Never posts inventory. Produces HOLD intents for a separate transactional, idempotent writer. */
export function planShopeeReservation(order, verifiedMappings, options = {}) {
  const normalized = normalizeChannelOrder(order);
  const hold = reason => Object.freeze({ state: 'HOLD', reason, intents: [] });
  if (normalized.channel !== 'shopee') return hold('OTHER_CHANNEL_STOCK_ACCOUNTING');
  if (normalized.shopId !== options.authorizedShopId) return hold('SHOP_SCOPE_MISMATCH');
  if (BLOCKED_STATUSES.has(normalized.status)) return hold('CANCELLED_OR_REVERSED');
  if (!normalized.paymentVerified) return hold('PAYMENT_UNVERIFIED');
  if (options.remoteOrderVerified !== true) return hold('ORDER_NOT_VERIFIED_AGAINST_SHOPEE');
  if (options.ownerApproved !== true) return hold('AWAITING_OWNER_APPROVAL');
  if (!Array.isArray(verifiedMappings)) return hold('SKU_MAP_UNAVAILABLE');
  const intents = [];
  for (const line of normalized.lines) {
    const mapping = verifiedMappings.find(m => m && m.shopId === normalized.shopId &&
      m.accountId === normalized.accountId && m.channelSku === line.channelSku && m.verified === true);
    if (!mapping || typeof mapping.bozSku !== 'string' || !mapping.bozSku.trim()) return hold('UNVERIFIED_OR_UNMATCHED_SKU');
    const idempotencyKey = createHash('sha256').update(
      ['RESERVE', normalized.accountId, normalized.externalOrderId, line.externalLineKey].join('\0')
    ).digest('hex');
    intents.push(Object.freeze({ action: 'RESERVE', state: 'HOLD',
      shopId: normalized.shopId, bozSku: mapping.bozSku.trim(),
      quantity: line.quantity, idempotencyKey, externalLineKey: line.externalLineKey }));
  }
  return Object.freeze({ state: 'READY_FOR_TRANSACTIONAL_REVIEW', reason: null, intents });
}
