import { useEffect, useState } from "react";
import { subscribeToToasts, type ToastMessage } from "../../services/toast";

const VARIANT_STYLES: Record<ToastMessage["variant"], string> = {
  info: "bg-white/10 border-blue-400/40 text-blue-100",
  success: "bg-green-900/60 border-green-400/60 text-green-50",
  error: "bg-red-900/60 border-red-400/60 text-red-50",
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`rounded-lg border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur ${VARIANT_STYLES[toast.variant]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
