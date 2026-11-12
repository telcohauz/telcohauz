import { createFileRoute } from "@tanstack/react-router";
import { MasterProductScreen } from "@/components/MasterProductScreen";
export const Route = createFileRoute("/master-products")({
  ssr: false,
  head: () => ({ meta: [{ title: "Master Produk — BOZ Boss" }] }),
  component: MasterProductScreen,
});
