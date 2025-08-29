// hooks/useToasts.ts
import { useState, useRef } from "react";

export type ToastItem = { id: number; message: string };

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = (message: string, ttl = 2000) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl);
  };

  return { toasts, showToast };
};
