import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-500">
        Vérification de votre session…
      </main>
    );
  }
  return status === "authenticated" ? (
    <Outlet />
  ) : (
    <Navigate to="/connexion" replace state={{ from: location }} />
  );
}

export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return null;
  return status === "authenticated" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Outlet />
  );
}
