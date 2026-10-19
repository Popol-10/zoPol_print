import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function FinanceOnlyRoute() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-500">
        Vérification de vos droits…
      </main>
    );
  }

  const canViewFinance = user?.roles.some((role) =>
    ["ADMIN", "ACCOUNTANT"].includes(role),
  );
  return canViewFinance ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
