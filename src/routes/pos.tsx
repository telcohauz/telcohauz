import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { BozSupabaseApi } from "../../boz-pos-expo/src/supabaseMobile";
import type { MobileSession } from "../../boz-pos-expo/src/mobileApi";
import type { Item, Job } from "../../boz-pos-expo/src/demo";

export const Route = createFileRoute("/pos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Telcohauz POS — Kedai" }] }),
  component: PosScreen,
});

const BOZ_URL = "https://ocqcmdigylxasxsuxaxt.supabase.co";
const BOZ_KEY = "sb_publishable_u_aD74cd37LsurSVrwngXQ_hWnjnIug";
const money = (sen: number) => "RM " + (sen / 100).toFixed(2);
const roleCanCheckout = (role: string) => ["OWNER", "ADMIN", "CASHIER"].includes(role);

function PosScreen() {
  const api = useMemo(() => new BozSupabaseApi(BOZ_URL, BOZ_KEY), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<MobileSession | null>(null);
  const [shopId, setShopId] = useState("");
  const [inventory, setInventory] = useState<Item[]>([]);
  const [repairs, setRepairs] = useState<Job[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("Log masuk menggunakan akaun staf BOZ POS yang dibenarkan.");
  const [busy, setBusy] = useState(false);
  const checkoutLock = useRef(false);
  const [pending, setPending] = useState<{ key: string; shopId: string; userId: string; items: { productId: string; quantity: number }[] } | null>(null);
  const [receipt, setReceipt] = useState<{ saleId: string; totalCents: number } | null>(null);
  const [cashReceived, setCashReceived] = useState(false);

  async function refresh(s: MobileSession, id: string) {
    setInventory([]);
    setRepairs([]);
    const [items, jobs] = await Promise.all([api.inventory(s, id), api.repairs(s, id)]);
    setInventory(items);
    setRepairs(jobs);
    setMessage("Data stok dan repair kedai berjaya dibaca daripada BOZ.");
  }

  async function login() {
    if (busy) return;
    setBusy(true); setMessage("Mengesahkan akses staf...");
    try {
      const s = await api.signIn(email, password);
      setPassword("");
      setSession(s); setShopId(s.shops[0].id); setCart({}); setReceipt(null);
      await refresh(s, s.shops[0].id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tidak dapat mengesahkan akses.");
    } finally { setBusy(false); }
  }

  function chooseShop(id: string) {
    if (!session || !session.shops.some(s => s.id === id) || pending) return;
    setShopId(id); setCart({}); setReceipt(null); setCashReceived(false);
    setBusy(true);
    refresh(session, id).catch(e => setMessage(e instanceof Error ? e.message : "Ralat stok"))
      .finally(() => setBusy(false));
  }

  function updateQty(item: Item, diff: number) {
    if (pending) return;
    setReceipt(null); setCashReceived(false);
    setCart(old => {
      const next = Math.max(0, Math.min(item.qty, (old[item.id] || 0) + diff));
      return { ...old, [item.id]: next };
    });
  }

  const selected = inventory.filter(p => (cart[p.id] || 0) > 0);
  const total = selected.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const role = session?.shops.find(s => s.id === shopId)?.role || "";
  const canCheckout = roleCanCheckout(role);

  async function checkout() {
    if (!session || !shopId || !canCheckout || busy || checkoutLock.current || !cashReceived) return;
    checkoutLock.current = true; setBusy(true);
    try {
      const sale = pending || {
        key: crypto.randomUUID(), shopId, userId: session.userId,
        items: selected.map(p => ({ productId: p.id, quantity: cart[p.id] })),
      };
      if (!sale.items.length || sale.shopId !== shopId || sale.userId !== session.userId) throw Error("Transaksi tidak sah.");
      // Keep the exact key on failed/uncertain responses to prevent duplicate stock deductions.
      setPending(sale);
      const result = await api.submitCashSale(session, shopId, sale.key, sale.items);
      setPending(null); setCashReceived(false); setCart({});
      setReceipt({ saleId: result.saleId, totalCents: result.totalCents });
      await refresh(session, shopId);
      setMessage(result.replayed ? "Transaksi sedia ada disahkan semula." : "Jualan tunai disahkan oleh BOZ.");
    } catch (error) {
      setMessage("Status jualan belum pasti: " + (error instanceof Error ? error.message : "Ralat") + ". SEMAK rekod BOZ atau cuba semula dengan kunci transaksi yang sama. Jangan ambil bayaran dua kali.");
    } finally { checkoutLock.current = false; setBusy(false); }
  }

  function logout() {
    if (pending) { setMessage("Selesaikan dan sahkan status transaksi tertangguh sebelum log keluar."); return; }
    setSession(null); setShopId(""); setInventory([]); setRepairs([]); setCart({});
    setReceipt(null); setCashReceived(false); setPassword(""); setMessage("Log keluar.");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <Link to="/workspace" className="text-primary">← BOZ Workspace</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-widest text-primary">TELCOHAUZ / BOZ POS</p>
      <h1 className="mt-2 text-3xl font-bold">Point of Sale Kedai</h1>
      <p className="mt-3 text-sm text-muted-foreground">Data transaksi dan stok terus dari backend BOZ, bukan rekod demo. Jualan hanya untuk tunai yang benar-benar diterima.</p>
      <p role="status" className="my-6 rounded-lg border p-3 text-sm">{message}</p>
      {!session ? (
        <form className="max-w-md space-y-3 rounded-xl border p-5" onSubmit={e => { e.preventDefault(); void login(); }}>
          <label className="block text-sm">E-mel staf<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
          <label className="block text-sm">Kata laluan<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground">Log masuk POS</button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Kedai" value={shopId} disabled={busy || Boolean(pending)} onChange={e => chooseShop(e.target.value)} className="rounded-lg border bg-background p-3">
              {session.shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
            <button disabled={busy} onClick={() => void refresh(session, shopId).catch(e => setMessage(String(e)))} className="rounded-lg border p-3">Segar semula stok</button>
            <button onClick={logout} className="rounded-lg border p-3">Log keluar</button>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-xl border p-5">
              <h2 className="text-xl font-semibold">Inventori kedai ({inventory.length})</h2>
              {inventory.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Tiada produk aktif bagi kedai ini atau data belum dimuatkan.</p>}
              <div className="mt-4 space-y-3">
                {inventory.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div><b>{item.name}</b><p className="text-xs text-muted-foreground">{item.sku} · Stok {item.qty} · {money(item.price)}</p></div>
                  <div className="flex items-center gap-3">
                    <button disabled={busy || Boolean(pending)} aria-label={"Kurangkan " + item.name} onClick={() => updateQty(item, -1)} className="rounded border px-3 py-1">−</button>
                    <span>{cart[item.id] || 0}</span>
                    <button disabled={busy || Boolean(pending) || (cart[item.id] || 0) >= item.qty} aria-label={"Tambah " + item.name} onClick={() => updateQty(item, 1)} className="rounded border px-3 py-1">+</button>
                  </div>
                </article>)}
              </div>
              <h2 className="mt-8 text-xl font-semibold">Repair ({repairs.length})</h2>
              {repairs.map(job => <p key={job.id} className="mt-2 rounded-lg border p-3 text-sm">{job.device} — {job.issue} · {job.status}</p>)}
            </section>
            <aside className="self-start rounded-xl border p-5">
              <h2 className="text-xl font-semibold">Checkout Tunai</h2>
              {selected.map(p => <p key={p.id} className="mt-3 text-sm">{p.name} × {cart[p.id]} = {money(p.price * cart[p.id])}</p>)}
              <p className="mt-5 text-2xl font-bold">{money(total)}</p>
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={cashReceived} disabled={busy || !canCheckout} onChange={e => setCashReceived(e.target.checked)} />
                Saya mengesahkan wang tunai sebenar telah diterima dan amaun disemak.
              </label>
              <button disabled={!canCheckout || !cashReceived || busy || (!selected.length && !pending)} onClick={() => void checkout()} className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-40">
                {pending ? "Sahkan semula jualan tertangguh" : "Rekod jualan tunai"}
              </button>
              {!canCheckout && <p className="mt-3 text-sm text-muted-foreground">Peranan anda tidak dibenarkan membuat checkout.</p>}
              {pending && <p className="mt-3 text-sm text-amber-500">Transaksi tertangguh: kunci dikekalkan sepanjang sesi ini. Jangan refresh halaman sebelum semak status jualan.</p>}
              {receipt && <div className="mt-5 rounded-lg border p-3 text-sm"><b>Jualan disahkan</b><p>ID: {receipt.saleId}</p><p>Jumlah: {money(receipt.totalCents)}</p><p>Bukan invois cukai. Cetakan rasmi belum diaktifkan.</p></div>}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
