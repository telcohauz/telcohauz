import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/assets")({
  component: () => <PlaceholderModule title="Assets" description="Asset registry with depreciation and maintenance." points={["Equipment, vehicles, electronics", "Depreciation tracking", "Maintenance logs · QR-ready"]} />,
});
