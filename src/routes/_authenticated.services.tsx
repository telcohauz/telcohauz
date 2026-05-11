import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Apple, Network, Cpu, Wrench, Search, Coins, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "Services — TELCOHAUZ Digital Hub" }] }),
  component: ServicesPage,
});

interface Service {
  id: string; name: string; category: string; brand: string | null;
  description: string | null; credit_price: number; delivery_eta: string | null;
}

const ICONS: Record<string, any> = {
  Android: Smartphone, iPhone: Apple, Network: Network, Software: Cpu, Repair: Wrench,
};

function ServicesPage() {
  const { balance, refresh } = useWallet();
  const nav = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Service | null>(null);
  const [imei, setImei] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    supabase.from("services").select("*").eq("is_active", true).order("category")
      .then(({ data }) => { setServices((data ?? []) as Service[]); setLoading(false); });
  }, []);

  const filtered = services.filter(s =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.brand?.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase())
  );

  const placeOrder = async () => {
    if (!active) return;
    setPlacing(true);
    const { data, error } = await supabase.rpc("place_order", {
      _service_id: active.id, _imei: imei || undefined, _notes: notes || undefined,
    });
    setPlacing(false);
    if (error) {
      if (error.message.includes("Insufficient")) {
        toast.error("Insufficient credits. Please top up.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(`Order placed! ${(data as any)?.order_number ?? ""}`);
    setActive(null); setImei(""); setNotes("");
    refresh();
    nav({ to: "/wallet" });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Marketplace</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Unlock Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">Place an order — credits are deducted instantly.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-sm">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-semibold">RM {balance.toFixed(2)}</span>
          <Link to="/wallet/topup" className="ml-2 text-xs text-primary hover:underline">+ Top up</Link>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search services, brands, categories..."
          className="w-full rounded-lg border border-border bg-input/40 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => {
            const Icon = ICONS[s.category] ?? Cpu;
            return (
              <button key={s.id} onClick={()=>setActive(s)} className="text-left rounded-2xl glass p-5 glow-on-hover transition">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">RM {Number(s.credit_price).toFixed(0)}</span>
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.brand} · {s.category}</div>
                <div className="mt-1 font-semibold">{s.name}</div>
                {s.delivery_eta && <div className="mt-2 text-xs text-muted-foreground">⏱ {s.delivery_eta}</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Order modal */}
      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4" onClick={()=>setActive(null)}>
          <div onClick={(e)=>e.stopPropagation()} className="relative w-full max-w-md rounded-2xl glass-strong p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-primary">{active.brand} · {active.category}</div>
            <h3 className="mt-1 font-display text-xl font-bold">{active.name}</h3>
            {active.description && <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-background/40 border border-border/40 p-3">
              <span className="text-xs text-muted-foreground">Cost</span>
              <span className="font-mono font-bold text-primary">RM {Number(active.credit_price).toFixed(2)}</span>
            </div>

            {balance < Number(active.credit_price) && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Insufficient credits. <Link to="/wallet/topup" className="underline font-semibold">Top up now</Link>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">IMEI / Serial</label>
                <input value={imei} onChange={(e)=>setImei(e.target.value)} placeholder="15-digit IMEI"
                  className="mt-1 w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
                <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={()=>setActive(null)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button onClick={placeOrder} disabled={placing || balance < Number(active.credit_price)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-4 py-2.5 text-sm font-semibold text-background shadow-[var(--glow-neon)] disabled:opacity-50">
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
