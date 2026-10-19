import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/erp/Dashboard";
import Clients from "@/pages/erp/Clients";
import Products from "@/pages/erp/Products";
import Suppliers from "@/pages/erp/Suppliers";
import Orders from "@/pages/erp/Orders";
import Sales from "@/pages/erp/Sales";
import Invoices from "@/pages/erp/Invoices";
import Planning from "@/pages/erp/Planning";
import Receipts from "@/pages/erp/Receipts";
import Purchases from "@/pages/erp/Purchases";
import Production from "@/pages/erp/Production";
import Station from "@/pages/erp/Station";
import Stock from "@/pages/erp/Stock";
import Finance from "@/pages/erp/Finance";
import { Machines } from "@/pages/erp/PeopleMachines";
import { Employees } from "@/pages/erp/Employees";
import { Attendance } from "@/pages/erp/Attendance";
import { HrTasks } from "@/pages/erp/HrTasks";
import { Remuneration } from "@/pages/erp/Remuneration";
import { FinanceOnlyRoute } from "@/components/auth/FinanceOnlyRoute";
import { BusinessModule, Quotes } from "@/pages/erp/BusinessModules";
import { Reports, Statistics } from "@/pages/erp/Insights";
import UserRoles from "@/pages/erp/UserRoles";
import Profile from "@/pages/erp/Profile";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";
import { HrOnlyRoute } from "@/components/auth/HrOnlyRoute";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/AuthRoutes";
import AuthPage from "@/pages/auth/AuthPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

function MissingPage() {
  return (
    <div className="page-enter surface-card mx-auto max-w-lg p-10 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff226d]">
        Erreur 404
      </p>
      <h1 className="mt-2 text-2xl font-extrabold">Cette page n’existe pas</h1>
      <a
        className="mt-5 inline-block rounded-xl bg-[#ff226d] px-4 py-2.5 text-sm font-bold text-white"
        href="/dashboard"
      >
        Revenir au tableau de bord
      </a>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/connexion" element={<AuthPage mode="login" />} />
              <Route
                path="/inscription"
                element={<AuthPage mode="register" />}
              />
              <Route
                path="/reinitialiser-mot-de-passe"
                element={<ResetPasswordPage />}
              />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/produits" element={<Products />} />
                <Route path="/devis" element={<Quotes />} />
                <Route path="/commandes" element={<Orders />} />
                <Route path="/ventes" element={<Sales />} />
                <Route path="/factures" element={<Invoices />} />
                <Route path="/production" element={<Production />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/dtf" element={<Station station="dtf" />} />
                <Route path="/laser" element={<Station station="laser" />} />
                <Route path="/presse" element={<Station station="presse" />} />
                <Route
                  path="/qualite"
                  element={<Station station="qualite" />}
                />
                <Route path="/stock" element={<Stock />} />
                <Route
                  path="/mouvements"
                  element={<BusinessModule kind="movements" />}
                />
                <Route
                  path="/inventaire"
                  element={<BusinessModule kind="inventory" />}
                />
                <Route path="/fournisseurs" element={<Suppliers />} />
                <Route path="/achats" element={<Purchases />} />
                <Route path="/receptions" element={<Receipts />} />
                <Route element={<FinanceOnlyRoute />}>
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/caisse" element={<Finance mode="caisse" />} />
                  <Route path="/banque" element={<Finance mode="banque" />} />
                  <Route path="/revenus" element={<Finance mode="revenus" />} />
                  <Route
                    path="/depenses"
                    element={<Finance mode="depenses" />}
                  />
                  <Route path="/charges" element={<Finance mode="charges" />} />
                </Route>
                <Route path="/employes" element={<Employees />} />
                <Route element={<AdminOnlyRoute />}>
                  <Route path="/utilisateurs" element={<UserRoles />} />
                </Route>
                <Route element={<HrOnlyRoute />}>
                  <Route path="/presences" element={<Attendance />} />
                </Route>
                <Route element={<HrOnlyRoute />}>
                  <Route path="/taches" element={<HrTasks />} />
                </Route>
                <Route element={<HrOnlyRoute />}>
                  <Route path="/remuneration" element={<Remuneration />} />
                </Route>
                <Route path="/machines" element={<Machines />} />
                <Route
                  path="/utilisation"
                  element={<Machines mode="utilisation" />}
                />
                <Route
                  path="/maintenance"
                  element={<Machines mode="maintenance" />}
                />
                <Route path="/statistiques" element={<Statistics />} />
                <Route path="/rapports" element={<Reports />} />
                <Route
                  path="/parametres"
                  element={<BusinessModule kind="settings" />}
                />
                <Route path="*" element={<MissingPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}
