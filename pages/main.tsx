import { createRoot } from "react-dom/client";
import { CatalogScreen } from "../src/components/CatalogScreen";
import { MasterProductScreen } from "../src/components/MasterProductScreen";

const container = document.getElementById("app");
if (!container) throw new Error("Application container missing");
createRoot(container).render(
  window.location.pathname.startsWith("/boz") ? <MasterProductScreen /> : <CatalogScreen />,
);
