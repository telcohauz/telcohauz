import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { PlaceholderModule } from "@/components/PlaceholderModule";
import { assertAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-access-check"],
    queryFn: () => assertAdminAccess(),
    retry: false,
  });

  useEffect(() => {
    if (isError) navigate({ to: "/dashboard", replace: true });
  }, [isError, navigate]);

  if (isLoading || isError || !data) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  return (
    <PlaceholderModule
      title="Admin Panel"
      description="Super-admin tools for tenants, users and rules."
      points={["Manage companies and users", "Country rules & compliance DB", "Grant database · System logs"]}
    />
  );
}
