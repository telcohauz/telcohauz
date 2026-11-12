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
import { BadgeCheck, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/licenses")({
  component: Licenses,
});

function Licenses() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["licenses", company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase.from("licenses").select("*").eq("company_id", company!.id).order("expires_on", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell title="Licenses & Permits">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Licenses</h2>
            <p className="text-sm text-muted-foreground">Track expiry dates and renewals.</p>
          </div>
          <NewLicense companyId={company?.id} onSaved={() => qc.invalidateQueries({ queryKey: ["licenses", company?.id] })} />
        </div>
        {rows.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground"><BadgeCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />No licenses yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((l) => {
              const days = l.expires_on ? Math.ceil((new Date(l.expires_on).getTime() - Date.now()) / 86400000) : null;
              const tone = days == null ? "secondary" : days < 0 ? "destructive" : days < 30 ? "outline" : "secondary";
              return (
                <Card key={l.id}><CardContent className="pt-5">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{l.issuer ?? "—"}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={tone as any}>{days == null ? "No expiry" : days < 0 ? `Expired ${-days}d ago` : `Expires in ${days}d`}</Badge>
                    {l.reference_no && <span className="text-xs text-muted-foreground">{l.reference_no}</span>}
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function NewLicense({ companyId, onSaved }: { companyId?: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [auth, setAuth] = useState("");
  const [expiry, setExpiry] = useState("");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("licenses").insert({ company_id: companyId!, name, reference_no: num || null, issuer: auth || null, expires_on: expiry || null });
      if (error) throw error;
    },
    onSuccess: () => { setOpen(false); setName(""); setNum(""); setAuth(""); setExpiry(""); onSaved(); toast.success("License added"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2" disabled={!companyId}><Plus className="h-4 w-4" /> Add license</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add license</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>License number</Label><Input value={num} onChange={(e) => setNum(e.target.value)} /></div>
          <div><Label>Issuing authority</Label><Input value={auth} onChange={(e) => setAuth(e.target.value)} placeholder="e.g. MOF, DBKL" /></div>
          <div><Label>Expiry date</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={!name.trim()}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
