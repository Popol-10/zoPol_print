import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import icoP from "@/assets/iconSweeth.png";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import { organizationsApi } from "@/lib/organizations";
import {
  restoreOrganizationRuntimeSettings,
  setOrganizationRuntimeSettings,
} from "@/lib/organization-runtime-settings";
import {
  notificationsApi,
  type NotificationList,
  type NotificationRecord,
} from "@/lib/notifications";

interface NavigationItem {
  label: string;
  to: string;
  icon?: LucideIcon;
}

interface SidebarGroup {
  title: string;
  links: NavigationItem[];
}

const primaryLinks: NavigationItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Commerce", to: "/clients", icon: UserRound },
  { label: "Production", to: "/production", icon: Factory },
  { label: "Stock", to: "/stock", icon: ClipboardList },
];

const navigationGroups: SidebarGroup[] = [
  {
    title: "Commerce",
    links: [
      { label: "Clients", to: "/clients" },
      { label: "Produits", to: "/produits" },
      { label: "Devis", to: "/devis" },
      { label: "Commandes", to: "/commandes" },
      { label: "Ventes", to: "/ventes" },
      { label: "Factures", to: "/factures" },
    ],
  },
  {
    title: "Production",
    links: [
      { label: "Planning", to: "/planning" },
      { label: "Production DTF", to: "/dtf" },
      { label: "Laser CO₂", to: "/laser" },
      { label: "Presse à chaud", to: "/presse" },
      { label: "Contrôle qualité", to: "/qualite" },
    ],
  },
  {
    title: "Stock",
    links: [
      { label: "Stock", to: "/stock" },
      { label: "Mouvements", to: "/mouvements" },
      { label: "Inventaire", to: "/inventaire" },
    ],
  },
  {
    title: "Achats",
    links: [
      { label: "Fournisseurs", to: "/fournisseurs" },
      { label: "Commandes fournisseurs", to: "/achats" },
      { label: "Réceptions", to: "/receptions" },
    ],
  },
  {
    title: "Finance",
    links: [
      { label: "Dashboard financier", to: "/finance" },
      { label: "Caisse", to: "/caisse" },
      { label: "Banque", to: "/banque" },
      { label: "Revenus", to: "/revenus" },
      { label: "Dépenses", to: "/depenses" },
    ],
  },
  {
    title: "Personnel",
    links: [
      { label: "Employés", to: "/employes" },
      { label: "Présences", to: "/presences" },
      { label: "Tâches", to: "/taches" },
      { label: "Rémunération", to: "/remuneration" },
    ],
  },
  {
    title: "Machines",
    links: [
      { label: "Machines", to: "/machines" },
      { label: "Utilisation", to: "/utilisation" },
      { label: "Maintenance", to: "/maintenance" },
    ],
  },
];

const routeTitles: Record<string, string> = {
  "/dashboard": "Vue d'ensemble",
  "/profil": "Mon profil",
  "/clients": "Clients",
  "/produits": "Produits",
  "/devis": "Devis",
  "/commandes": "Commandes",
  "/ventes": "Ventes",
  "/factures": "Factures",
  "/production": "Production",
  "/planning": "Planning",
  "/dtf": "Production DTF",
  "/laser": "Laser CO₂",
  "/presse": "Presse à chaud",
  "/qualite": "Contrôle qualité",
  "/stock": "Stock",
  "/mouvements": "Mouvements",
  "/inventaire": "Inventaire",
  "/fournisseurs": "Fournisseurs",
  "/achats": "Commandes fournisseurs",
  "/receptions": "Réceptions",
  "/finance": "Dashboard financier",
  "/caisse": "Caisse",
  "/banque": "Banque",
  "/revenus": "Revenus",
  "/depenses": "Dépenses",
  "/charges": "Charges",
  "/employes": "Employés",
  "/utilisateurs": "Membres et rôles",
  "/presences": "Présences",
  "/taches": "Tâches",
  "/remuneration": "Rémunération",
  "/machines": "Machines",
  "/utilisation": "Utilisation",
  "/maintenance": "Maintenance",
  "/statistiques": "Statistiques",
  "/rapports": "Rapports",
  "/parametres": "Paramètres",
};

