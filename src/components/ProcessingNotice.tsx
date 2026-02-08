import { type ReactNode } from "react";

type ProcessingNoticeProps = {
  title?: string;
  message?: ReactNode;
  hint?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export const ProcessingNotice = ({
  title = "Still processing",
  message = "This can take a little longer than usual.",
  hint = "You can refresh in a moment or try again later.",
  actionLabel = "Refresh",
  onAction,
}: ProcessingNoticeProps) => {
  return (
    <div className="rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-5 py-4 text-center shadow-[var(--sf-shadow)] space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--sf-primary)]">
        {title}
      </p>
      <p className="text-lg text-[color:var(--sf-text)]">{message}</p>
      <p className="text-sm text-[color:var(--sf-mutedText)]">{hint}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center text-sm bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-4 py-2 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
