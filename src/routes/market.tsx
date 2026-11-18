import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogScreen } from "@/components/CatalogScreen";
export const Route = createFileRoute("/market")({
  head: () => ({ meta: [{ title: "Telcohauz Market — Katalog" }] }),
  component: Market,
});
function Market() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <Link to="/workspace" className="text-primary">← BOZ Workspace</Link>
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">TELCOHAUZ MARKET</p>
          <h1 className="mt-2 text-3xl font-bold">Marketplace Telcohauz</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Katalog web ini menggunakan pendaftaran produk yang telah disemak dalam workspace BOZ.
            Data stok fizikal POS belum diterbitkan kepada Market sehingga peraturan penyiaran dan pesanan disahkan.
          </p>
          <a
            href="https://telcohauz-device-market.telcohauzphonetrd.chatgpt.site"
            target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm text-primary"
          >Buka laman Market yang dipilih</a>
        </div>
      </div>
      <CatalogScreen />
    </div>
  );
}
