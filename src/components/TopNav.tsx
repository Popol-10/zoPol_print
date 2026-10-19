import { ChevronDown, Power, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import icoM from "../assets/ico messg.png";
import icoM2 from "../assets/ico notif.png";
import use1 from "../assets/user.png";


interface TopNavProps {
  title?: string;
  userName?: string;
  unreadMessagesCount?: number;
}

/** Top navigation bar with page title, messages, notifications and user profile */
const TopNav = ({ title = "DASHBOARD", userName = "John Doe", unreadMessagesCount = 1 }: TopNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesPage = location.pathname === "/messages";
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    navigate("/profil");
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    localStorage.removeItem("subscription-state");
    navigate("/dashboard");
  };

  return (
    <header className="relative flex items-center justify-between overflow-visible rounded-2xl bg-card px-6 py-4 shadow-[0_18px_45px_-24px_rgba(197,197,231,0.55)] lg:px-8">
      {/* Page title */}
      <h1 className="text-xl lg:text-2xl font-extrabold  text-[#FF226D] tracking-wide">
        {title}
      </h1>

      {/* Right section: messages, notifications, user */}
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Messages */}
        <button
          onClick={() => navigate("/messages")}
          className={`hidden sm:flex items-center gap-2 text-sm font-bold transition-colors ${
            isMessagesPage ? "text-[#0f7bf1]" : "text-foreground hover:text-primary"
          }`}
        >
          <img src={icoM} alt="" className="h-5 w-5" />
          <span>{unreadMessagesCount > 0 ? `Messages(${unreadMessagesCount})` : "Messages"}</span>
        </button>

        {/* Notifications */}
        <button className="hidden sm:flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
          <img src={icoM2} alt="" className="h-5 w-5" />
          <span>Notifications(5)</span>
        </button>

        {/* User profile pill */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-[17px] bg-[#FF226D] py-1.5 pl-1.5 pr-4 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-bold">
              <img src={use1} alt="" />
            </div>
            <span className="hidden text-sm font-semibold sm:inline">{userName}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[180px] rounded-[12px] border border-[#d9d9dd] bg-white p-2 shadow-[0_20px_55px_-20px_rgba(113,123,255,0.8)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleProfileClick}
                className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[15px] text-[#1d1d24] transition-colors hover:bg-[#f3f3f6]"
              >
                <User className="h-4 w-4" />
                <span>Mon profil</span>
              </button>
              <div className="my-1 h-px bg-[#e8e8ec]" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[15px] text-[#ff1f1f] transition-colors hover:bg-[#fff3f5]"
              >
                <Power className="h-4 w-4" />
                <span>Deconnexion</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
