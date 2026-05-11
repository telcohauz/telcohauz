import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldLabel, Input, PrimaryButton } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwd !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return toast.error(error.message);

    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <FieldLabel>New password</FieldLabel>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="At least 8 characters" required />
        </div>
        <div>
          <FieldLabel>Confirm password</FieldLabel>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <PrimaryButton type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
