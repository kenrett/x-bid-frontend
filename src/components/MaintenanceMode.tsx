import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { Page } from "./Page";
import { getPublicMaintenance } from "@features/admin/api/maintenance";

export const MaintenanceMode = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      try {
        const state = await getPublicMaintenance();
        if (!state.enabled && !cancelled) {
          navigate("/auctions", { replace: true });
        }
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 401 || err.response?.status === 404)
        ) {
          // If we’re unauthorized to check or the endpoint is unavailable, assume maintenance is off.
          navigate("/auctions", { replace: true });
          return;
        }
      }
    };

    void checkStatus();
    const interval = window.setInterval(checkStatus, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [navigate]);

  return (
    <Page centered>
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--sf-border)] bg-gradient-to-br from-[color:var(--sf-surface)] via-[color:var(--sf-background)] to-[color:var(--sf-surface)] px-6 py-12 shadow-[var(--sf-shadow)] max-w-3xl mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_35%)] pointer-events-none" />
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--sf-primary)]">
            Maintenance
          </div>
          <h1 className="font-serif text-4xl font-black leading-tight text-[color:var(--sf-text)] drop-shadow-sm sm:text-5xl">
            A little backstage action is happening right now.
          </h1>
          <p className="text-base sm:text-lg text-[color:var(--sf-mutedText)] max-w-2xl mx-auto">
            We’re tuning up the auction floor—tightening bolts, smoothing edges,
            and getting everything ready to run even more beautifully. Your bids
            and account are safe. Come back in a few and slip back into the fun.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-[var(--sf-radius)] bg-[color:var(--sf-primary)] px-6 py-3 text-sm font-semibold text-[color:var(--sf-onPrimary)] shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90"
            >
              Retry now
            </Link>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center justify-center rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-6 py-3 text-sm font-semibold text-[color:var(--sf-text)] transition hover:brightness-95"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
};
