import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/grants")({
  component: () => <PlaceholderModule title="Grants Center" description="Government grants matched to your business." points={["MIDA, SME Corp, Cradle, GTFS (MY)", "Eligibility matching", "Application pipeline tracking"]} />,
});
