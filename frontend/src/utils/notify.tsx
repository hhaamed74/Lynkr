export interface Notification {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export const pushNotification = (
  message: string,
  type: Notification["type"] = "info"
) => {
  const stored = JSON.parse(
    localStorage.getItem("notifications") || "[]"
  ) as Notification[];

  const newNotification: Notification = {
    id: Date.now(),
    message,
    type,
    read: false,
    createdAt: new Date().toLocaleString(),
  };

  const updated = [newNotification, ...stored];
  localStorage.setItem("notifications", JSON.stringify(updated));

  // ✅ عدد غير المقروء
  const unread = updated.filter((n) => !n.read).length;

  // ✅ حدث محلي للتاب الحالي (Navbar بيسمعه)
  window.dispatchEvent(
    new CustomEvent("notifications:updated", { detail: { unread } })
  );

  // ✅ لو فاتح أكتر من تاب: مزامنة
  try {
    const bc = new BroadcastChannel("lynkr_notifications");
    bc.postMessage({ unread });
    bc.close();
  } catch {
    //ignore
  }

  // ✅ fallback
  window.dispatchEvent(new Event("storage"));
};
