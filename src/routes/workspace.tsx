import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Ruang Kerja — Telcohauz BOZ" }] }),
  component: Workspace,
});
function trustedUrl(value: string | undefined) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
function Workspace() {
  const external = [
    {
      name: "BOZ Boss",
      description: "Urus syarikat, invois, staf dan dokumen.",
      url: trustedUrl(import.meta.env.VITE_BOZ_BUSINESS_URL),
    },
    {
      name: "Dokumen & Audit",
      description: "Semak sumber bukti dan rekod dalaman melalui akses yang diberikan.",
      url: trustedUrl(import.meta.env.VITE_BOZ_AUDIT_URL),
    },
    {
      name: "Peta Telcohauz",
      description: "Cari kedai dan servis peranti.",
      url: trustedUrl(import.meta.env.VITE_BOZ_MAP_URL),
    },
  ];
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12">
      <Link to="/" className="text-primary">
        ← Telcohauz
      </Link>
      <p className="mt-10 text-sm uppercase tracking-widest text-primary">TELCOHAUZ BOZ</p>
      <h1 className="mt-3 text-4xl font-bold">Ruang kerja anda.</h1>
      <p className="mt-4 text-muted-foreground">
        Pilih urusan yang ingin dilakukan. Akses dalaman memerlukan akaun dan peranan yang sah.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border p-7">
          <h2 className="text-xl font-semibold">Katalog Produk</h2>
          <p className="my-4 text-muted-foreground">
            Cari dan semak pilihan produk. Produk yang belum disahkan dilabel “Belum tersedia”.
          </p>
          <Link to="/catalog" className="text-primary">
            Buka katalog →
          </Link>
        </section>
        <section className="rounded-2xl border p-7">
          <h2 className="text-xl font-semibold">Master Produk BOZ</h2>
          <p className="my-4 text-muted-foreground">
            Owner dan admin boleh menyemak katalog dalaman BOZ sedia ada.
          </p>
          <Link to="/master-products" className="text-primary">
            Log masuk pentadbir →
          </Link>
        </section>
        {external.map((module) => (
          <section key={module.name} className="rounded-2xl border p-7">
            <h2 className="text-xl font-semibold">{module.name}</h2>
            <p className="my-4 text-muted-foreground">{module.description}</p>
            {module.url ? (
              <a href={module.url} rel="noopener noreferrer" className="text-primary">
                Buka {module.name} →
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Belum disambung</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
