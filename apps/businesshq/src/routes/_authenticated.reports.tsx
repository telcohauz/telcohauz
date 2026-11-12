import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/reports")({
  component: () => <PlaceholderModule title="Reports" description="Exportable PDFs & Excel reports." points={["Company summary PDF", "Financial / Payroll / Compliance", "Asset reports"]} />,
});
