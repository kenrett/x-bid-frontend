import { useEffect, useRef, useState } from "react";

type TypedConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  phrase: string;
  inputLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const TypedConfirmModal = ({
  open,
  title,
  description,
  phrase,
  inputLabel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: TypedConfirmModalProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useRef(
    `typed-confirm-title-${Math.random().toString(36).slice(2)}`,
  );
  const descriptionId = useRef(
    `typed-confirm-desc-${Math.random().toString(36).slice(2)}`,
  );
  const instructionId = useRef(
    `typed-confirm-instruction-${Math.random().toString(36).slice(2)}`,
  );

  const matches = value.trim() === phrase;

  useEffect(() => {
    if (!open) return;
    setValue("");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={`${description ? descriptionId.current : ""} ${instructionId.current}`.trim()}
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
        <div className="mt-5 space-y-2">
          <label
            className="block text-sm font-semibold"
            htmlFor="typed-confirm"
          >
            {inputLabel ?? `Type ${phrase} to confirm`}
          </label>
          <input
            id="typed-confirm"
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={phrase}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-pink-500/40"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              if (!matches) return;
              event.preventDefault();
              onConfirm();
            }}
          />
          <p id={instructionId.current} className="text-xs text-gray-400">
            This action cannot be undone.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!matches}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
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
