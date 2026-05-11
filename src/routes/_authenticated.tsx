import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({ component: AuthGuard });

function AuthGuard() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    const redirect = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
    return <Navigate to="/login" search={{ redirect }} />;
  }

  return <Outlet />;
}
