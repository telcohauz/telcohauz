import { build } from "esbuild";
import { mkdir, readFile, readdir, copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const output = "dist-pages";
await mkdir(join(output, "assets"), { recursive: true });
await build({
  entryPoints: ["pages/main.tsx"],
  bundle: true,
  outfile: join(output, "assets/boz-app.js"),
  format: "esm",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  tsconfig: "tsconfig.json",
});
const stylesheet = (await readdir("dist/client/assets")).find(
  (name) => name.startsWith("styles-") && name.endsWith(".css"),
);
if (!stylesheet) throw new Error("Run npm run build before building Pages");
await copyFile(join("dist/client/assets", stylesheet), join(output, "assets/boz-app.css"));
for (const [route, title] of [
  ["catalog", "Katalog Produk Telcohauz"],
  ["boz", "Master Produk BOZ"],
]) {
  await mkdir(join(output, route), { recursive: true });
  await writeFile(
    join(output, route, "index.html"),
    `<!doctype html><html lang="ms" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${route === "boz" ? "noindex,nofollow" : "index,follow"}"><title>${title}</title><link rel="stylesheet" href="/assets/boz-app.css"></head><body><div id="app"></div><script type="module" src="/assets/boz-app.js"></script></body></html>`,
  );
}
await writeFile(
  join(output, "BUILD.json"),
  JSON.stringify(
    {
      sourceRepository: "telcohauz/telcohauz",
      catalogue: "public HOLD projection; internal products require authorized BOZ login",
      buildVersion: 1,
    },
    null,
    2,
  ),
);
console.log("Built static catalogue and owner master screen using shared application components.");
