import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Smartphone, Apple, Network, Cpu, Wrench, Coins,
  ShoppingBag, MessageSquare, Wallet, Users, Code, LifeBuoy, Settings, LogOut,
  Bell, Search, Menu, X, TrendingUp, Activity, Zap, ArrowUpRight, Megaphone
} from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TELCOHAUZ Digital Hub" },
      { name: "description", content: "Manage your unlock orders, wallet, and digital services." },
    ],
  }),
  component: Dashboard,
});

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Smartphone, label: "Android Services" },
  { icon: Apple, label: "iPhone Services" },
  { icon: Network, label: "Network Unlock" },
  { icon: Cpu, label: "Software / Flashing" },
  { icon: Wrench, label: "Repair Services" },
  { icon: Coins, label: "Buy Credits" },
  { icon: ShoppingBag, label: "My Orders" },
  { icon: MessageSquare, label: "Tickets" },
  { icon: Wallet, label: "Wallet" },
  { icon: Users, label: "Affiliates" },
  { icon: Code, label: "API Docs" },
  { icon: LifeBuoy, label: "Support" },
  { icon: Settings, label: "Settings" },
];

const services = [
  { icon: Smartphone, brand: "Samsung", title: "FRP Unlock — All Models", time: "5-30 min", price: "RM 25" },
  { icon: Apple, brand: "Apple", title: "iCloud Bypass — Premium", time: "1-24 hrs", price: "RM 180" },
  { icon: Network, brand: "Carrier", title: "Network Unlock — Worldwide", time: "1-3 days", price: "RM 65" },
  { icon: Cpu, brand: "Xiaomi", title: "Mi Account Remove", time: "10-60 min", price: "RM 80" },
  { icon: Wrench, brand: "Huawei", title: "Bootloader / FRP / ID", time: "1-6 hrs", price: "RM 45" },
  { icon: Smartphone, brand: "Oppo", title: "Pattern & FRP Remove", time: "Instant", price: "RM 20" },
];

const recentOrders = [
  { id: "TH-48201", svc: "Samsung FRP Unlock", device: "SM-A546B", status: "Processing", color: "bg-warning/15 text-[oklch(0.85_0.16_80)]" },
  { id: "TH-48198", svc: "iCloud Bypass", device: "iPhone 12", status: "Completed", color: "bg-success/15 text-[oklch(0.78_0.16_155)]" },
  { id: "TH-48197", svc: "Mi Account", device: "Redmi Note 11", status: "Completed", color: "bg-success/15 text-[oklch(0.78_0.16_155)]" },
  { id: "TH-48190", svc: "Network Unlock", device: "iPhone 14 Pro", status: "Pending", color: "bg-primary/15 text-primary" },
  { id: "TH-48184", svc: "Huawei FRP", device: "P30 Lite", status: "Failed", color: "bg-destructive/15 text-destructive" },
];

function Dashboard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)]">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="font-display font-bold">TELCOHAUZ</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-muted">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border/40 bg-sidebar transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="hidden h-16 items-center gap-2 border-b border-border/40 px-6 lg:flex">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] shadow-[var(--glow-neon)]">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold">TELCOHAUZ</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Digital Hub</div>
            </div>
          </div>

          <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3 scrollbar-hidden">
            {navItems.map((n) => (
              <button
                key={n.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  n.active
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_oklch(0.72_0.22_235/0.15)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </button>
            ))}
            <div className="mt-auto pt-4">
              <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                <LogOut className="h-4 w-4" /> Logout
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:pl-0">
          {/* Top bar */}
          <div className="hidden h-16 items-center justify-between border-b border-border/40 bg-background/60 px-6 backdrop-blur lg:flex">
            <div className="relative w-96 max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search services, orders, models..."
                className="w-full rounded-lg border border-border bg-input/40 py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-sm">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-semibold">RM 248.50</span>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-sm">
                <Wallet className="h-4 w-4 text-[oklch(0.78_0.16_155)]" />
                <span className="font-semibold">RM 1,420</span>
              </div>
              <button className="relative rounded-lg glass p-2">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] text-sm font-bold text-background">
                A
              </div>
            </div>
          </div>

          <div className="space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={ShoppingBag} label="Total Orders" value="1,284" change="+12.4%" />
              <StatCard icon={Activity} label="Pending" value="14" change="-3" tone="warning" />
              <StatCard icon={TrendingUp} label="Completed Today" value="92" change="+8.1%" />
              <StatCard icon={Wallet} label="Spent This Month" value="RM 2,450" change="+18.2%" />
            </div>

            {/* Announcement */}
            <div className="relative overflow-hidden rounded-2xl glass-strong p-5">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 border border-primary/30">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-primary">Promotion</div>
                  <div className="mt-1 font-semibold">Get 10% bonus credits on all top-ups above RM 200 — this week only.</div>
                </div>
                <button className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary hover:text-background transition">
                  Top Up <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Services */}
            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-primary">Marketplace</div>
                  <h2 className="mt-1 font-display text-2xl font-bold">Popular Services</h2>
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground">View all →</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {services.map((s) => <ServiceCard key={s.title} {...s} />)}
              </div>
            </section>

            {/* Recent orders */}
            <section className="rounded-2xl glass overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 p-5">
                <h3 className="font-display font-bold">Recent Orders</h3>
                <button className="text-xs text-muted-foreground hover:text-foreground">View all →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Order ID</th>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Device</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="border-t border-border/30 transition hover:bg-muted/30">
                        <td className="px-5 py-3 font-mono text-xs text-primary">{o.id}</td>
                        <td className="px-5 py-3">{o.svc}</td>
                        <td className="px-5 py-3 text-muted-foreground">{o.device}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${o.color}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, tone = "good" }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5 glow-on-hover">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/30">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className={`text-xs font-semibold ${tone === "warning" ? "text-[oklch(0.85_0.16_80)]" : "text-[oklch(0.78_0.16_155)]"}`}>{change}</span>
      </div>
      <div className="relative mt-4 font-display text-2xl font-bold">{value}</div>
      <div className="relative text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
