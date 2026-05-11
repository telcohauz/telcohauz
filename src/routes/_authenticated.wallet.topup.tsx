import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Building2, Smartphone, Upload, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/wallet/topup")({
  head: () => ({ meta: [{ title: "Top Up — TELCOHAUZ Digital Hub" }] }),
  component: TopUpPage,
});

interface Pkg { id: string; name: string; credits: number; price: number; bonus: number; is_popular: boolean; }
type Method = "fpx" | "duitnow" | "manual_bank";

const METHODS: { id: Method; name: string; sub: string; icon: any }[] = [
  { id: "fpx", name: "FPX Online Banking", sub: "Maybank, CIMB, Public Bank, RHB and 20+ banks", icon: Building2 },
  { id: "duitnow", name: "DuitNow QR / Transfer", sub: "Scan to pay or transfer to our DuitNow ID", icon: Smartphone },
  { id: "manual_bank", name: "Manual Bank Transfer", sub: "Transfer and upload your receipt for approval", icon: CreditCard },
];

const BANK = {
  name: "TELCOHAUZ ENTERPRISE",
  bank: "Maybank Berhad",
  acct: "5142 9930 8821",
  duitnow: "+60 12-555 0188",
};

function TopUpPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<Method>("fpx");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("credit_packages").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setPackages((data ?? []) as Pkg[]));
  }, []);

  const customAmount = parseFloat(custom);
  const usingCustom = !selected && custom !== "" && customAmount > 0;
  const amount = selected ? selected.price : usingCustom ? customAmount : 0;
  const credits = selected ? selected.credits + selected.bonus : usingCustom ? customAmount : 0;

  const submit = async () => {
    if (!user) return;
    if (amount <= 0) return toast.error("Choose a package or enter a custom amount");
    if (method === "manual_bank" && !file) return toast.error("Please upload your payment proof");
    setSubmitting(true);
    try {
      let proof_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        proof_url = path;
      }
      const { error } = await supabase.from("topup_requests").insert({
        user_id: user.id,
        package_id: selected?.id ?? null,
        amount, credits, method,
        reference: reference || null,
        proof_url,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Top-up request submitted! Awaiting admin approval.");
      nav({ to: "/wallet" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div>
        <Link to="/wallet" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to wallet</Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Top Up Credits</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a package, select payment method and submit. Approved top-ups appear in your wallet within minutes.</p>
      </div>

      {/* Packages */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">1 — Select Package</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map(p => {
            const active = selected?.id === p.id;
            return (
              <button key={p.id} onClick={() => { setSelected(p); setCustom(""); }}
                className={`relative text-left rounded-2xl p-5 transition glow-on-hover ${active ? "glass-strong neon-border" : "glass"}`}>
                {p.is_popular && <span className="absolute -top-2 right-4 rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">Popular</span>}
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
                <div className="mt-2 font-display text-3xl font-bold">RM {Number(p.price).toFixed(0)}</div>
                <div className="mt-1 text-sm">
                  <span className="text-primary font-semibold">{Number(p.credits).toFixed(0)}</span>
                  <span className="text-muted-foreground"> credits</span>
                  {Number(p.bonus) > 0 && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold"><Sparkles className="h-3 w-3" />+{Number(p.bonus).toFixed(0)} bonus</span>}
                </div>
                {active && <div className="mt-3 flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Selected</div>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl glass p-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Or custom amount:</span>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-sm font-semibold">RM</span>
            <input type="number" min={10} step="0.01" value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
              placeholder="100.00"
              className="flex-1 rounded-lg border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <span className="text-xs text-muted-foreground">= 1:1 credits</span>
          </div>
        </div>
      </section>

      {/* Method */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">2 — Payment Method</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {METHODS.map(m => {
            const active = method === m.id;
            return (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`text-left rounded-2xl p-4 transition ${active ? "glass-strong neon-border" : "glass hover:bg-muted/30"}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-primary/15 border border-primary/30 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.sub}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bank details / instructions */}
        <div className="mt-4 rounded-2xl glass p-5">
          {method === "fpx" && (
            <div className="text-sm text-muted-foreground">
              You'll be redirected to your bank's FPX login page after submitting. (Demo mode — submission creates a pending request for admin approval.)
            </div>
          )}
          {method === "duitnow" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="DuitNow ID (Phone)" value={BANK.duitnow} />
              <Detail label="Account Name" value={BANK.name} />
              <div className="sm:col-span-2 text-xs text-muted-foreground">Transfer the exact amount and upload your receipt below for fast approval.</div>
            </div>
          )}
          {method === "manual_bank" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Bank" value={BANK.bank} />
              <Detail label="Account Name" value={BANK.name} />
              <Detail label="Account Number" value={BANK.acct} />
              <Detail label="Reference" value={user?.email?.split("@")[0] ?? "your username"} />
            </div>
          )}
        </div>
      </section>

      {/* Proof + reference */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">3 — Confirm Payment</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl glass p-5 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Bank Reference / Transaction ID (optional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN20260511..."
                className="w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Payment Proof {method === "manual_bank" ? "(required)" : "(optional)"}
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-input/20 px-4 py-6 hover:border-primary transition">
                <Upload className="h-5 w-5 text-primary" />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{file ? file.name : "Upload receipt screenshot"}</div>
                  <div className="text-xs text-muted-foreground">PNG, JPG up to 5MB</div>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
                    setFile(f ?? null);
                  }} />
              </label>
            </div>
          </div>

          <div className="rounded-2xl glass-strong p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-primary">Order Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Package" value={selected?.name ?? (usingCustom ? "Custom Amount" : "—")} />
              <Row label="Method" value={METHODS.find(m=>m.id===method)!.name} />
              <Row label="Amount" value={`RM ${amount.toFixed(2)}`} />
              <Row label="Credits" value={`${credits.toFixed(2)} cr`} accent />
              {selected && Number(selected.bonus) > 0 && <Row label="Bonus" value={`+${Number(selected.bonus).toFixed(0)} cr`} />}
            </div>
            <button onClick={submit} disabled={submitting || amount <= 0}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-3 font-semibold text-background shadow-[var(--glow-neon)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Top-Up Request"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground text-center">Pending requests are usually approved within 5–30 minutes during office hours.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold select-all">{value}</div>
    </div>
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