function SidebarGroup({
  title,
  links,
  onNavigate,
}: SidebarGroup & { onNavigate: () => void }) {
  return (
    <div className="px-4 py-2.5">
      <p className="px-3 pb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      {links.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  );
}

function Sidebar({
  open,
  onClose,
  organizationName,
}: {
  open: boolean;
  onClose: () => void;
  organizationName: string;
}) {
  const { user } = useAuth();
  const canViewHrData = Boolean(
    user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)),
  );
  const canViewQuotes = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );
  const canViewInvoices = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "ACCOUNTANT", "COMMERCIAL"].includes(role),
    ),
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[84vw] max-w-[300px] flex-col border-r border-slate-100 bg-white py-6 shadow-[20px_0_60px_-36px_rgba(30,41,59,.4)] transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:h-screen lg:w-[288px] lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-6">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <img src={icoP} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="text-[21px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              {organizationName}
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mb-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Atelier connecté
          </p>
          <p className="mt-1 text-[13px] font-extrabold text-slate-700 dark:text-slate-300">
            Septembre 2026
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto pb-4">
          {primaryLinks.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              {label}
            </NavLink>
          ))}

          {navigationGroups.map((group) => {
            const canViewFinance = Boolean(
              user?.roles.some((role) =>
                ["ADMIN", "ACCOUNTANT"].includes(role),
              ),
            );
            const financeRoutes = [
              "/finance",
              "/caisse",
              "/banque",
              "/revenus",
              "/depenses",
              "/charges",
            ];
            const links = group.links.filter(({ to }) => {
              const needsHrAccess = [
                "/remuneration",
                "/presences",
                "/taches",
              ].includes(to);
              const needsQuoteAccess = to === "/devis";
              const needsInvoiceAccess = to === "/factures";
              return (
                (!needsHrAccess || canViewHrData) &&
                (!needsQuoteAccess || canViewQuotes) &&
                (!needsInvoiceAccess || canViewInvoices) &&
                (!financeRoutes.includes(to) || canViewFinance)
              );
            });
            return links.length > 0 ? (
              <SidebarGroup
                key={group.title}
                {...group}
                links={links}
                onNavigate={onClose}
              />
            ) : null;
          })}

          <div className="mx-4 mt-2 h-px bg-slate-100 dark:bg-slate-800" />
          <NavLink
            to="/statistiques"
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item mt-3 ${isActive ? "nav-item-active" : ""}`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            Statistiques
          </NavLink>
          {user?.roles.includes("ADMIN") ? (
            <NavLink
              to="/utilisateurs"
              onClick={onClose}
              className={({ isActive }) => `nav-item `}
            >
              <UserRound className="h-5 w-5" />
              Membres et rôles
            </NavLink>
          ) : null}
          <NavLink
            to="/rapports"
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <ClipboardList className="h-5 w-5" />
            Rapports
          </NavLink>
        </nav>

        <div className="px-4 pt-3">
          <NavLink
            to="/parametres"
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <Settings className="h-5 w-5" />
            Paramètres
          </NavLink>
        </div>
      </aside>
    </>
  );
}

function notificationAccessToken(): string {
  const session = readAuthSession();
  if (!session) {
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  return session.tokens.accessToken;
}

function relativeNotificationTime(value: string): string {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes === 0) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(createdAt);
}

function Notifications() {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationList>({
    items: [],
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setError(null);
    try {
      const result = await notificationsApi.list(notificationAccessToken());
      setNotifications(result);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les notifications n’ont pas pu être chargées.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    const timer = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadNotifications]);

  useEffect(() => {
    window.addEventListener(
      "notifications-preferences-updated",
      loadNotifications,
    );
    window.addEventListener("organization-settings-updated", loadNotifications);
    return () => {
      window.removeEventListener(
        "notifications-preferences-updated",
        loadNotifications,
      );
      window.removeEventListener(
        "organization-settings-updated",
        loadNotifications,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const markAsRead = async (notificationIds: string[]): Promise<boolean> => {
    const unreadIds = new Set(
      notifications.items
        .filter((item) => notificationIds.includes(item.id) && !item.isRead)
        .map((item) => item.id),
    );
    if (unreadIds.size === 0) return true;

    setIsSaving(true);
    setError(null);
    try {
      await notificationsApi.markRead(notificationAccessToken(), [
        ...unreadIds,
      ]);
      setNotifications((current) => ({
        ...current,
        items: current.items.map((item) =>
          unreadIds.has(item.id) ? { ...item, isRead: true } : item,
        ),
        unreadCount: Math.max(0, current.unreadCount - unreadIds.size),
      }));
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le statut de lecture n’a pas pu être enregistré.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const openNotification = async (notification: NotificationRecord) => {
    await markAsRead([notification.id]);
    setIsOpen(false);
    navigate(notification.route);
  };

  const unreadItems = notifications.items.filter((item) => !item.isRead);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) void loadNotifications();
        }}
        aria-label={
          notifications.unreadCount > 0
            ? `Ouvrir les notifications, ${notifications.unreadCount} non lue(s)`
            : "Ouvrir les notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-[#ff226d] dark:hover:bg-slate-900"
      >
        <Bell className="h-5 w-5" />
        {notifications.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff226d] px-1 text-[10px] font-extrabold text-white ring-2 ring-[#f7f7fb] dark:ring-slate-950">
            {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <section
          role="dialog"
          aria-label="Notifications récentes"
          className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-[15px] font-extrabold">Notifications</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {notifications.unreadCount} non lue(s)
              </p>
            </div>
            <button
              type="button"
              disabled={isSaving || unreadItems.length === 0}
              onClick={() =>
                void markAsRead(unreadItems.map((item) => item.id))
              }
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#ff226d] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:hover:bg-rose-950/30"
            >
              <CheckCheck className="h-4 w-4" />
              Tout lire
            </button>
          </header>
          {error && (
            <div
              className="m-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700"
              role="alert"
            >
              <p>{error}</p>
              <button
                type="button"
                className="mt-2 font-extrabold underline"
                onClick={() => void loadNotifications()}
              >
                Réessayer
              </button>
            </div>
          )}
          <div className="max-h-[min(65vh,30rem)] overflow-y-auto p-2">
            {isLoading && notifications.items.length === 0 ? (
              <p className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Chargement…
              </p>
            ) : notifications.items.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Aucune activité récente à afficher.
              </p>
            ) : (
              notifications.items.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${notification.isRead ? "" : "bg-rose-50/70 dark:bg-rose-950/20"}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200 dark:bg-slate-700" : "bg-[#ff226d]"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                        {notification.title}
                      </span>
                      <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
                        {relativeNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {notification.detail}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Topbar({
  onMenu,
  dark,
  onDark,
}: {
  onMenu: () => void;
  dark: boolean;
  onDark: () => void;
}) {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? "Espace de travail";

  return (
    <header className="sticky top-0 z-20 -mx-4 flex min-h-[76px] items-center justify-between border-b border-slate-100/80 bg-[#f7f7fb]/90 px-4 py-3 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90 sm:-mx-6 sm:px-6 lg:-mx-8 lg:min-h-[82px] lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[13px] font-medium text-slate-400 sm:block">
            Gestion de l'atelier
          </p>
          <h2 className="truncate text-[17px] font-extrabold text-slate-900 dark:text-white sm:text-[19px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <label className="hidden h-11 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 dark:border-slate-700 dark:bg-slate-900 md:flex">
          <Search className="h-[18px] w-[18px]" />
          <input
            className="w-full bg-transparent text-sm font-medium outline-none"
            placeholder="Recherche globale"
          />
        </label>
        <button
          type="button"
          onClick={onDark}
          aria-label="Changer de thème"
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-[#ff226d] dark:hover:bg-slate-900"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Notifications />
        <AccountMenu />
      </div>
    </header>
  );
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("MAK'ART");
  const [organizationSettingsRevision, setOrganizationSettingsRevision] =
    useState(0);
  const [dark, setDark] = useState(
    () => localStorage.getItem("makart-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("makart-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let active = true;
    const session = readAuthSession();
    if (!session) return;

    if (restoreOrganizationRuntimeSettings(session.user.organizationId)) {
      setOrganizationSettingsRevision((version) => version + 1);
    }

    const loadOrganizationSettings = async () => {
      try {
        const settings = await organizationsApi.getSettings(
          session.tokens.accessToken,
        );
        if (!active) return;
        setOrganizationRuntimeSettings(settings);
        setOrganizationName(settings.name);
        setOrganizationSettingsRevision((version) => version + 1);
      } catch {
        // Cached settings keep formatting stable if the API is temporarily unavailable.
      }
    };
    const refreshOrganizationSettings = () => {
      void loadOrganizationSettings();
    };

    void loadOrganizationSettings();
    window.addEventListener(
      "organization-settings-updated",
      refreshOrganizationSettings,
    );
    return () => {
      active = false;
      window.removeEventListener(
        "organization-settings-updated",
        refreshOrganizationSettings,
      );
    };
  }, []);

  return (
    <div
      data-organization-settings-revision={organizationSettingsRevision}
      className="erp-app min-h-screen bg-[#f7f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="flex min-h-screen">
        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          organizationName={organizationName}
        />
        <main className="min-w-0 flex-1">
          <Topbar
            onMenu={() => setMenuOpen(true)}
            dark={dark}
            onDark={() => setDark((value) => !value)}
          />
          <div className="mx-auto max-w-[1720px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
