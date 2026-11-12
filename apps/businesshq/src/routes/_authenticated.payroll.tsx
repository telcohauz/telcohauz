import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: Payroll,
});

type StaffRow = { id: string; name: string; position: string | null; salary: number | null; status: string };

// Malaysia statutory contributions (simplified rates).
function computeMY(gross: number) {
  const epf = +(gross * 0.11).toFixed(2);
  const epfEmployer = +(gross * (gross <= 5000 ? 0.13 : 0.12)).toFixed(2);
  const socso = +(Math.min(gross, 5000) * 0.005).toFixed(2);
  const eis = +(Math.min(gross, 5000) * 0.002).toFixed(2);
  const taxable = Math.max(0, gross - epf);
  let pcb = 0;
  if (taxable > 3000) pcb = (taxable - 3000) * 0.08;
  pcb = +pcb.toFixed(2);
  const net = +(gross - epf - socso - eis - pcb).toFixed(2);
  return { epf, epfEmployer, socso, eis, pcb, net };
}

function Payroll() {
  const { company } = useActiveCompany();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["payroll-staff", company?.id],
    enabled: !!company,
    queryFn: async (): Promise<StaffRow[]> => {
      const { data, error } = await supabase
        .from("staff")
        .select("id,name,position,salary,status")
        .eq("company_id", company!.id)
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  const totals = rows.reduce(
    (acc, s) => {
      const gross = Number(s.salary) || 0;
      const c = computeMY(gross);
      acc.gross += gross;
      acc.net += c.net;
      acc.epf += c.epf + c.epfEmployer;
      acc.statutory += c.socso + c.eis + c.pcb;
      return acc;
    },
    { gross: 0, net: 0, epf: 0, statutory: 0 },
  );

  return (
    <AppShell title="Payroll">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Payroll run · Malaysia</h2>
          <p className="text-sm text-muted-foreground">Auto-calculated from active staff salaries (EPF, SOCSO, EIS, PCB).</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Gross" value={totals.gross} />
          <Stat label="Net payout" value={totals.net} />
          <Stat label="EPF (ee + er)" value={totals.epf} />
          <Stat label="SOCSO + EIS + PCB" value={totals.statutory} />
        </div>

        {isLoading ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card><CardContent className="pt-10 pb-10 text-center text-sm text-muted-foreground"><Wallet className="h-8 w-8 mx-auto mb-3 opacity-50" />No active staff. Add staff to run payroll.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Employee</th>
                    <th className="text-right p-3 font-medium">Gross</th>
                    <th className="text-right p-3 font-medium">EPF</th>
                    <th className="text-right p-3 font-medium">SOCSO</th>
                    <th className="text-right p-3 font-medium">EIS</th>
                    <th className="text-right p-3 font-medium">PCB</th>
                    <th className="text-right p-3 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((s) => {
                    const gross = Number(s.salary) || 0;
                    const c = computeMY(gross);
                    return (
                      <tr key={s.id}>
                        <td className="p-3">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.position ?? "—"}</div>
                        </td>
                        <td className="p-3 text-right tabular-nums">{gross.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums">{c.epf.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums">{c.socso.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums">{c.eis.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums">{c.pcb.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums font-medium">{c.net.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">RM {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </CardContent></Card>
  );
}