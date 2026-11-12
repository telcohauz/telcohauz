import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BOZ_SUPABASE_URL, BOZ_PUBLISHABLE_KEY } from "../../packages/core/config";

let core: SupabaseClient | undefined;
export function bozCore() {
  if (!core)
    core = createClient(BOZ_SUPABASE_URL, BOZ_PUBLISHABLE_KEY, {
      auth: { storageKey: "telcohauz-boz-core", persistSession: true, autoRefreshToken: true },
    });
  return core;
}
