import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldLabel, Input, PrimaryButton } from "@/components/auth/AuthShell";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please verify your email first.");
        nav({ to: "/verify", search: { email } });
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    nav({ to: redirect });
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your TELCOHAUZ dashboard">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@telcohauz.com" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel>Password</FieldLabel>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline mb-1.5">Forgot?</Link>
          </div>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <PrimaryButton type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        New to TELCOHAUZ?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
