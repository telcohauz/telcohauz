import { createFileRoute, Link } from "@tanstack/react-router";
import { CatalogScreen } from "@/components/CatalogScreen";
import { MARKET_DEPOSIT_PERCENT, MARKET_DEPOSIT_TERMS_MS } from "../../packages/platform/market-deposit";
import { TELCOHAUZ_MARKET_REFERENCE } from "../../packages/platform/config";
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
            href={TELCOHAUZ_MARKET_REFERENCE}
            target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm text-primary"
          >Buka laman Market yang dipilih</a>
        </div>
        <section className="mt-5 rounded-2xl border border-amber-500/30 p-5" aria-label="Syarat bayaran tempahan">
          <h2 className="text-xl font-bold">Syarat Tempahan — Deposit {MARKET_DEPOSIT_PERCENT}%</h2>
          <p className="mt-2 text-sm text-muted-foreground">{MARKET_DEPOSIT_TERMS_MS}</p>
          <p className="mt-3 text-sm font-semibold">Deposit 40% + baki 60%. Tiada tempahan disahkan sebelum pembayaran deposit disahkan.</p>
          <p className="mt-2 text-xs text-muted-foreground">Checkout Market dan pengesahan pembayaran automatik masih belum diaktifkan. Penghantaran bukti bayaran bukan bukti pembayaran berjaya.</p>
        </section>
      </div>
      <CatalogScreen />
    </div>
  );
}
