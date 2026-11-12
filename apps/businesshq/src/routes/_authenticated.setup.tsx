import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/setup")({
  component: () => <Navigate to="/onboarding" replace />,
});
