import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { assertAdminAccess } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/insert-failures")({
  component: InsertFailuresPage,
});

type FailureRow = {
  id: string;
  user_id: string | null;
  session_user_available: boolean;
  attempted_payload: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  error_details: string | null;
  error_hint: string | null;
  user_agent: string | null;
  route: string | null;
  created_at: string;
};

function InsertFailuresPage() {
  const navigate = useNavigate();
  const gate = useQuery({
    queryKey: ["admin-access-check"],
    queryFn: () => assertAdminAccess(),
    retry: false,
  });

  useEffect(() => {
    if (gate.isError) navigate({ to: "/dashboard", replace: true });
  }, [gate.isError, navigate]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["company-insert-failures"],
    enabled: gate.data?.ok === true,
    queryFn: async (): Promise<FailureRow[]> => {
      const { data, error } = await supabase
        .from("company_insert_failures")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as FailureRow[];
    },
  });

  if (gate.isLoading || gate.isError || !gate.data) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  return (
    <AppShell title="Company insert failures">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Company insert failures</h2>
          <p className="text-sm text-muted-foreground">
            Diagnostic log of failed company creations — last 200 events.
          </p>
        </div>

        {isLoading ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No failures logged. 🎉</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.session_user_available ? "secondary" : "destructive"}>
                        {r.session_user_available ? "session: present" : "session: missing"}
                      </Badge>
                      {r.error_code && <Badge variant="outline">{r.error_code}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  {r.error_message && (
                    <div className="text-sm">
                      <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Error</div>
                      <div className="font-mono text-xs whitespace-pre-wrap break-words">{r.error_message}</div>
                      {r.error_details && <div className="font-mono text-xs text-muted-foreground mt-1">details: {r.error_details}</div>}
                      {r.error_hint && <div className="font-mono text-xs text-muted-foreground">hint: {r.error_hint}</div>}
                    </div>
                  )}

                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Attempted payload</div>
                    <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
{JSON.stringify(r.attempted_payload, null, 2)}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">user_id:</span> {r.user_id ?? "—"}</div>
                    <div><span className="font-medium text-foreground">route:</span> {r.route ?? "—"}</div>
                    <div className="sm:col-span-2 truncate"><span className="font-medium text-foreground">ua:</span> {r.user_agent ?? "—"}</div>
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