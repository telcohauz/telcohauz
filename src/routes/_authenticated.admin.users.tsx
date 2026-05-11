import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

interface Row {
  user_id: string; email: string; display_name: string | null;
  phone: string | null; role: "admin"|"customer"|"reseller"|null;
  balance: number; created_at: string;
}

function AdminUsers() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Row[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    !q ? items : items.filter(r => [r.email, r.display_name, r.phone].some(x => x?.toLowerCase().includes(q.toLowerCase()))),
    [items, q]);

  const setRole = async (uid: string, role: Row["role"]) => {
    if (!role) return;
    setBusy(uid);
    const { error } = await supabase.rpc("admin_set_role", { _user_id: uid, _role: role });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Role updated"); load();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Users & Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage users, change roles and inspect wallet balances.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search email, name, phone..."
          className="w-full rounded-lg border border-border bg-input/40 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none" />
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : filtered.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">No users.</div>
          : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">User</th><th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th><th className="px-5 py-3 text-right">Balance</th>
                  <th className="px-5 py-3">Role</th><th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.user_id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] text-xs font-bold text-background">
                          {(r.display_name ?? r.email)[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium">{r.display_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs">{r.email}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-primary">RM {Number(r.balance).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <select disabled={busy===r.user_id} value={r.role ?? "customer"} onChange={(e)=>setRole(r.user_id, e.target.value as Row["role"])}
                        className="rounded-lg border border-border bg-input/40 px-2 py-1 text-xs uppercase tracking-wider">
                        <option value="customer">customer</option>
                        <option value="reseller">reseller</option>
                        <option value="admin">admin</option>
                      </select>
                      {r.role === "admin" && <Shield className="inline ml-2 h-3.5 w-3.5 text-primary" />}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
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
