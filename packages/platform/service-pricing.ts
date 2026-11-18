/**
 * Telcohauz BOZ service price recommendation engine.
 * Decision support only. Does not publish prices or edit POS products.
 * All currency values are integer MYR sen.
 * External AI analysis may propose contextual adjustments, but ONLY verified
 * cost evidence and admin approval can produce a saleable price.
 */
export type ServicePriceInput = {
  serviceId: string;
  serviceName: string;
  partsCostSen: number;
  labourCostSen: number;
  overheadSen: number;
  otherCostSen?: number;
  targetMarginPercent: number;
  marketSamplesSen?: number[];
  marketEvidence?: { source: string; checkedAt: string }[];
};
export type ServicePriceRecommendation = {
  serviceId: string;
  status: "NEEDS_ADMIN_REVIEW";
  floorSen: number;
  costSen: number;
  proposedSen: number;
  marketMedianSen: number | null;
  marginPercent: number;
  marketSampleCount: number;
  explanations: string[];
};

function sen(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000) {
    throw Error(label + " must be a nonnegative safe integer MYR sen");
  }
  return value;
}
function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a,b) => a-b);
  const k = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[k] : Math.round((sorted[k-1] + sorted[k]) / 2);
}
/** Deterministic, transparent pricing suggestion; not a claim of verified market pricing. */
export function recommendServicePrice(input: ServicePriceInput): ServicePriceRecommendation {
  if (!input.serviceId?.trim() || !input.serviceName?.trim()) throw Error("Service ID and name required");
  const costSen = sen(input.partsCostSen, "parts") + sen(input.labourCostSen, "labour") +
    sen(input.overheadSen, "overhead") + sen(input.otherCostSen ?? 0, "other");
  if (!Number.isSafeInteger(costSen) || costSen <= 0) throw Error("Verified total cost required");
  if (!Number.isFinite(input.targetMarginPercent) ||
      input.targetMarginPercent < 0 || input.targetMarginPercent >= 100) {
    throw Error("Target gross margin must be between 0 and 100 exclusive");
  }
  const minimum = Math.ceil(costSen / (1-input.targetMarginPercent/100));
  const samples = input.marketSamplesSen ?? [];
  // Samples without an auditable 1:1 evidence record are ignored.
  const evidence = input.marketEvidence ?? [];
  const marketVerified = samples.length >= 3 && samples.length === evidence.length &&
    samples.every(v=>Number.isSafeInteger(v) && v>0) &&
    evidence.every(e=>e.source?.startsWith("https://") && Number.isFinite(Date.parse(e.checkedAt)));
  const marketMedianSen = marketVerified ? median(samples) : null;
  const proposedSen = marketMedianSen === null ? minimum : Math.max(minimum,marketMedianSen);
  const explanations = [
    "Cadangan sahaja. Harga tidak diaktifkan tanpa kelulusan admin.",
    "Kos direkod dalam sen; floor berdasarkan sasaran margin untung kasar.",
    ...(marketVerified ? ["Median berdasarkan "+samples.length+" harga dengan rujukan; kesahihan sumber masih perlu disemak admin."] :
      ["Data pesaing tidak mencukupi atau tiada rujukan lengkap; tiada harga pasaran direka."]),
  ];
  return {
    serviceId:input.serviceId,status:"NEEDS_ADMIN_REVIEW",
    floorSen:minimum,costSen,proposedSen,marketMedianSen,
    marginPercent:input.targetMarginPercent,marketSampleCount:marketVerified?samples.length:0,
    explanations,
  };
}
export function mayPublishServicePrice(recommendation: ServicePriceRecommendation, approval: {
  authorizedAdmin: boolean; approvedSen: number; verifiedCosts: boolean; approvalReference: string;
}) {
  return approval.authorizedAdmin === true && approval.verifiedCosts === true &&
    !!approval.approvalReference?.trim() && Number.isSafeInteger(approval.approvedSen) &&
    approval.approvedSen >= recommendation.floorSen;
}
