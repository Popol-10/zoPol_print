import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AdminOnlyRoute() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-500">
        Vérification de vos droits…
      </main>
    );
  }

  return user?.roles.includes("ADMIN") ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
