import { useCallback, useEffect, useState, type FormEvent } from "react";
import { bozCore } from "@/lib/boz-core";
type Product = {
  id: string;
  product_code: string;
  name: string;
  category: string;
  lifecycle: string;
  risk_state: string;
  active: boolean;
  source_system: string | null;
};
export function MasterProductScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"loading" | "login" | "ready" | "denied">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const refresh = useCallback(async () => {
    setError("");
    try {
      const client = bozCore();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) {
        setProducts([]);
        setState("login");
        return;
      }
      const profile = await client
        .from("profiles")
        .select("role,active")
        .eq("user_id", user.id)
        .single();
      if (
        profile.error ||
        !profile.data?.active ||
        !["OWNER", "ADMIN"].includes(profile.data.role)
      ) {
        setProducts([]);
        setState("denied");
        return;
      }
      const result = await client
        .from("products")
        .select("id,product_code,name,category,lifecycle,risk_state,active,source_system")
        .order("product_code")
        .limit(1000);
      if (result.error) throw result.error;
      setProducts((result.data || []) as Product[]);
      setState("ready");
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : "Rekod belum dapat dimuatkan.");
      setState("login");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await bozCore().auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      setPassword("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Log masuk gagal.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setProducts([]);
    setState("login");
    const result = await bozCore().auth.signOut();
    if (result.error) setError(result.error.message);
  }
  const visible = products.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.name} ${p.product_code} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <a href="/catalog/" className="text-primary">
        ← Katalog awam
      </a>
      <h1 className="mt-8 text-3xl font-bold">Master Produk BOZ</h1>
      <p className="mt-3 text-muted-foreground">
        Semakan katalog dalaman. Rekod PRIVATE / READY belum bermaksud produk telah diluluskan untuk
        jualan awam.
      </p>
      {error && (
        <p role="alert" className="my-5 rounded border border-destructive p-4">
          {error}
        </p>
      )}
      {state === "loading" && <p className="mt-8">Menyemak sesi…</p>}
      {state === "login" && (
        <form onSubmit={login} className="mt-8 max-w-md space-y-5 rounded-xl border p-6">
          <p>Log masuk menggunakan akaun owner atau admin BOZ sedia ada.</p>
          <label className="block">
            E-mel
            <input
              className="mt-2 block w-full rounded border bg-background p-3"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            Kata laluan
            <input
              className="mt-2 block w-full rounded border bg-background p-3"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy} className="rounded bg-primary px-5 py-3 text-primary-foreground">
            {busy ? "Menyemak…" : "Log masuk BOZ"}
          </button>
        </form>
      )}
      {state === "denied" && (
        <section className="mt-8 rounded border p-6">
          <p>
            Akaun ini belum diberikan akses owner/admin BOZ. Hubungi pentadbir untuk pengesahan
            peranan.
          </p>
          <button className="mt-4 text-primary" onClick={logout}>
            Tukar akaun
          </button>
        </section>
      )}
      {state === "ready" && (
        <>
          <div className="my-8 flex flex-wrap items-center gap-3">
            <input
              aria-label="Cari master produk"
              placeholder="Cari produk, kod atau kategori"
              className="min-w-64 flex-1 rounded border bg-background p-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Kategori master"
              className="rounded border bg-background p-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Semua kategori</option>
              {[...new Set(products.map((p) => p.category))].sort().map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button onClick={refresh} className="rounded border p-3">
              Muat semula
            </button>
            <button onClick={logout} className="rounded border p-3">
              Log keluar
            </button>
          </div>
          <p role="status">
            {visible.length} daripada {products.length} rekod yang dibenarkan
          </p>
          <div className="mt-5 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["Kod", "Produk", "Kategori", "Status", "Akses"].map((h) => (
                    <th className="border-b p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td className="border-b p-3">{p.product_code}</td>
                    <td className="border-b p-3">{p.name}</td>
                    <td className="border-b p-3">{p.category}</td>
                    <td className="border-b p-3">
                      {p.lifecycle}
                      {!p.active ? " / Tidak aktif" : ""}
                    </td>
                    <td className="border-b p-3">{p.risk_state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
