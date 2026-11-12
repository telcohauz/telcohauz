import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side check: throws 403 unless the caller holds an owner or admin
 * role in at least one company. Used to gate the Admin Panel route.
 */
export const assertAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .limit(1);
    if (error) throw new Response("Forbidden", { status: 403 });
    if (!data || data.length === 0) throw new Response("Forbidden", { status: 403 });
    return { ok: true as const };
  });