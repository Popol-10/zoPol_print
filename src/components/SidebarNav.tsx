import icoP from "@/assets/iconSweeth.png";
import {
    Menu,
    Settings,
    X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import icoAbonnement from "../assets/ico abonnement.png";
import icoBusiness from "../assets/ico busness.png";
import icoCalendrier from "../assets/ico calendrier.png";
import icoHome from "../assets/ico dash.png";
import icoFinance from "../assets/ico finance.png";
import icoMesLogements from "../assets/ico Home.png";
import icoGestion from "../assets/ico Home2.png";
import icoMoney from "../assets/ico money.png";
import icoOption from "../assets/ico option.png";
import icoReservation from "../assets/ico reservation.png";


/** Navigation menu item definition */
interface NavItem {
  iconSrc: string;
  label: string;
  to?: string;
}

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
}

/** Main navigation items */
const mainNavItems: NavItem[] = [
  { iconSrc: icoHome, label: "Dashboard", to: "/dashboard" },
  { iconSrc: icoMesLogements, label: "Mes Logements", to: "/logements" },
  { iconSrc: icoGestion, label: "Gestions multi-bien", to: "/gestion-multi-bien" },
  { iconSrc: icoCalendrier, label: "Calendrier", to: "/calendrier" },
  { iconSrc: icoReservation, label: "Réservations", to: "/reservations" },
  { iconSrc: icoMoney, label: "Tarifs & Conditions", to: "/tarifs-conditions" },
  { iconSrc: icoOption, label: "Options / Services", to: "/options-services" },
  { iconSrc: icoBusiness, label: "Business", to: "/business" },
  { iconSrc: icoFinance, label: "Finance & Gouvernance", to: "/finance-gouvernance" },
  { iconSrc: icoAbonnement, label: "Mon abonnement", to: "/mon-abonnement" },
];

/** Bottom navigation item */
const bottomNavItem: BottomNavItem = { icon: Settings, label: "Paramètres" };

interface SidebarNavProps {
  activePage?: string;
}

const SidebarNav = ({ activePage = "Dashboard" }: SidebarNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-card p-2 shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-[280px] bg-card rounded-r-2xl shadow-[0_25px_60px_-25px_rgba(197,197,231,0.55)] flex flex-col transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-8 pt-8 pb-6">
          <img src={icoP} alt="" />
          <span className="text-xl font-extrabold tracking-tight text-foreground">SWEETHOME</span>
        </div>

        {/* Main nav items */}
        <nav className="flex-1 flex flex-col px-4 gap-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const isActive = item.to
              ? item.to === "/logements"
                ? location.pathname.startsWith("/logements")
                : item.to === "/gestion-multi-bien"
                  ? location.pathname.startsWith("/gestion-multi-bien")
                : item.to === "/options-services"
                  ? location.pathname.startsWith("/options-services")
                : item.to === "/mon-abonnement"
                  ? location.pathname.startsWith("/mon-abonnement")
                : location.pathname === item.to
              : item.label === activePage;
            const className = `flex items-center gap-3.5 px-5 py-3 rounded-xl text-[15px] font-medium transition-colors w-full text-left ${
              isActive ? "bg-primary text-primary-foreground shadow-md" : "text-sidebar-foreground hover:bg-muted"
            }`;

            if (!item.to) {
              return (
                <button key={item.label} className={className}>
                  <img src={item.iconSrc} alt="" className="h-5 w-5 flex-shrink-0 object-contain" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <NavLink key={item.label} to={item.to} className={className} onClick={() => setMobileOpen(false)}>
                <img src={item.iconSrc} alt="" className="h-5 w-5 flex-shrink-0 object-contain" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: Paramètres */}
        <div className="px-4 pb-8 pt-4">
          <button className="flex items-center gap-3.5 px-5 py-3 rounded-xl text-[15px] font-medium text-sidebar-foreground hover:bg-muted transition-colors w-full text-left">
            <bottomNavItem.icon className="h-5 w-5 flex-shrink-0" />
            <span>{bottomNavItem.label}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
