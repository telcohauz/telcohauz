import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({ meta: [{ title: "Compliance — BusinessHQ" }] }),
  component: Compliance,
});

const MY_TEMPLATES = [
  { title: "SSM Annual Return", category: "SSM", description: "File annual return with Companies Commission of Malaysia." },
  { title: "LHDN Form C (Corporate Tax)", category: "LHDN", description: "Corporate income tax filing." },
  { title: "EPF Contribution", category: "EPF", description: "Monthly employee provident fund contribution." },
  { title: "SOCSO & EIS Contribution", category: "SOCSO", description: "Monthly social security & employment insurance." },
  { title: "SST-02 Quarterly Filing", category: "SST", description: "Sales & service tax quarterly submission." },
];

function Compliance() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["compliance", company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_items").select("*").eq("company_id", company!.id).order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "in_progress" | "completed" | "overdue" }) => {
      const { error } = await supabase.from("compliance_items").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance", company?.id] }),
  });

  const seed = useMutation({
    mutationFn: async () => {
      if (!company) return;
      const rows = MY_TEMPLATES.map((t) => ({
        company_id: company.id,
        title: t.title,
        category: t.category,
        description: t.description,
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * (7 + Math.floor(Math.random() * 60))).toISOString().slice(0, 10),
      }));
      const { error } = await supabase.from("compliance_items").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loaded Malaysia compliance items");
      qc.invalidateQueries({ queryKey: ["compliance", company?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = {
    overdue: items.filter((i) => i.due_date && new Date(i.due_date) < new Date() && i.status !== "completed"),
    upcoming: items.filter((i) => i.status === "pending" || i.status === "in_progress"),
    done: items.filter((i) => i.status === "completed"),
  };

  return (
    <AppShell title="Compliance Center">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Compliance</h2>
            <p className="text-sm text-muted-foreground">Country-specific rules with auto-reminders.</p>
          </div>
          <div className="flex items-center gap-2">
            {items.length === 0 && <Button variant="outline" onClick={() => seed.mutate()} disabled={!company}>Load Malaysia template</Button>}
            <NewComplianceDialog companyId={company?.id} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Overdue" value={grouped.overdue.length} tone="warn" icon={AlertTriangle} />
          <Stat label="Upcoming" value={grouped.upcoming.length} tone="primary" icon={ShieldCheck} />
          <Stat label="Completed" value={grouped.done.length} tone="ok" icon={CheckCircle2} />
        </div>

        {items.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">No compliance items yet. Load a template or add one.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="pt-5">
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {it.category && <span className="mr-2">{it.category}</span>}
                        {it.due_date && <span>Due {new Date(it.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={it.status} />
                      <Select value={it.status} onValueChange={(v) => setStatus.mutate({ id: it.id, status: v as any })}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pending", "in_progress", "completed", "overdue"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { completed: "bg-success/15 text-success", overdue: "bg-destructive/15 text-destructive", in_progress: "bg-primary/15 text-primary", pending: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded ${map[status] ?? map.pending}`}>{status.replace("_", " ")}</span>;
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "warn" | "ok" | "primary" }) {
  const color = tone === "warn" ? "text-destructive" : tone === "ok" ? "text-success" : "text-primary";
  return (
    <Card>
      <CardContent className="pt-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
          <div className="text-2xl font-semibold mt-1">{value}</div>
        </div>
        <Icon className={`h-6 w-6 ${color}`} />
      </CardContent>
    </Card>
  );
}

function NewComplianceDialog({ companyId }: { companyId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("compliance_items").insert({ company_id: companyId!, title, category: category || null, due_date: due || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance", companyId] }); setOpen(false); setTitle(""); setCategory(""); setDue(""); toast.success("Added"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2" disabled={!companyId}><Plus className="h-4 w-4" /> Add item</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add compliance item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. LHDN" /></div>
          <div><Label>Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => create.mutate()} disabled={!title.trim()}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
