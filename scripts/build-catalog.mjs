import { readFile, mkdir, writeFile } from "node:fs/promises";
import { validateCatalog, publicProduct } from "../packages/catalog/catalog.ts";
const products = validateCatalog(
  JSON.parse(
    await readFile(new URL("../packages/catalog/data/products.json", import.meta.url), "utf8"),
  ),
);
const directory = new URL("../public/catalog/v1/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const channel of ["web", "hero"]) {
  await writeFile(
    new URL(channel + ".json", directory),
    JSON.stringify(
      { schemaVersion: 1, channel, products: products.map((p) => publicProduct(p, channel)) },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  `Built versioned public catalogue: ${products.length} candidates; unverified prices and applications withheld.`,
);
