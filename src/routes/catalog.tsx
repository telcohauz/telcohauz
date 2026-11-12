import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import data from "../../packages/catalog/data/products.json";
import { publicProduct, validateCatalog } from "../../packages/catalog/catalog";

const products = validateCatalog(data);
export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [{ title: "Katalog Produk — Telcohauz" }] }),
  component: Catalog,
});

function Catalog() {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("");
  const [channel, setChannel] = useState("web");
  const providers = [...new Set(products.map((p) => p.provider))].sort();
  const visible = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (!provider || p.provider === provider) &&
            `${p.name} ${p.provider} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map((p) => publicProduct(p, channel)),
    [query, provider, channel],
  );
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10">
      <Link to="/workspace" className="text-primary">
        ← Telcohauz
      </Link>
      <p className="mt-10 text-sm uppercase tracking-widest text-primary">
        TELCOHAUZ / MASTER KATALOG
      </p>
      <h1 className="mt-3 text-4xl font-bold">Pilihan produk, di satu tempat.</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Produk yang sedang disemak dipaparkan sebagai “Belum tersedia”. Harga, komisen dan
        permohonan dibuka selepas pengesahan.
      </p>
      <div className="my-8 flex flex-wrap gap-3">
        <input
          aria-label="Cari produk"
          placeholder="Cari nama, jenama atau kategori"
          className="min-w-64 flex-1 rounded-lg border bg-background p-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Pembekal"
          className="rounded-lg border bg-background p-3"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="">Semua pembekal</option>
          {providers.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Saluran"
          className="rounded-lg border bg-background p-3"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="web">Laman web</option>
          <option value="hero">HERO</option>
        </select>
      </div>
      <p role="status" className="mb-5 text-sm text-muted-foreground">
        {visible.length} produk dijumpai · {visible.filter((p) => p.canApply).length} tersedia
      </p>
      {visible.length === 0 && (
        <p className="rounded-xl border p-8">Tiada produk sepadan. Cuba carian lain.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-primary">
              {p.provider} · {p.category}
            </p>
            <h2 className="mt-3 text-xl font-semibold">{p.name}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-5 inline-block rounded-full bg-muted px-3 py-1 text-sm">{p.label}</p>
            {p.priceMonthlySen !== null && (
              <p className="mt-3 font-semibold">
                RM {(p.priceMonthlySen / 100).toFixed(2)} / bulan
              </p>
            )}
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer">Maklumat lanjut</summary>
              <p className="mt-3">
                Liputan, harga dan syarat perlu disahkan sebelum permohonan. Kelulusan akhir
                tertakluk kepada penyedia.
              </p>
            </details>
          </article>
        ))}
      </div>
    </main>
  );
}
