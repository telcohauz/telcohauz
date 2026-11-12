import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/settings")({
  component: () => <PlaceholderModule title="Settings" description="Company, user preferences, subscription and notifications." points={["Company & user preferences", "Subscription management", "Notifications · Theme"]} />,
});
