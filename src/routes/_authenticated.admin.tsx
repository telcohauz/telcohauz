import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield, LayoutDashboard, Wallet, Package, ShoppingBag, Users, Settings,
  Zap, Menu, X, LogOut, Home, ArrowUpRight, Coins,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const roles = (data ?? []).map((r) => r.role);
    if (!roles.includes("admin")) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin Console — TELCOHAUZ Digital Hub" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/topups", label: "Top-up Approvals", icon: Wallet },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/services", label: "Services", icon: Package },
  { to: "/admin/packages", label: "Credit Packages", icon: Coins },
  { to: "/admin/users", label: "Users & Roles", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (to: string, exact?: boolean) => exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className="min-h-screen">
      {/* Mobile bar */}
      <div className="flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)]">
            <Shield className="h-4 w-4 text-background" />
          </div>
          <span className="font-display font-bold">ADMIN</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-muted">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border/40 bg-sidebar transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="hidden h-16 items-center gap-2 border-b border-border/40 px-6 lg:flex">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] shadow-[var(--glow-neon)]">
              <Shield className="h-5 w-5 text-background" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold">TELCOHAUZ</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary">Admin Console</div>
            </div>
          </div>

          <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3 scrollbar-hidden">
            {NAV.map((n) => {
              const active = isActive(n.to, (n as any).exact);
              return (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_oklch(0.72_0.22_235/0.15)]"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
            <div className="mt-auto pt-4 space-y-1">
              <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                <Home className="h-4 w-4" /> Customer Dashboard
              </Link>
              <button onClick={async () => { await signOut(); nav({ to: "/" }); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="hidden h-16 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur lg:flex">
            <div className="flex items-center gap-2">
              <div className="text-xs uppercase tracking-[0.2em] text-primary">Admin Console</div>
              <span className="text-muted-foreground">/</span>
              <div className="text-sm font-semibold">{NAV.find(n => isActive(n.to, (n as any).exact))?.label ?? "Overview"}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-1 rounded-lg glass px-3 py-1.5 text-xs hover:border-primary/40 transition">
                Customer view <ArrowUpRight className="h-3 w-3" />
              </Link>
              <div className="flex items-center gap-2 rounded-lg bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold uppercase tracking-wider text-primary">Admin</span>
              </div>
              <div title={displayName} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] text-sm font-bold text-background">{initial}</div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
