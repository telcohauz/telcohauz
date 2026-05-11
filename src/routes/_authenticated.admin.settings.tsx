import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Building2, Smartphone, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform configuration.</p>
      </div>
      <div className="rounded-2xl glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary"><SettingsIcon className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.2em]">Coming Soon</span></div>
        <p className="text-sm text-muted-foreground">Bank account details, payment gateways, email templates, branding, API keys and notification rules will be configurable here in a future iteration.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card icon={Building2} title="Bank Details" desc="Manual transfer accounts" />
          <Card icon={Smartphone} title="DuitNow" desc="Phone / QR config" />
          <Card icon={CreditCard} title="FPX Gateway" desc="Payment provider keys" />
        </div>
      </div>
    </div>
  );
}
function Card({ icon: Icon, title, desc }: any) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
