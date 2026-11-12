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
import { Receipt, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance")({
  component: Finance,
});

type Invoice = {
  id: string;
  company_id: string;
  invoice_number: string | null;
  client_name: string | null;
  amount: number;
  currency: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  notes: string | null;
};

const STATUS_TONE: Record<string, "secondary" | "outline" | "destructive" | "default"> = {
  paid: "secondary",
  draft: "outline",
  sent: "default",
  overdue: "destructive",
};

function Finance() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();
  const key = ["invoices", company?.id];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!company,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("company_id", company!.id)
        .order("issue_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = rows.reduce(
    (acc, r) => {
      const amt = Number(r.amount) || 0;
      acc.total += amt;
      if (r.status === "paid") acc.paid += amt;
      else if (r.status === "overdue") acc.overdue += amt;
      else acc.outstanding += amt;
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0, overdue: 0 },
  );

  return (
    <AppShell title="Finance">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>
            <p className="text-sm text-muted-foreground">Track income, outstanding and overdue.</p>
          </div>
          <NewInvoice companyId={company?.id} onSaved={() => qc.invalidateQueries({ queryKey: key })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total billed" value={totals.total} />
          <Stat label="Paid" value={totals.paid} />
          <Stat label="Outstanding" value={totals.outstanding} />
          <Stat label="Overdue" value={totals.overdue} tone="destructive" />
        </div>

        {isLoading ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground"><Receipt className="h-8 w-8 mx-auto mb-3 opacity-50" />No invoices yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.invoice_number ?? "—"} · {r.client_name ?? "Unknown client"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.issue_date ?? "—"}{r.due_date ? ` → due ${r.due_date}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm tabular-nums">{r.currency} {Number(r.amount).toLocaleString()}</span>
                      <Badge variant={STATUS_TONE[r.status] ?? "secondary"}>{r.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} aria-label="Delete">
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

function Stat({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 tabular-nums ${tone === "destructive" ? "text-destructive" : ""}`}>
        RM {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </CardContent></Card>
  );
}

function NewInvoice({ companyId, onSaved }: { companyId?: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [num, setNum] = useState("");
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [status, setStatus] = useState("draft");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        company_id: companyId!,
        invoice_number: num || null,
        client_name: client || null,
        amount: Number(amount) || 0,
        currency,
        status,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setNum(""); setClient(""); setAmount(""); setStatus("draft"); setIssueDate(""); setDueDate(""); setNotes("");
      onSaved();
      toast.success("Invoice created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2" disabled={!companyId}><Plus className="h-4 w-4" /> New invoice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Invoice #</Label><Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="INV-001" /></div>
            <div><Label>Client</Label><Input value={client} onChange={(e) => setClient(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Amount</Label><Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MYR">MYR</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Issue date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
            <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!amount || save.isPending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}