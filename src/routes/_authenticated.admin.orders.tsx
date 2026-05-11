import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending","processing","completed","rejected","refunded"] as const;
type OS = typeof STATUSES[number];

function AdminOrders() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<OS | "all">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("orders")
      .select("*, services(name, brand), profiles:user_id(display_name)")
      .order("created_at",{ascending:false}).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const update = async (id: string, status: OS, result?: string | null) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_update_order", { _order_id: id, _status: status, _result: result ?? null });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`);
    load();
  };

  const refund = async (id: string) => {
    if (!confirm("Refund credits to user wallet?")) return;
    setBusy(id);
    const { error } = await supabase.rpc("refund_order", { _order_id: id, _note: null });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Refunded");
    load();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Process and resolve customer unlock orders.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <FilterBtn s="all" cur={filter} set={setFilter}>All</FilterBtn>
        {STATUSES.map(s => <FilterBtn key={s} s={s} cur={filter} set={setFilter}>{s}</FilterBtn>)}
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : items.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">No orders.</div>
          : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th><th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Service</th><th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">IMEI</th><th className="px-5 py-3 text-right">Credits</th>
                  <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(o => (
                  <tr key={o.id} className="border-t border-border/30 hover:bg-muted/20 align-top">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono text-xs text-primary">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{o.services?.name}</div>
                      <div className="text-xs text-muted-foreground">{o.services?.brand}</div>
                    </td>
                    <td className="px-5 py-3">{o.profiles?.display_name ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{o.imei ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono">{Number(o.credits_charged).toFixed(0)}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-primary/15 text-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">{o.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5 flex-wrap justify-end">
                        <select disabled={busy===o.id} value={o.status} onChange={(e)=>update(o.id, e.target.value as OS)}
                          className="rounded-lg border border-border bg-input/40 px-2 py-1 text-xs">
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {o.status !== "refunded" && (
                          <button onClick={()=>refund(o.id)} disabled={busy===o.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-[oklch(0.85_0.16_80)]/15 text-[oklch(0.85_0.16_80)] border border-[oklch(0.85_0.16_80)]/30 px-2 py-1 text-xs font-semibold hover:bg-[oklch(0.85_0.16_80)] hover:text-background transition disabled:opacity-50">
                            <Undo2 className="h-3 w-3" /> Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ s, cur, set, children }: any) {
  return (
    <button onClick={() => set(s)}
      className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${cur===s ? "bg-primary text-background" : "glass hover:bg-muted/30"}`}>
      {children}
    </button>
  );
}
