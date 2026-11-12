import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/PlaceholderModule";
export const Route = createFileRoute("/_authenticated/projects")({
  component: () => <PlaceholderModule title="Projects" description="Kanban boards, tasks and team collaboration." points={["Kanban board with priorities", "Assignees and deadlines", "Progress tracking"]} />,
});
