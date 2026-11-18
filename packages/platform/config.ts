/**
 * Shared public platform endpoints.
 * No secrets, staff tokens, role elevation, or database writes belong here.
 * DNS remains independent of telcohauz.com ownership.
 */
export const BOZ_SUPABASE_URL = "https://ocqcmdigylxasxsuxaxt.supabase.co";
export const BOZ_PUBLISHABLE_KEY = "sb_publishable_u_aD74cd37LsurSVrwngXQ_hWnjnIug";

export const TELCOHAUZ_MARKET_REFERENCE =
  "https://telcohauz-device-market.telcohauzphonetrd.chatgpt.site";

export const MODULE_PATHS = Object.freeze({
  workspace: "/workspace",
  pos: "/pos",
  market: "/market",
  masterProducts: "/master-products",
  catalog: "/catalog",
} as const);

export const FUTURE_DOMAINS = Object.freeze({
  main: "telcohauz.com",
  admin: "admin.telcohauz.com",
  pos: "pos.telcohauz.com",
  market: "market.telcohauz.com",
} as const);

export function moneyMYR(sen: number): string {
  if (!Number.isSafeInteger(sen) || sen < 0) throw new Error("Invalid MYR amount in sen");
  return "RM " + (sen / 100).toFixed(2);
}
