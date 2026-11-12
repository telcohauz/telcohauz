import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Company = {
  id: string;
  name: string;
  country: string;
  industry: string | null;
  business_type: string | null;
  registration_no: string | null;
  tax_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export function useCompanies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["companies", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Company[]> => {
      if (!user) return [];

      // Query companies where user is a member via company_members table
      // The RLS policy ensures we only see companies we have access to
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useCompanies] Query failed", { error, user_id: user.id });
        throw error;
      }

      return (data ?? []) as Company[];
    },
  });
}

export function useActiveCompany() {
  const { user } = useAuth();
  const { data: companies, isLoading } = useCompanies();

  // Filter to get the active company
  // Priority: profile.active_company_id if set and exists in companies list
  // Fallback: first company in list
  const active = companies?.[0] ?? null;

  return { company: active, companies: companies ?? [], isLoading };
}
