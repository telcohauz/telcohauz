/** Telcohauz Market deposit policy. Monetary amounts are integer MYR sen. */
export const MARKET_DEPOSIT_PERCENT = 40 as const;
export const MARKET_BALANCE_PERCENT = 60 as const;

export type MarketOrderStatus =
  | "AWAITING_DEPOSIT"
  | "DEPOSIT_SUBMITTED"
  | "DEPOSIT_VERIFIED"
  | "AWAITING_BALANCE"
  | "PAID_IN_FULL"
  | "CANCELLED";

/** Round the 40% deposit up to the next sen; the balance is the exact remainder. */
export function marketDepositBreakdown(totalSen: number) {
  if (!Number.isSafeInteger(totalSen) || totalSen <= 0) {
    throw new Error("Order total must be a positive integer number of sen");
  }
  const depositSen = Math.ceil(totalSen * MARKET_DEPOSIT_PERCENT / 100);
  const balanceSen = totalSen - depositSen;
  return { totalSen, depositSen, balanceSen, depositPercent: MARKET_DEPOSIT_PERCENT };
}

/** Payment submission alone is not proof of successful payment. */
export function canConfirmMarketOrder(paymentVerified: boolean, verifiedDepositSen: number, totalSen: number) {
  const { depositSen } = marketDepositBreakdown(totalSen);
  return paymentVerified === true &&
    Number.isSafeInteger(verifiedDepositSen) &&
    verifiedDepositSen >= depositSen;
}

export const MARKET_DEPOSIT_TERMS_MS =
  "Tempahan Telcohauz Market memerlukan deposit 40% daripada jumlah harga pesanan. " +
  "Baki 60% perlu dijelaskan sebelum barang diserahkan atau dihantar. " +
  "Tempahan hanya disahkan selepas penerimaan deposit berjaya disahkan oleh sistem/pentadbir. " +
  "Butiran bayaran, tempoh pemprosesan, pembatalan dan pemulangan wang mesti dimaklumkan sebelum bayaran; " +
  "hak pengguna di bawah undang-undang yang terpakai tetap terpelihara.";
