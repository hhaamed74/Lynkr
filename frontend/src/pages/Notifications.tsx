import { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useToasts } from "../hooks/useToasts";
import type { ToastItem } from "../hooks/useToasts";
import "../styles/layout/_notifications.scss";

interface Notification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { toasts, showToast } = useToasts();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔁 helper آمن للتحميل من localStorage
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
    // أول تحميل
    setNotifications(loadFromStorage());

    // ✅ لو في تحديثات جاية من تاب/كومبوننت تانية
    const refresh = () => setNotifications(loadFromStorage());

    // storage (يفيد بين التابات وبعض السيناريوهات)
    window.addEventListener("storage", refresh);

    // حدث مخصص من نفس التاب (بيتعمل dispatch من saveNotifications/pushNotification)
    const onLocalUpdate = () => refresh();
    window.addEventListener(
      "notifications:updated",
      onLocalUpdate as EventListener
    );

    // BroadcastChannel لمزامنة فورية بين التابات
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lynkr_notifications");
      bc.onmessage = () => refresh();
    } catch {
      // ممكن المتصفح ما يدعمهوش — عادي
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

  // ✅ احفظ + بثّ إشعارات التحديث (محلي + بين التابات) + fallback
  const saveNotifications = (data: Notification[]) => {
    setNotifications(data);
    localStorage.setItem("notifications", JSON.stringify(data));

    const unread = data.filter((n) => !n.read).length;

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
  };

  const markAsRead = (id: number) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    showToast("Marked as read ✅");
  };

  const clearAll = () => {
    saveNotifications([]);
    showToast("All notifications cleared 🗑️");
  };

  return (
    <div className={`notifications-page ${darkMode ? "dark" : "light"}`}>
      <h2>Notifications</h2>

      {notifications.length === 0 ? (
        <p className="empty">No notifications</p>
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
                    <button onClick={() => markAsRead(n.id)}>Mark Read</button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="actions">
            <button onClick={clearAll}>Clear All</button>
          </div>
        </>
      )}

      {/* Toasts Display */}
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
