import { useEffect, useMemo, useRef, useState } from "react";
import { subscribeToToasts, type ToastMessage } from "../../services/toast";

const VARIANT_STYLES: Record<ToastMessage["variant"], string> = {
  info: "bg-[color:var(--sf-surface)] border-[color:var(--sf-border)] text-[color:var(--sf-text)]",
  success: "bg-green-900/60 border-green-400/60 text-green-50",
  error: "bg-red-900/60 border-red-400/60 text-red-50",
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutRef = useRef(new Map<string, number>());

  const removeToast = useMemo(
    () => (id: string) => {
      const timeoutId = timeoutRef.current.get(id);
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [],
  );

  useEffect(() => {
    const timeouts = timeoutRef.current;
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
      const timeoutId = window.setTimeout(() => {
        removeToast(toast.id);
      }, 3500);
      timeouts.set(toast.id, timeoutId);
    });

    return () => {
      unsubscribe();
      for (const timeoutId of timeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      timeouts.clear();
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur ${VARIANT_STYLES[toast.variant]}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              removeToast(toast.id);
            }
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-snug">{toast.message}</div>
            <button
              type="button"
              className="shrink-0 rounded-md border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-2 py-1 text-xs font-semibold text-[color:var(--sf-text)] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-primary)]"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
