import assert from "node:assert/strict";
import test from "node:test";
import { marketDepositBreakdown, canConfirmMarketOrder, MARKET_DEPOSIT_PERCENT } from "./market-deposit.ts";

test("Telcohauz requires 40 percent deposit with exact remaining balance", () => {
  assert.equal(MARKET_DEPOSIT_PERCENT, 40);
  assert.deepEqual(marketDepositBreakdown(100000), {
    totalSen: 100000, depositSen: 40000, balanceSen: 60000, depositPercent: 40,
  });
  const small = marketDepositBreakdown(101);
  assert.equal(small.depositSen, 41);
  assert.equal(small.balanceSen, 60);
  assert.equal(small.depositSen + small.balanceSen, 101);
});

test("no order confirmation without a verified sufficient deposit", () => {
  assert.equal(canConfirmMarketOrder(false, 40000, 100000), false);
  assert.equal(canConfirmMarketOrder(true, 39999, 100000), false);
  assert.equal(canConfirmMarketOrder(true, 40000, 100000), true);
});

test("invalid totals never produce deposit requests", () => {
  for (const invalid of [0,-1,NaN,1.1,Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => marketDepositBreakdown(invalid));
  }
});
