import { Plus } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import StatsCards from "@/components/StatsCards";
import RevenueChart from "@/components/RevenueChart";
import UpcomingReservations from "@/components/UpcomingReservations";
import AlertsPanel from "@/components/AlertsPanel";

/** Main dashboard page — SweetHome conciergerie */
const Index = () => {
  return (
    <div className="page-shell flex min-h-screen bg-background">
      {/* Left sidebar navigation */}
      <SidebarNav />

      {/* Main content area */}
      <main className="flex-1 flex flex-col gap-5 p-4 lg:p-6 pl-4 lg:pl-6 min-w-0 pt-16 lg:pt-6">
        {/* Top navigation bar */}
        <TopNav />

        {/* Welcome header + CTA */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
            BIENVENUE
          </h2>
          <button className="flex items-center gap-2 bg-[#007BFF] text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-md">
            <Plus className="h-4 w-4" />
            Ajouter un logement
          </button>
        </div>

        {/* Stats cards row */}
        <StatsCards />

        {/* Bottom section: chart + right panels */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
          {/* Revenue chart — takes 3 cols */}
          <div className="lg:col-span-3">
            <RevenueChart />
          </div>

          {/* Right column: reservations + alerts */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-5">
            <UpcomingReservations />
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
