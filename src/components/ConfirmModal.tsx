import { useEffect, useRef } from "react";

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
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useRef(
    `confirm-title-${Math.random().toString(36).slice(2)}`,
  );
  const descriptionId = useRef(
    `confirm-desc-${Math.random().toString(36).slice(2)}`,
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
        <h3 id={titleId.current} className="text-xl font-semibold text-white">
          {title}
        </h3>
        {description ? (
          <p id={descriptionId.current} className="mt-2 text-sm text-gray-300">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              danger
                ? "border border-red-400/40 bg-red-900/30 text-red-100 hover:bg-red-900/40"
                : "bg-[#ff69b4] text-[#1a0d2e] hover:bg-[#a020f0] hover:text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
