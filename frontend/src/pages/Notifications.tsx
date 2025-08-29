import { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useToasts } from "../hooks/useToasts";
import type { ToastItem } from "../hooks/useToasts";
import "../styles/layout/_notifications.scss";
import { useTranslation } from "react-i18next";

interface Notification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const { toasts, showToast } = useToasts();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Safely load notifications from localStorage
  const loadFromStorage = (): Notification[] => {
    try {
      return JSON.parse(
        localStorage.getItem("notifications") || "[]"
      ) as Notification[];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    // Initial load
    setNotifications(loadFromStorage());

    const refresh = () => setNotifications(loadFromStorage());

    // Sync updates between tabs and components
    window.addEventListener("storage", refresh);

    // Custom event for same-tab updates
    const onLocalUpdate = () => refresh();
    window.addEventListener(
      "notifications:updated",
      onLocalUpdate as EventListener
    );

    // BroadcastChannel for real-time cross-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lynkr_notifications");
      bc.onmessage = () => refresh();
    } catch {
      // ignore if not supported
    }

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(
        "notifications:updated",
        onLocalUpdate as EventListener
      );
      if (bc) bc.close();
    };
  }, []);

  // Save notifications and broadcast updates (local + cross-tab)
  const saveNotifications = (data: Notification[]) => {
    setNotifications(data);
    localStorage.setItem("notifications", JSON.stringify(data));

    const unread = data.filter((n) => !n.read).length;

    // Custom event for local components
    window.dispatchEvent(
      new CustomEvent("notifications:updated", { detail: { unread } })
    );

    // BroadcastChannel for other tabs
    try {
      const bc = new BroadcastChannel("lynkr_notifications");
      bc.postMessage({ unread });
      bc.close();
    } catch {
      // ignore
    }

    // Fallback sync event
    window.dispatchEvent(new Event("storage"));
  };

  // Mark a specific notification as read
  const markAsRead = (id: number) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    showToast(t("Notifications.MarkedAsRead", "Marked as read ✅"));
  };

  // Clear all notifications
  const clearAll = () => {
    saveNotifications([]);
    showToast(t("Notifications.ClearedAll", "All notifications cleared 🗑️"));
  };

  return (
    <div className={`notifications-page ${darkMode ? "dark" : "light"}`}>
      <h2>{t("Notifications.Title", "Notifications")}</h2>

      {notifications.length === 0 ? (
        <p className="empty">{t("Notifications.Empty", "No notifications")}</p>
      ) : (
        <>
          <ul className="notifications-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${n.type} ${
                  n.read ? "read" : "unread"
                }`}
              >
                <div className="message">{n.message}</div>
                <div className="meta">
                  <span className="time">{n.createdAt}</span>
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id)}>
                      {t("Notifications.MarkRead", "Mark Read")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="actions">
            <button onClick={clearAll}>
              {t("Notifications.ClearAll", "Clear All")}
            </button>
          </div>
        </>
      )}

      {/* Toasts container */}
      <div className="toast-container">
        {toasts.map((t: ToastItem) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
