import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "BOZ Boss — Pengurusan Syarikat" }] }),
  component: DashboardPage,
});
function DashboardPage() {
  const { company, isLoading } = useActiveCompany();
  const stats = useQuery({
    queryKey: ["company-dashboard-counts", company?.id],
    enabled: !!company,
    queryFn: async () => {
      if (!company) throw new Error("Sila pilih syarikat.");
      const results = await Promise.all([
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("staff")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("compliance_items")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
      ]);
      for (const result of results) if (result.error) throw result.error;
      return results.map((result) => result.count ?? 0);
    },
  });
  if (isLoading)
    return (
      <AppShell title="BOZ Boss">
        <p>Memuatkan syarikat…</p>
      </AppShell>
    );
  if (!company)
    return (
      <AppShell title="BOZ Boss">
        <h1 className="text-2xl font-semibold">Mulakan ruang syarikat anda</h1>
        <p className="my-4">Daftar syarikat sebelum mengurus invois, staf dan dokumen.</p>
        <Link to="/onboarding">Daftar syarikat →</Link>
      </AppShell>
    );
  return (
    <AppShell title="BOZ Boss">
      <h1 className="text-3xl font-semibold">{company.name}</h1>
      <p className="mt-2 text-muted-foreground">
        Ringkasan rekod syarikat yang boleh diakses oleh akaun anda.
      </p>
      {stats.isError && (
        <p role="alert" className="my-5 text-destructive">
          Rekod belum dapat dimuatkan. {stats.error.message}
        </p>
      )}
      <div className="my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Invois", "Staf", "Dokumen", "Item compliance"].map((label, index) => (
          <section key={label} className="rounded-xl border p-6">
            <h2>{label}</h2>
            <p className="mt-3 text-3xl font-bold">
              {stats.isLoading || !stats.data ? "—" : stats.data[index]}
            </p>
          </section>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Bilangan rekod tidak mewakili jualan, baki bank atau keuntungan. Urus dan semak transaksi
        melalui modul berkaitan.
      </p>
      <div className="mt-6 flex gap-5">
        <Link to="/finance">Urus invois</Link>
        <Link to="/documents">Dokumen</Link>
        <Link to="/staff">Staf</Link>
      </div>
    </AppShell>
  );
}
