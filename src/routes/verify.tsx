import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, PrimaryButton } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) || "" }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = useSearch({ from: "/verify" });
  const nav = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = code.join("");
    if (token.length !== 6) return toast.error("Enter the 6-digit code");
    if (!email) return toast.error("Missing email");

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setLoading(false);

    if (error) return toast.error(error.message);
    toast.success("Email verified!");
    nav({ to: "/dashboard" });
  };

  const resend = async () => {
    if (!email) return toast.error("Missing email");
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("New code sent");
    setCooldown(60);
  };

  return (
    <AuthShell title="Verify your email" subtitle={email ? `We sent a 6-digit code to ${email}` : "Check your inbox"}>
      <form onSubmit={verify} className="space-y-6">
        <div className="flex justify-center gap-2" onPaste={onPaste}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              onChange={(e) => onDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-12 rounded-xl border border-border bg-input/40 text-center font-display text-2xl font-bold text-foreground caret-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          ))}
        </div>

        <PrimaryButton type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify & continue
        </PrimaryButton>
      </form>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        <span>Didn't receive it?</span>
        <button
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:text-foreground">← Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
