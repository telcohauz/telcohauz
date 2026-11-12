import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/contracts")({
  component: () => <PlaceholderModule title="Contracts" description="Upload, summarize and renew contracts." points={["AI summary of contracts", "Renewal reminders", "Template storage"]} />,
});
