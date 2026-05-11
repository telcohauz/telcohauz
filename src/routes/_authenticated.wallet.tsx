import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, Coins, Plus, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — TELCOHAUZ Digital Hub" }] }),
  component: WalletPage,
});

interface Txn {
  id: string; type: string; amount: number; balance_after: number;
  description: string | null; created_at: string;
}
interface TopUp {
  id: string; amount: number; credits: number; method: string;
  status: string; created_at: string;
}

function WalletPage() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [tab, setTab] = useState<"txn" | "topup">("txn");

  useEffect(() => {
    if (!user) return;
    supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setTxns((data ?? []) as Txn[]));
    supabase.from("topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setTopups((data ?? []) as TopUp[]));
  }, [user]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Account</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Wallet & Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your credit balance and top-up history.</p>
        </div>
        <Link to="/wallet/topup" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-3 font-semibold text-background shadow-[var(--glow-neon)] hover:scale-[1.02] transition">
          <Plus className="h-4 w-4" /> Top Up Credits
        </Link>
      </div>

      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[oklch(0.55_0.22_270)]/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Available Balance
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-5xl sm:text-6xl font-bold">RM {balance.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Mini icon={ArrowDownLeft} label="Top-ups" value={topups.filter(t=>t.status==="approved").length.toString()} />
            <Mini icon={ArrowUpRight} label="Orders" value={txns.filter(t=>t.type==="order").length.toString()} />
            <Mini icon={Clock} label="Pending" value={topups.filter(t=>t.status==="pending").length.toString()} />
            <Mini icon={Coins} label="Currency" value="RM" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="flex border-b border-border/40">
          <TabBtn active={tab==="txn"} onClick={()=>setTab("txn")}>Transactions</TabBtn>
          <TabBtn active={tab==="topup"} onClick={()=>setTab("topup")}>Top-up Requests</TabBtn>
        </div>
        {tab === "txn" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Description</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Balance</th></tr>
              </thead>
              <tbody>
                {txns.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No transactions yet.</td></tr>
                ) : txns.map(t => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-muted/30">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3"><TypeBadge type={t.type} /></td>
                    <td className="px-5 py-3">{t.description}</td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${Number(t.amount) >= 0 ? "text-[oklch(0.78_0.16_155)]" : "text-destructive"}`}>
                      {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">{Number(t.balance_after).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Method</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Credits</th><th className="px-5 py-3">Status</th></tr>
              </thead>
              <tbody>
                {topups.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No top-ups yet. <Link to="/wallet/topup" className="text-primary hover:underline">Make your first top-up →</Link></td></tr>
                ) : topups.map(t => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-muted/30">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3 uppercase text-xs tracking-wider">{t.method.replace("_"," ")}</td>
                    <td className="px-5 py-3 text-right font-mono">RM {Number(t.amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-primary">+{Number(t.credits).toFixed(2)}</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
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

function Mini({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
function TabBtn({ active, onClick, children }: any) {
  return <button onClick={onClick} className={`px-5 py-3 text-sm font-semibold transition ${active ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}
function TypeBadge({ type }: { type: string }) {
  const map: Record<string,string> = {
    topup: "bg-[oklch(0.78_0.16_155)]/15 text-[oklch(0.78_0.16_155)]",
    order: "bg-primary/15 text-primary",
    refund: "bg-[oklch(0.85_0.16_80)]/15 text-[oklch(0.85_0.16_80)]",
    adjustment: "bg-muted text-muted-foreground",
    bonus: "bg-[oklch(0.55_0.22_270)]/15 text-[oklch(0.7_0.22_270)]",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${map[type] ?? "bg-muted"}`}>{type}</span>;
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string,{cls:string;Icon:any}> = {
    pending: { cls: "bg-[oklch(0.85_0.16_80)]/15 text-[oklch(0.85_0.16_80)]", Icon: Clock },
    approved: { cls: "bg-[oklch(0.78_0.16_155)]/15 text-[oklch(0.78_0.16_155)]", Icon: CheckCircle2 },
    rejected: { cls: "bg-destructive/15 text-destructive", Icon: XCircle },
    cancelled: { cls: "bg-muted text-muted-foreground", Icon: XCircle },
  };
  const v = map[status] ?? map.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${v.cls}`}><v.Icon className="h-3 w-3" />{status}</span>;
}
