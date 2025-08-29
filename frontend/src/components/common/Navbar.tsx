import { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/components/_navbar.scss";
import {
  FaHome,
  FaFacebookMessenger,
  FaBell,
  FaSearch,
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaGlobe,
} from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

/** Props coming from parent */
interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

/** Minimal shape for notifications stored in localStorage */
interface StoredNotification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

/** Shape for currentUser in localStorage (keep fields optional to avoid 'any') */
interface CurrentUser {
  id?: string | number;
  email?: string;
  fullName?: string;
  name?: string;
  username?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  setSearchTerm,
  isLoggedIn,
  setIsLoggedIn,
}) => {
  const [menuOpen, setMenuOpen] = useState(false); // account dropdown (profile/settings/logout)
  const [notifOpen, setNotifOpen] = useState(false); // notifications dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeBump, setBadgeBump] = useState(false); // tiny animation when count changes
  const [lastTen, setLastTen] = useState<StoredNotification[]>([]); // last 10 notifications
  const [displayName, setDisplayName] = useState<string>("");

  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();

  // Refs used to detect outside clicks (close dropdowns)
  const accountRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  /** Utility: human-friendly user display name */
  const computeDisplayName = (u: CurrentUser | null): string => {
    if (!u) return "";
    return (
      u.username ||
      u.fullName ||
      u.name ||
      (u.email ? u.email.split("@")[0] : "")
    );
  };

  /** Language toggle */
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  };

  /** Smoothly update unread with a bump animation when it changes */
  const setUnreadWithBump = (nextUnread: number) => {
    setUnreadCount((prev) => {
      if (prev !== nextUnread) {
        setBadgeBump(true);
        setTimeout(() => setBadgeBump(false), 450);
      }
      return nextUnread;
    });
  };

  /** Read notifications from localStorage and update count & last ten list */
  const hydrateNotifications = () => {
    const stored: StoredNotification[] = JSON.parse(
      localStorage.getItem("notifications") || "[]"
    );
    const unread = stored.filter((n) => !n.read).length;
    setUnreadWithBump(unread);
    // sort by createdAt desc (fallback to id), then slice top 10
    const sorted = [...stored].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || a.id || 0;
      const tb = new Date(b.createdAt).getTime() || b.id || 0;
      return tb - ta;
    });
    setLastTen(sorted.slice(0, 10));
  };

  /** Initial boot: user name + notifications */
  useEffect(() => {
    const current: CurrentUser | null = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
    setDisplayName(computeDisplayName(current));
    hydrateNotifications();
  }, []);

  /** Listen for storage changes (tabs) + our custom event + BroadcastChannel */
  useEffect(() => {
    const onStorage = () => hydrateNotifications();

    // Custom event dispatched within same tab by pages that mutate notifications
    const onLocalUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ unread?: number }>).detail;
      if (detail && typeof detail.unread === "number") {
        setUnreadWithBump(detail.unread);
      }
      hydrateNotifications();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("notifications:updated", onLocalUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lynkr_notifications");
      bc.onmessage = () => hydrateNotifications();
    } catch {
      // BroadcastChannel unsupported - ignore
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("notifications:updated", onLocalUpdate);
      if (bc) bc.close();
    };
  }, []);

  /** Close dropdowns when clicking outside */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // close account dropdown if click is outside it
      if (accountRef.current && !accountRef.current.contains(target)) {
        setMenuOpen(false);
      }
      // close notifications dropdown if click is outside it
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /** When opening notifications dropdown, you may want to mark them as read automatically.
   *  If you prefer manual control, comment this effect and leave the "Mark all as read" button only.
   */
  useEffect(() => {
    if (!notifOpen) return;

    // Optional: comment this block if you don't want auto-mark-as-read on open
    const stored: StoredNotification[] = JSON.parse(
      localStorage.getItem("notifications") || "[]"
    );
    const updated = stored.map((n) => ({ ...n, read: true }));
    localStorage.setItem("notifications", JSON.stringify(updated));

    // Emit events so other parts (Navbar, other tabs) sync immediately
    const unread = 0;
    window.dispatchEvent(
      new CustomEvent("notifications:updated", { detail: { unread } })
    );
    try {
      const bc = new BroadcastChannel("lynkr_notifications");
      bc.postMessage({ unread });
      bc.close();
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("storage"));
    // Refresh local state
    hydrateNotifications();
  }, [notifOpen]);

  /** Manually mark all as read (if you keep auto-read off) */
  const markAllAsRead = () => {
    const stored: StoredNotification[] = JSON.parse(
      localStorage.getItem("notifications") || "[]"
    );
    const updated = stored.map((n) => ({ ...n, read: true }));
    localStorage.setItem("notifications", JSON.stringify(updated));
    const unread = 0;
    window.dispatchEvent(
      new CustomEvent("notifications:updated", { detail: { unread } })
    );
    try {
      const bc = new BroadcastChannel("lynkr_notifications");
      bc.postMessage({ unread });
      bc.close();
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("storage"));
    hydrateNotifications();
  };

  /** Mobile menu toggle */
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  /** Logout handler */
  const onLogout = () => {
    setIsLoggedIn(false);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className={`navbar ${darkMode ? "dark" : "light"}`}>
      {/* Left Section - Logo */}
      <div className="nav-left">
        <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          Lynkr
        </Link>
      </div>

      {/* Mobile Hamburger */}
      <button className="hamburger" onClick={toggleMobileMenu}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {/* Center Icons */}
        <div className="nav-center">
          <span className={`tooltip-container ${darkMode ? "dark" : "light"}`}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <FaHome />
            </Link>
            <span className="tooltip-text">{t("Navbar.Home")}</span>
          </span>

          <span className={`tooltip-container ${darkMode ? "dark" : "light"}`}>
            <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
              <FaFacebookMessenger />
            </Link>
            <span className="tooltip-text">{t("Navbar.Messages")}</span>
          </span>

          {/* Notifications */}
          <span
            className={`tooltip-container ${
              darkMode ? "dark" : "light"
            } notification-bell`}
            ref={notifRef}
          >
            <button
              type="button"
              className="icon-link notif-trigger"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              title={t("Navbar.Notifications")}
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((o) => !o);
                setMenuOpen(false);
              }}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className={`badge ${badgeBump ? "badge-bump" : ""}`}>
                  <span>{unreadCount}</span>
                </span>
              )}
            </button>

            {/* Dropdown */}
            {notifOpen && (
              <div className="dropdown notif-dropdown" role="menu">
                <div className="dropdown-header">
                  <strong>{t("Navbar.Notifications")}</strong>
                  <button className="link-btn" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                </div>

                {lastTen.length === 0 ? (
                  <div className="empty-state">No notifications</div>
                ) : (
                  <ul className="notif-list">
                    {lastTen.map((n) => (
                      <li key={n.id} className={`notif-item ${n.type}`}>
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-meta">
                          <span className="dot" />
                          <span className="time">{n.createdAt}</span>
                          {!n.read && <span className="chip">NEW</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="dropdown-footer">
                  <button
                    className="link-btn"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                  >
                    View all
                  </button>
                </div>
              </div>
            )}
            <span className="tooltip-text">{t("Navbar.Notifications")}</span>
          </span>
        </div>

        {/* Search */}
        <div className="nav-search">
          <input
            type="text"
            placeholder={t("Navbar.SearchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>

        {/* Right Section */}
        <div className="nav-right">
          <button className="dark-toggle" onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="lang-toggle" onClick={toggleLanguage}>
            <FaGlobe /> {i18n.language.toUpperCase()}
          </button>

          {isLoggedIn ? (
            <div className="account-wrapper" ref={accountRef}>
              <button
                className="account-trigger"
                onClick={() => {
                  setMenuOpen((o) => !o);
                  setNotifOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={t("Navbar.Account")}
              >
                {displayName || t("Navbar.Account")}
              </button>

              {menuOpen && (
                <div className="dropdown">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="dropdown-item"
                  >
                    {t("Navbar.Profile")}
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="dropdown-item"
                  >
                    {t("Navbar.Settings")}
                  </Link>
                  <button onClick={onLogout} className="dropdown-item">
                    {t("Navbar.Logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn-login" onClick={() => navigate("/login")}>
                {t("Login.LoginButton")}
              </button>
              <button
                className="btn-register"
                onClick={() => navigate("/register")}
              >
                {t("Register.Register")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
