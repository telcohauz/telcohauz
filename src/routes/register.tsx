import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldLabel, Input, PrimaryButton } from "@/components/auth/AuthShell";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["customer", "reseller"]),
});

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ display_name: "", email: "", phone: "", password: "" });
  const [role, setRole] = useState<"customer" | "reseller">("customer");
  const [loading, setLoading] = useState(false);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, role });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          display_name: parsed.data.display_name,
          phone: parsed.data.phone || null,
          role: parsed.data.role,
        },
      },
    });
    setLoading(false);

    if (error) return toast.error(error.message);

    toast.success("Account created! Check your email for the 6-digit code.");
    nav({ to: "/verify", search: { email: parsed.data.email } });
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the TELCOHAUZ marketplace">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <FieldLabel>Account type</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <RoleOption icon={ShoppingBag} label="Customer" desc="Order services" active={role === "customer"} onClick={() => setRole("customer")} />
            <RoleOption icon={Users} label="Reseller" desc="Wholesale & API" active={role === "reseller"} onClick={() => setRole("reseller")} />
          </div>
        </div>
        <div>
          <FieldLabel>Display name</FieldLabel>
          <Input value={form.display_name} onChange={upd("display_name")} placeholder="Your name" required />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" autoComplete="email" value={form.email} onChange={upd("email")} placeholder="you@telcohauz.com" required />
        </div>
        <div>
          <FieldLabel>WhatsApp / Phone (optional)</FieldLabel>
          <Input value={form.phone} onChange={upd("phone")} placeholder="+60 12 345 6789" />
        </div>
        <div>
          <FieldLabel>Password</FieldLabel>
          <Input type="password" autoComplete="new-password" value={form.password} onChange={upd("password")} placeholder="At least 8 characters" required />
        </div>
        <PrimaryButton type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

function RoleOption({ icon: Icon, label, desc, active, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
        active ? "border-primary bg-primary/10 shadow-[0_0_20px_oklch(0.72_0.22_235/0.2)]" : "border-border hover:border-primary/40"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] text-muted-foreground">{desc}</div>
    </button>
  );
}
