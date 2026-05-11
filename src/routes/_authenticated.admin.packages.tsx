import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/packages")({
  component: AdminPackages,
});

interface Pkg {
  id?: string; name: string; credits: number; price: number;
  bonus: number; is_popular: boolean; is_active: boolean; sort_order: number;
}
const empty: Pkg = { name: "", credits: 100, price: 100, bonus: 0, is_popular: false, is_active: true, sort_order: 99 };

function AdminPackages() {
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pkg | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("credit_packages").select("*").order("sort_order");
    setItems((data ?? []) as Pkg[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = editing.id
      ? await supabase.from("credit_packages").update(editing).eq("id", editing.id)
      : await supabase.from("credit_packages").insert(editing);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete package?")) return;
    const { error } = await supabase.from("credit_packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Credit Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define purchasable credit bundles.</p>
        </div>
        <button onClick={()=>setEditing({...empty})} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-4 py-2 text-sm font-semibold text-background shadow-[var(--glow-neon)]">
          <Plus className="h-4 w-4" /> Add Package
        </button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-16" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(p => (
            <div key={p.id} className="relative rounded-2xl glass p-5">
              {p.is_popular && <span className="absolute -top-2 right-4 rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">Popular</span>}
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
              <div className="mt-2 font-display text-2xl font-bold">RM {Number(p.price).toFixed(0)}</div>
              <div className="mt-1 text-sm">
                <span className="text-primary font-semibold">{Number(p.credits).toFixed(0)}</span>
                <span className="text-muted-foreground"> cr</span>
                {Number(p.bonus) > 0 && <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-primary"><Sparkles className="h-3 w-3" />+{p.bonus}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={p.is_active ? "text-[oklch(0.78_0.16_155)]" : "text-muted-foreground"}>{p.is_active ? "Active" : "Off"}</span>
                <div className="flex gap-1">
                  <button onClick={()=>setEditing({...p})} className="rounded-lg glass p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={()=>remove(p.id!)} className="rounded-lg bg-destructive/15 text-destructive border border-destructive/30 p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4" onClick={()=>setEditing(null)}>
          <div onClick={(e)=>e.stopPropagation()} className="w-full max-w-md rounded-2xl glass-strong p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{editing.id ? "Edit" : "New"} Package</h3>
              <button onClick={()=>setEditing(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Name"><input value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} className={inputCls} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Price (RM)"><input type="number" min={0} value={editing.price} onChange={(e)=>setEditing({...editing, price: Number(e.target.value)})} className={inputCls} /></Field>
              <Field label="Credits"><input type="number" min={0} value={editing.credits} onChange={(e)=>setEditing({...editing, credits: Number(e.target.value)})} className={inputCls} /></Field>
              <Field label="Bonus"><input type="number" min={0} value={editing.bonus} onChange={(e)=>setEditing({...editing, bonus: Number(e.target.value)})} className={inputCls} /></Field>
            </div>
            <Field label="Sort Order"><input type="number" value={editing.sort_order} onChange={(e)=>setEditing({...editing, sort_order: Number(e.target.value)})} className={inputCls} /></Field>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_popular} onChange={(e)=>setEditing({...editing, is_popular: e.target.checked})} /> Popular</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={(e)=>setEditing({...editing, is_active: e.target.checked})} /> Active</label>
            </div>
            <button onClick={save} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-2.5 w-full font-semibold text-background shadow-[var(--glow-neon)]">
              <Save className="h-4 w-4" /> Save
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
