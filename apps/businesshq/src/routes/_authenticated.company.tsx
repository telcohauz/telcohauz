import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/company")({
  component: () => <PlaceholderModule title="Company Profile" description="Business identity, registration, directors and bank accounts." points={["Registration number, tax IDs, SST/GST", "Shareholders & directors", "Branches and bank accounts"]} />,
});
