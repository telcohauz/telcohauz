import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  component: Staff,
});

type StaffRow = {
  id: string;
  company_id: string;
  name: string;
  position: string | null;
  email: string | null;
  salary: number | null;
  hire_date: string | null;
  status: string;
};

function Staff() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();
  const key = ["staff", company?.id];
  const { data: rows = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!company,
    queryFn: async (): Promise<StaffRow[]> => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppShell title="Staff Management">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Employees</h2>
            <p className="text-sm text-muted-foreground">Directory, roles and salaries.</p>
          </div>
          <NewStaff companyId={company?.id} onSaved={() => qc.invalidateQueries({ queryKey: key })} />
        </div>

        {isLoading ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-3 opacity-50" />No staff yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.position ?? "—"}{s.email ? ` · ${s.email}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {s.salary != null && <span className="text-sm tabular-nums">RM {Number(s.salary).toLocaleString()}</span>}
                      <Badge variant={s.status === "active" ? "secondary" : "outline"}>{s.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

function NewStaff({ companyId, onSaved }: { companyId?: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState("active");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff").insert({
        company_id: companyId!,
        name,
        position: position || null,
        email: email || null,
        salary: salary ? Number(salary) : null,
        hire_date: hireDate || null,
        status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setName(""); setPosition(""); setEmail(""); setSalary(""); setHireDate(""); setStatus("active");
      onSaved();
      toast.success("Staff added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2" disabled={!companyId}><Plus className="h-4 w-4" /> Add staff</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add staff</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Position</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly salary (RM)</Label><Input type="number" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
            <div><Label>Hire date</Label><Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}