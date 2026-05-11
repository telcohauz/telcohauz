import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/topups")({
  component: AdminTopups,
});

interface TopUp {
  id: string; user_id: string; amount: number; credits: number;
  method: string; reference: string | null; proof_url: string | null;
  status: string; admin_note: string | null; created_at: string;
  profiles?: { display_name: string | null; phone: string | null };
}

function AdminTopups() {
  const [items, setItems] = useState<TopUp[]>([]);
  const [filter, setFilter] = useState<"pending"|"approved"|"rejected"|"all">("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("topup_requests")
      .select("*, profiles:user_id(display_name, phone)")
      .order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const viewProof = async (path: string) => {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (data?.signedUrl) setProofUrl(data.signedUrl);
  };

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("approve_topup", { _topup_id: id, _note: null });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Top-up approved & credits added");
    load();
  };
  const reject = async (id: string) => {
    const note = prompt("Reason for rejection (optional):") ?? null;
    setBusy(id);
    const { error } = await supabase.rpc("reject_topup", { _topup_id: id, _note: note });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Top-up rejected");
    load();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Top-up Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and approve customer top-up requests.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending","approved","rejected","all"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${filter===s ? "bg-primary text-background" : "glass hover:bg-muted/30"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No top-ups in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th><th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Method</th><th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Credits</th>
                  <th className="px-5 py-3">Proof</th><th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium">{t.profiles?.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{t.profiles?.phone ?? ""}</div>
                    </td>
                    <td className="px-5 py-3 uppercase text-xs tracking-wider">{t.method.replace("_"," ")}</td>
                    <td className="px-5 py-3 font-mono text-xs">{t.reference ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono">RM {Number(t.amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-primary">+{Number(t.credits).toFixed(0)}</td>
                    <td className="px-5 py-3">
                      {t.proof_url ? (
                        <button onClick={() => viewProof(t.proof_url!)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusPill status={t.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {t.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button onClick={() => approve(t.id)} disabled={busy===t.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-[oklch(0.78_0.16_155)]/15 text-[oklch(0.78_0.16_155)] border border-[oklch(0.78_0.16_155)]/30 px-2.5 py-1 text-xs font-semibold hover:bg-[oklch(0.78_0.16_155)] hover:text-background transition disabled:opacity-50">
                            {busy===t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
                          </button>
                          <button onClick={() => reject(t.id)} disabled={busy===t.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-1 text-xs font-semibold hover:bg-destructive hover:text-background transition disabled:opacity-50">
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">{t.admin_note ?? "—"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {proofUrl && (
        <div onClick={() => setProofUrl(null)} className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur p-6">
          <img src={proofUrl} alt="Payment proof" className="max-h-[90vh] max-w-[90vw] rounded-xl border border-border/40" />
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; Icon: any }> = {
    pending: { cls: "bg-[oklch(0.85_0.16_80)]/15 text-[oklch(0.85_0.16_80)]", Icon: Clock },
    approved: { cls: "bg-[oklch(0.78_0.16_155)]/15 text-[oklch(0.78_0.16_155)]", Icon: CheckCircle2 },
    rejected: { cls: "bg-destructive/15 text-destructive", Icon: XCircle },
    cancelled: { cls: "bg-muted text-muted-foreground", Icon: XCircle },
  };
  const v = map[status] ?? map.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${v.cls}`}><v.Icon className="h-3 w-3" />{status}</span>;
}
