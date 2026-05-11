import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldLabel, Input, PrimaryButton } from "@/components/auth/AuthShell";
import { z } from "zod";

const schema = z.string().trim().email("Enter a valid email").max(255);

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset link sent — check your inbox");
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll send you a secure reset link">
      {sent ? (
        <div className="rounded-xl bg-success/10 border border-success/30 p-4 text-center text-sm">
          <div className="font-semibold text-[oklch(0.78_0.16_155)]">Check your email</div>
          <div className="mt-1 text-muted-foreground">We sent a reset link to <span className="text-foreground">{email}</span></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@telcohauz.com" required />
          </div>
          <PrimaryButton type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </PrimaryButton>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:text-foreground">← Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
