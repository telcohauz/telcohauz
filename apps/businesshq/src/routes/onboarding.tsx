import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({ meta: [{ title: "Setup — BusinessHQ" }] }),
  component: Onboarding,
});

const countries = [
  { v: "MY", n: "Malaysia 🇲🇾" },
  { v: "SG", n: "Singapore 🇸🇬" },
  { v: "US", n: "United States 🇺🇸" },
  { v: "UK", n: "United Kingdom 🇬🇧" },
  { v: "AU", n: "Australia 🇦🇺" },
  { v: "IN", n: "India 🇮🇳" },
  { v: "JP", n: "Japan 🇯🇵" },
  { v: "DE", n: "Germany 🇩🇪" },
  { v: "CA", n: "Canada 🇨🇦" },
];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("MY");
  const [businessType, setBusinessType] = useState("Sdn Bhd");
  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [tax, setTax] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const steps = ["Country", "Business", "Company", "Tax", "Done"];

  const submit = async () => {
    setBusy(true);

    // Verify user is still authenticated
    if (!user) {
      setBusy(false);
      toast.error("Your session expired. Please sign in again.");
      navigate({ to: "/auth", replace: true });
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      toast.error("Company name is required");
      setBusy(false);
      return;
    }

    try {
      // Step 1: Create company with owner_id = auth.uid()
      // RLS policy "companies owner insert" requires: auth.uid() = owner_id
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: name.trim(),
          country,
          business_type: businessType,
          registration_no: reg || null,
          tax_id: tax || null,
          owner_id: user.id, // Must match auth.uid() for RLS policy
        })
        .select()
        .single();

      if (companyError || !companyData) {
        console.error("[onboarding] Company creation failed", {
          error: companyError,
          user_id: user.id,
          payload: { name, country, businessType, reg, tax },
        });

        await logCompanyInsertFailure({
          sessionUserAvailable: true,
          payload: { name, country, businessType, reg, tax },
          error: {
            code: companyError?.code ?? "unknown",
            message: companyError?.message ?? "Unknown error",
            details: (companyError as any)?.details ?? null,
            hint: (companyError as any)?.hint ?? null,
          },
        });

        toast.error(companyError?.message || "Failed to create company. Please try again.");
        setBusy(false);
        return;
      }

      console.log("[onboarding] Company created successfully", {
        company_id: companyData.id,
        owner_id: user.id,
      });

      // Step 2: Update profile with active_company_id
      // The trigger "add_owner_as_member()" should have already added user to company_members
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ active_company_id: companyData.id })
        .eq("id", user.id);

      if (profileError) {
        console.warn("[onboarding] Profile update failed (non-fatal)", {
          error: profileError,
          user_id: user.id,
          company_id: companyData.id,
        });
        // Don't fail here; the company was created successfully
        // User can still proceed to dashboard
      }

      // Step 3: Invalidate queries and navigate
      await qc.invalidateQueries({ queryKey: ["companies"] });

      toast.success("Company created successfully!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      console.error("[onboarding] Unexpected error during onboarding", {
        error: err,
        user_id: user.id,
        message: err.message,
      });

      await logCompanyInsertFailure({
        sessionUserAvailable: true,
        payload: { name, country, businessType, reg, tax },
        error: {
          code: err.code || "unknown",
          message: err.message || "Unknown error",
          details: null,
          hint: null,
        },
      });

      toast.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  async function logCompanyInsertFailure(args: {
    sessionUserAvailable: boolean;
    payload: Record<string, unknown>;
    error: { code?: string | null; message?: string | null; details?: string | null; hint?: string | null };
  }) {
    try {
      await supabase.from("company_insert_failures").insert({
        user_id: user?.id ?? null,
        session_user_available: args.sessionUserAvailable,
        attempted_payload: args.payload as any,
        error_code: args.error.code ?? null,
        error_message: args.error.message ?? null,
        error_details: args.error.details ?? null,
        error_hint: args.error.hint ?? null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        route: typeof window !== "undefined" ? window.location.pathname : null,
      });
    } catch (e) {
      console.error("[onboarding] Failed to log company insert failure", e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= step ? "text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                style={i <= step ? { background: "var(--gradient-primary)" } : {}}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
          <h1 className="text-xl font-semibold">{step === 4 ? "All set!" : `Step ${step + 1}: ${steps[step]}`}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            {step === 0 && "Pick the country your business is registered in."}
            {step === 1 && "What kind of business is this?"}
            {step === 2 && "Add your company details."}
            {step === 3 && "Optional — add tax registration info."}
            {step === 4 && "Review and create your workspace."}
          </p>

          {step === 0 && (
            <div>
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{countries.map((c) => <SelectItem key={c.v} value={c.v}>{c.n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {step === 1 && (
            <div>
              <Label>Business type</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Sdn Bhd", "Enterprise / Sole Proprietor", "Partnership", "LLP", "Public Ltd", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label>Company name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Sdn Bhd" />
              </div>
              <div>
                <Label>Registration number</Label>
                <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="202301012345" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label>Tax ID / LHDN No</Label>
                <Input value={tax} onChange={(e) => setTax(e.target.value)} placeholder="C2584521234" />
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-2 text-sm">
              <Row k="Country" v={country} />
              <Row k="Business type" v={businessType} />
              <Row k="Company" v={name || "—"} />
              <Row k="Registration" v={reg || "—"} />
              <Row k="Tax ID" v={tax || "—"} />
            </div>
          )}

          <div className="mt-6 flex justify-between gap-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < 4 ? (
              <Button disabled={step === 2 && !name.trim()} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy || !name.trim()}>
                {busy ? "Creating…" : "Create workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border last:border-0 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
