import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, ShoppingBag, Users, Coins, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({
    pendingTopups: 0, totalUsers: 0, totalOrders: 0, pendingOrders: 0,
    creditsIssued: 0, revenue: 0,
  });
  const [recentTopups, setRecentTopups] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: pendingTopups }, { count: pendingOrders }, { count: totalOrders },
        { data: users }, { data: tx }, { data: rev },
        { data: rt }, { data: ro }] = await Promise.all([
        supabase.from("topup_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending","processing"]),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.rpc("admin_list_users"),
        supabase.from("wallet_transactions").select("amount").eq("type","topup"),
        supabase.from("topup_requests").select("amount").eq("status","approved"),
        supabase.from("topup_requests").select("id, amount, credits, method, status, created_at, user_id, profiles:user_id(display_name)").eq("status","pending").order("created_at",{ascending:false}).limit(5),
        supabase.from("orders").select("id, order_number, status, credits_charged, created_at, services(name)").order("created_at",{ascending:false}).limit(5),
      ]);
      setStats({
        pendingTopups: pendingTopups ?? 0,
        totalUsers: users?.length ?? 0,
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        creditsIssued: (tx ?? []).reduce((a,t:any) => a + Number(t.amount), 0),
        revenue: (rev ?? []).reduce((a,t:any) => a + Number(t.amount), 0),
      });
      setRecentTopups(rt ?? []);
      setRecentOrders(ro ?? []);
    })();
  }, []);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Overview</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational pulse of the entire platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Pending Top-ups" value={stats.pendingTopups} icon={Clock} tone="warn" to="/admin/topups" />
        <Stat label="Pending Orders" value={stats.pendingOrders} icon={AlertTriangle} tone="warn" to="/admin/orders" />
        <Stat label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} to="/admin/orders" />
        <Stat label="Total Users" value={stats.totalUsers} icon={Users} to="/admin/users" />
        <Stat label="Credits Issued" value={`${stats.creditsIssued.toFixed(0)} cr`} icon={Coins} />
        <Stat label="Revenue (approved)" value={`RM ${stats.revenue.toFixed(0)}`} icon={TrendingUp} tone="good" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Pending Top-ups" link="/admin/topups">
          {recentTopups.length === 0 ? <Empty msg="No pending top-ups" /> : (
            <ul className="divide-y divide-border/30">
              {recentTopups.map((t:any) => (
                <li key={t.id} className="flex items-center justify-between py-3 px-5">
                  <div>
                    <div className="text-sm font-medium">{t.profiles?.display_name ?? "User"}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.method.replace("_"," ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">RM {Number(t.amount).toFixed(2)}</div>
                    <div className="text-xs text-primary">+{Number(t.credits).toFixed(0)} cr</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent Orders" link="/admin/orders">
          {recentOrders.length === 0 ? <Empty msg="No orders yet" /> : (
            <ul className="divide-y divide-border/30">
              {recentOrders.map((o:any) => (
                <li key={o.id} className="flex items-center justify-between py-3 px-5">
                  <div>
                    <div className="text-sm font-medium">{o.services?.name ?? "—"}</div>
                    <div className="font-mono text-xs text-primary">{o.order_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">RM {Number(o.credits_charged).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{o.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone, to }: any) {
  const inner = (
    <div className="relative overflow-hidden rounded-2xl glass p-5 glow-on-hover h-full">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border ${tone === "warn" ? "bg-[oklch(0.85_0.16_80)]/10 border-[oklch(0.85_0.16_80)]/30 text-[oklch(0.85_0.16_80)]" : tone === "good" ? "bg-[oklch(0.78_0.16_155)]/10 border-[oklch(0.78_0.16_155)]/30 text-[oklch(0.78_0.16_155)]" : "bg-primary/10 border-primary/30 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-4 font-display text-2xl font-bold">{value}</div>
      <div className="relative text-xs text-muted-foreground">{label}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
function Panel({ title, link, children }: any) {
  return (
    <section className="rounded-2xl glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 p-5">
        <h3 className="font-display font-bold">{title}</h3>
        {link && <Link to={link} className="text-xs text-primary hover:underline">View all →</Link>}
      </div>
      {children}
    </section>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="px-5 py-12 text-center text-sm text-muted-foreground">{msg}</div>;
}
