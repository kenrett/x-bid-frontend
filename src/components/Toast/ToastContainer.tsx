import { useEffect, useMemo, useRef, useState } from "react";
import { subscribeToToasts, type ToastMessage } from "../../services/toast";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const VARIANT_META: Record<
  ToastMessage["variant"],
  { style: string; label: string; Icon: typeof InformationCircleIcon }
> = {
  info: {
    style:
      "bg-[color:var(--sf-status-info-bg)] border-[color:var(--sf-status-info-border)] text-[color:var(--sf-status-info-text)]",
    label: "Info",
    Icon: InformationCircleIcon,
  },
  success: {
    style:
      "bg-[color:var(--sf-status-success-bg)] border-[color:var(--sf-status-success-border)] text-[color:var(--sf-status-success-text)]",
    label: "Success",
    Icon: CheckCircleIcon,
  },
  error: {
    style:
      "bg-[color:var(--sf-status-error-bg)] border-[color:var(--sf-status-error-border)] text-[color:var(--sf-status-error-text)]",
    label: "Error",
    Icon: XCircleIcon,
  },
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
      {toasts.map((toast) => {
        const { Icon, label, style } = VARIANT_META[toast.variant];
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={`rounded-lg border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur ${style}`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                removeToast(toast.id);
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="text-sm leading-snug">
                  <div className="text-[11px] font-semibold uppercase tracking-wide">
                    {label}
                  </div>
                  {toast.message}
                </div>
              </div>
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
        );
      })}
    </div>
  );
};
