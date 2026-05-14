import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type UnlockApi = {
  base_url: string;
  auth_header_name: string;
  auth_header_format: string;
  list_products_path: string;
  list_products_method: string;
  place_order_path: string;
  place_order_method: string;
  order_status_path: string;
};

const DEFAULTS: UnlockApi = {
  base_url: "",
  auth_header_name: "Authorization",
  auth_header_format: "Bearer {key}",
  list_products_path: "",
  list_products_method: "GET",
  place_order_path: "",
  place_order_method: "POST",
  order_status_path: "",
};

function AdminSettings() {
  const [cfg, setCfg] = useState<UnlockApi>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "unlock_api")
        .maybeSingle();
      if (data?.value) setCfg({ ...DEFAULTS, ...(data.value as Partial<UnlockApi>) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "unlock_api", value: cfg, updated_by: user?.id, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  const set = (k: keyof UnlockApi) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCfg({ ...cfg, [k]: e.target.value });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform configuration.</p>
      </div>

      <div className="rounded-2xl glass p-6 space-y-5">
        <div className="flex items-center gap-2 text-primary">
          <SettingsIcon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Unlock API</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Store the API endpoints for your unlock provider. The API key itself is stored as a secure server secret separately.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="grid gap-4">
            <Field label="Base URL" placeholder="https://api.provider.com/v1" value={cfg.base_url} onChange={set("base_url")} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Auth Header Name" placeholder="Authorization" value={cfg.auth_header_name} onChange={set("auth_header_name")} />
              <Field label="Auth Header Format" placeholder="Bearer {key}" value={cfg.auth_header_format} onChange={set("auth_header_format")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
              <Field label="List Products Path" placeholder="/products" value={cfg.list_products_path} onChange={set("list_products_path")} />
              <SelectField label="Method" value={cfg.list_products_method} onChange={set("list_products_method")} options={["GET", "POST"]} />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
              <Field label="Place Order Path" placeholder="/orders" value={cfg.place_order_path} onChange={set("place_order_path")} />
              <SelectField label="Method" value={cfg.place_order_method} onChange={set("place_order_method")} options={["POST", "PUT"]} />
            </div>

            <Field label="Order Status Path (optional)" placeholder="/orders/{id}" value={cfg.order_status_path} onChange={set("order_status_path")} />

            <div className="flex justify-end pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-2.5 text-sm font-semibold text-background shadow-[var(--glow-soft)] hover:shadow-[var(--glow-neon)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
