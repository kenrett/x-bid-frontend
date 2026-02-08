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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
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
    setValue("");
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
    (inputRef.current ?? focusables[0] ?? dialogRef.current)?.focus();
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
      aria-describedby={`${description ? descriptionId.current : ""} ${instructionId.current}`.trim()}
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
            className="w-full rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-3 text-[color:var(--sf-text)] placeholder:text-[color:var(--sf-mutedText)] outline-none transition focus:ring-2 focus:ring-[color:var(--sf-primary)]/40"
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
          <p
            id={instructionId.current}
            className="text-xs text-[color:var(--sf-mutedText)]"
          >
            This action cannot be undone.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!matches}
            onClick={onConfirm}
            className={`rounded-[var(--sf-radius)] px-4 py-2 text-sm font-semibold shadow-[var(--sf-shadow)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] ${
              danger
                ? "border border-red-400/40 bg-red-900/30 text-red-100 hover:bg-red-900/40"
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
