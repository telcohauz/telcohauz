import type { Tables } from "@/integrations/supabase/types";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(Number(data?.balance ?? 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`wallet-${user.id}`)
      .on<Tables<"wallets">>(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
        (payload) => setBalance(Number("balance" in payload.new ? payload.new.balance : 0)),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  return { balance, loading, refresh };
}
