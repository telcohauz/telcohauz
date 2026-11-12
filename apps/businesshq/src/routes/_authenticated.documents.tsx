import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderLock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — BusinessHQ" }] }),
  component: Documents,
});

const CATS = ["tax", "hr", "contracts", "licenses", "finance", "other"] as const;

function Documents() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", company?.id] }),
  });

  const filtered = filter === "all" ? docs : docs.filter((d) => d.category === filter);

  return (
    <AppShell title="Document Vault">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
            <p className="text-sm text-muted-foreground">Centralize tax forms, HR docs, contracts, licenses and more.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <NewDocDialog companyId={company?.id} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">
              <FolderLock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              No documents yet. Add your first one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <Card key={d.id} className="hover:border-primary/40 transition">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleDateString()}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{d.category}</Badge>
                    {d.tags && d.tags.length > 0 && d.tags.slice(0, 2).map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function NewDocDialog({ companyId }: { companyId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATS)[number]>("other");
  const [tags, setTags] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documents").insert({
        company_id: companyId!,
        name,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", companyId] });
      toast.success("Document added");
      setOpen(false);
      setName(""); setTags("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!companyId}><Plus className="h-4 w-4" /> Add document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SST-02 June 2026" /></div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Tags (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="quarterly, audit" /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
