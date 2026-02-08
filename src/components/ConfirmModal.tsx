import { useEffect, useRef } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useRef(
    `confirm-title-${Math.random().toString(36).slice(2)}`,
  );
  const descriptionId = useRef(
    `confirm-desc-${Math.random().toString(36).slice(2)}`,
  );

  const getFocusable = () => {
    const root = dialogRef.current;
    if (!root) return [];
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          "a[href]",
          "button:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex='-1'])",
        ].join(","),
      ),
    );
    return nodes.filter(
      (node) =>
        !node.hasAttribute("disabled") &&
        !node.hasAttribute("hidden") &&
        node.getAttribute("aria-hidden") !== "true",
    );
  };

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusable();
      if (focusables.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusables = getFocusable();
    (confirmRef.current ?? focusables[0] ?? dialogRef.current)?.focus();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const prev = previouslyFocusedRef.current;
      if (prev && document.contains(prev)) prev.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={description ? descriptionId.current : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close dialog"
        onClick={onCancel}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-6 shadow-[var(--sf-shadow)] outline-none"
      >
        <h3
          id={titleId.current}
          className="text-xl font-semibold text-[color:var(--sf-text)]"
        >
          {title}
        </h3>
        {description ? (
          <p
            id={descriptionId.current}
            className="mt-2 text-sm text-[color:var(--sf-mutedText)]"
          >
            {description}
          </p>
        ) : null}
        {danger ? (
          <div
            className="mt-3 rounded-lg border border-[color:var(--sf-status-warning-border)] bg-[color:var(--sf-status-warning-bg)] px-3 py-2 text-[color:var(--sf-status-warning-text)]"
            role="status"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
              Danger action
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-[var(--sf-radius)] px-4 py-2 text-sm font-semibold shadow-[var(--sf-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] ${
              danger
                ? "border border-[color:var(--sf-status-error-border)] bg-[color:var(--sf-status-error-bg)] text-[color:var(--sf-status-error-text)] hover:brightness-95"
                : "bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] hover:brightness-95 active:brightness-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
