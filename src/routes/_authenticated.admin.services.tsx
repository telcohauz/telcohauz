import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: AdminServices,
});

interface Service {
  id?: string; name: string; category: string; brand: string | null;
  description: string | null; credit_price: number; delivery_eta: string | null; is_active: boolean;
}
const empty: Service = { name: "", category: "Android", brand: "", description: "", credit_price: 10, delivery_eta: "", is_active: true };
const CATEGORIES = ["Android","iPhone","Network","Software","Repair"];

function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("category");
    setItems((data ?? []) as Service[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload: any = { ...editing, brand: editing.brand || null, description: editing.description || null, delivery_eta: editing.delivery_eta || null };
    const { error } = editing.id
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete service? Existing orders are kept.")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };
  const toggle = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id!);
    load();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Services Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add or edit unlock services and pricing.</p>
        </div>
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-4 py-2 text-sm font-semibold text-background shadow-[var(--glow-neon)]">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      <div className="rounded-2xl glass overflow-hidden">
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Service</th><th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Brand</th><th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3">ETA</th><th className="px-5 py-3">Active</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3 text-xs uppercase tracking-wider">{s.category}</td>
                    <td className="px-5 py-3">{s.brand}</td>
                    <td className="px-5 py-3 text-right font-mono text-primary">{Number(s.credit_price).toFixed(0)} cr</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{s.delivery_eta}</td>
                    <td className="px-5 py-3">
                      <button onClick={()=>toggle(s)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.is_active ? "bg-[oklch(0.78_0.16_155)]/15 text-[oklch(0.78_0.16_155)]" : "bg-muted text-muted-foreground"}`}>
                        {s.is_active ? "Active" : "Off"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button onClick={()=>setEditing({...s})} className="rounded-lg glass p-1.5 hover:bg-muted/30"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={()=>remove(s.id!)} className="rounded-lg bg-destructive/15 text-destructive border border-destructive/30 p-1.5 hover:bg-destructive hover:text-background transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4" onClick={()=>setEditing(null)}>
          <div onClick={(e)=>e.stopPropagation()} className="w-full max-w-lg rounded-2xl glass-strong p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{editing.id ? "Edit Service" : "New Service"}</h3>
              <button onClick={()=>setEditing(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Name"><input value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={editing.category} onChange={(e)=>setEditing({...editing, category: e.target.value})} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Brand"><input value={editing.brand ?? ""} onChange={(e)=>setEditing({...editing, brand: e.target.value})} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Credit Price"><input type="number" min={0} step="0.01" value={editing.credit_price} onChange={(e)=>setEditing({...editing, credit_price: Number(e.target.value)})} className={inputCls} /></Field>
              <Field label="Delivery ETA"><input value={editing.delivery_eta ?? ""} placeholder="5-30 min" onChange={(e)=>setEditing({...editing, delivery_eta: e.target.value})} className={inputCls} /></Field>
            </div>
            <Field label="Description"><textarea rows={3} value={editing.description ?? ""} onChange={(e)=>setEditing({...editing, description: e.target.value})} className={inputCls} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active} onChange={(e)=>setEditing({...editing, is_active: e.target.checked})} /> Active
            </label>
            <button onClick={save} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-2.5 w-full font-semibold text-background shadow-[var(--glow-neon)]">
              <Save className="h-4 w-4" /> Save Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const inputCls = "w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm focus:border-primary focus:outline-none";
function Field({ label, children }: any) {
  return <div><label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</label>{children}</div>;
}
