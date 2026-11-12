import { createFileRoute } from "@tanstack/react-router";
import { CatalogScreen } from "@/components/CatalogScreen";
export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [{ title: "Katalog Produk — Telcohauz" }] }),
  component: CatalogScreen,
});
