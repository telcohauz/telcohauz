export type ProductDomain = "telco_plan" | "physical_product" | "digital_service";
export interface MasterProduct {
  id: string;
  domain: string;
  name: string;
  provider: string;
  category: string;
  slug: string;
  priceMonthlySen: number | null;
  commissionSen: number | null;
  availability: string;
  reviewStatus: string;
  channels: string[];
  approvedChannels: string[];
  supplier: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  evidenceUrl: string | null;
  source: { repository: string; commit: string; path: string; id: string; declaredStatus: string };
  details: { contractMonths: number; features: string[]; eligibility: string; description: string };
}

export function validateCatalog(records: MasterProduct[]) {
  const ids = new Set<string>();
  for (const p of records) {
    if (!p.id || ids.has(p.id)) throw new Error("Duplicate or missing master product ID");
    ids.add(p.id);
    if (!["telco_plan", "physical_product", "digital_service"].includes(p.domain))
      throw new Error("Invalid product domain");
    if (!p.name.trim() || !p.source?.commit || !p.source?.id)
      throw new Error("Missing product provenance");
    for (const value of [p.priceMonthlySen, p.commissionSen]) {
      if (value !== null && (!Number.isSafeInteger(value) || value < 0))
        throw new Error("Money must use nonnegative integer sen");
    }
    if (!["hold", "approved", "revoked"].includes(p.reviewStatus))
      throw new Error("Invalid review status");
  }
  return records;
}

export function canSell(p: MasterProduct, channel: string, now = new Date()) {
  const verified = p.verifiedAt ? Date.parse(p.verifiedAt) : NaN;
  const age = now.getTime() - verified;
  if (
    p.reviewStatus !== "approved" ||
    p.availability !== "available" ||
    !p.approvedChannels.includes(channel)
  )
    return false;
  if (!Number.isFinite(age) || age < 0 || age > 90 * 86400000 || !p.verifiedBy?.trim())
    return false;
  try {
    if (new URL(p.evidenceUrl || "").protocol !== "https:") return false;
  } catch {
    return false;
  }
  if (
    channel === "hero" &&
    (p.domain !== "telco_plan" || p.supplier !== "easyapply" || p.commissionSen === null)
  )
    return false;
  return [p.priceMonthlySen, p.commissionSen].every(
    (v) => v === null || (Number.isSafeInteger(v) && v >= 0),
  );
}

export function publicProduct(p: MasterProduct, channel: string, now = new Date()) {
  const available = canSell(p, channel, now);
  return {
    id: p.id,
    name: p.name,
    provider: p.provider,
    category: p.category,
    description: p.details.description,
    availability: available ? "available" : "pending_verification",
    label: available ? "Tersedia" : "Belum tersedia",
    canApply: available,
    priceMonthlySen: available ? p.priceMonthlySen : null,
    commissionSen: available && channel === "hero" ? p.commissionSen : null,
  };
}

export function findDuplicateCandidates(records: MasterProduct[]) {
  const groups = new Map<string, string[]>();
  for (const p of records) {
    const key = [p.domain, p.provider, p.name]
      .map((v) => v.trim().toLowerCase().replace(/\s+/g, " "))
      .join("|");
    groups.set(key, [...(groups.get(key) || []), p.id]);
  }
  // Similar names are review proposals, never an automatic destructive merge.
  return [...groups.values()].filter((ids) => ids.length > 1);
}
