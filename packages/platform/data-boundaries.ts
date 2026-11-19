/**
 * BOZ domain isolation. Pure functions; no database/network access.
 * Default-deny: only explicit approved fields leave the private boundary.
 */
export type PublicServiceListing = Readonly<{
  id: string; name: string; category: string; priceSen: number;
  description: string; updatedAt: string;
}>;
export type PrivateServiceRecord = Readonly<{
  id: string; shopId: string; name: string; category: string; description: string;
  priceSen: number; updatedAt: string; approvedPublic: boolean;
  supplierCostSen: number; customerId?: string; internalNotes?: string;
  supplierName?: string; employeeId?: string;
}>;
export type PrivatePaymentRecord = Readonly<{
  transactionId: string; shopId: string; orderId: string;
  providerReference: string; paidSen: number; verifiedAt: string;
}>;
export type PublicOrderStatus = "AWAITING_DEPOSIT" | "AWAITING_BALANCE" | "PAID_IN_FULL" | "CANCELLED";

function assertText(value: string, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw Error("Invalid " + label);
  return value.trim();
}
/** The only allowed projection from internal service records to public Market. */
export function toPublicServiceListing(record: PrivateServiceRecord): PublicServiceListing | null {
  if (record.approvedPublic !== true) return null;
  if (!Number.isSafeInteger(record.priceSen) || record.priceSen < 0) throw Error("Invalid public price");
  const url = new Date(record.updatedAt);
  if (!Number.isFinite(url.getTime())) throw Error("Invalid timestamp");
  return Object.freeze({
    id: assertText(record.id, "service id"),
    name: assertText(record.name, "name"),
    category: assertText(record.category, "category"),
    priceSen: record.priceSen,
    description: record.description || "",
    updatedAt: url.toISOString(),
  });
}
/**
 * AI reads ONLY public market observations. No customer, cost, staff or payment
 * fields can survive this allowlist projection.
 */
export type PublicMarketObservation = Readonly<{
  evidenceId: string; serviceName: string; marketPriceSen: number;
  sourceUrl: string; checkedAt: string;
}>;
export function toPublicAiObservation(value: Record<string, unknown>): PublicMarketObservation {
  const price = value.marketPriceSen;
  const sourceUrl = assertText(value.sourceUrl as string, "source URL");
  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw Error("HTTPS market evidence required");
  if (!Number.isSafeInteger(price) || (price as number) <= 0) throw Error("Invalid market evidence price");
  const timestamp = new Date(assertText(value.checkedAt as string, "checkedAt"));
  if (!Number.isFinite(timestamp.getTime())) throw Error("Invalid evidence date");
  return Object.freeze({
    evidenceId: assertText(value.evidenceId as string, "evidenceId"),
    serviceName: assertText(value.serviceName as string, "serviceName"),
    marketPriceSen: price as number,
    sourceUrl: parsed.toString(),
    checkedAt: timestamp.toISOString(),
  });
}
/** No detailed payment IDs, names, costs or references are public. */
export function publicOrderView(order: { id: string; status: PublicOrderStatus; totalSen: number }) {
  if (!Number.isSafeInteger(order.totalSen) || order.totalSen < 0) throw Error("Invalid order total");
  return Object.freeze({ id: assertText(order.id, "order id"), status: order.status, totalSen: order.totalSen });
}
