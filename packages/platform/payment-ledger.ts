/**
 * Provider-verified payment state machine for Telcohauz Market orders.
 * Immutable, shop scoped, idempotent. Integration MUST verify provider signature,
 * reference, amount, currency, order mapping and webhook freshness server-side
 * BEFORE calling acceptVerifiedPayment. Client UI cannot call this directly.
 */
import { marketDepositBreakdown } from "./market-deposit";

export type OrderPaymentState = "AWAITING_DEPOSIT" | "AWAITING_BALANCE" | "PAID_IN_FULL";
export type PaymentPurpose = "DEPOSIT" | "BALANCE";
export type VerifiedProviderPayment = Readonly<{
  providerEventId: string;
  providerReference: string;
  orderId: string;
  shopId: string;
  amountSen: number;
  currency: "MYR";
  purpose: PaymentPurpose;
  verifiedByServer: true;
  providerTransactionStatus: "SETTLED";
}>;
export type MarketPaymentLedger = Readonly<{
  orderId: string;
  shopId: string;
  totalSen: number;
  paidSen: number;
  status: OrderPaymentState;
  processedProviderEventIds: readonly string[];
  paymentRecords: readonly Readonly<{
    eventId: string; reference: string; purpose: PaymentPurpose; amountSen: number;
  }>[];
}>;
export function createMarketPaymentLedger(orderId: string, shopId: string, totalSen: number): MarketPaymentLedger {
  if (!orderId?.trim() || !shopId?.trim()) throw Error("Order and shop are required");
  marketDepositBreakdown(totalSen);
  return Object.freeze({
    orderId, shopId, totalSen, paidSen: 0,
    status: "AWAITING_DEPOSIT" as const,
    processedProviderEventIds: Object.freeze([] as string[]),
    paymentRecords: Object.freeze([] as {eventId:string;reference:string;purpose:PaymentPurpose;amountSen:number}[]),
  });
}
export function acceptVerifiedPayment(
  current: MarketPaymentLedger, event: VerifiedProviderPayment,
): MarketPaymentLedger {
  // This flag must only be created by the trusted server after checking the payment provider.
  if (event.verifiedByServer !== true || event.providerTransactionStatus !== "SETTLED") throw Error("Unverified payment");
  if (!event.providerEventId?.trim() || !event.providerReference?.trim()) throw Error("Missing provider reference");
  if (event.currency !== "MYR" || event.shopId !== current.shopId || event.orderId !== current.orderId) throw Error("Payment scope mismatch");
  if (!Number.isSafeInteger(event.amountSen) || event.amountSen <= 0) throw Error("Invalid settled amount");
  if (current.processedProviderEventIds.includes(event.providerEventId)) return current;
  if (current.status === "PAID_IN_FULL") throw Error("Order already paid in full");
  const { depositSen } = marketDepositBreakdown(current.totalSen);
  if (current.status === "AWAITING_DEPOSIT" && (event.purpose !== "DEPOSIT" || event.amountSen < depositSen)) {
    throw Error("Verified minimum 40 percent deposit required");
  }
  if (current.status === "AWAITING_BALANCE" && event.purpose !== "BALANCE") throw Error("Balance payment required");
  const remaining = current.totalSen - current.paidSen;
  if (event.amountSen > remaining) throw Error("Overpayment requires manual reconciliation/refund");
  const paidSen = current.paidSen + event.amountSen;
  const status: OrderPaymentState = paidSen === current.totalSen ? "PAID_IN_FULL" : "AWAITING_BALANCE";
  return Object.freeze({
    ...current, paidSen, status,
    processedProviderEventIds: Object.freeze([...current.processedProviderEventIds,event.providerEventId]),
    paymentRecords: Object.freeze([...current.paymentRecords,Object.freeze({
      eventId:event.providerEventId,reference:event.providerReference,
      purpose:event.purpose,amountSen:event.amountSen,
    })]),
  });
}
/** Only a fully reconciled ledger permits fulfillment. */
export function mayReleaseGoods(ledger: MarketPaymentLedger): boolean {
  return ledger.status === "PAID_IN_FULL" && ledger.paidSen === ledger.totalSen;
}
