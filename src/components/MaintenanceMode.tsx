import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { Page } from "./Page";
import { getMaintenance } from "@/api/admin/maintenance";

export const MaintenanceMode = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      try {
        const state = await getMaintenance();
        if (!state.enabled && !cancelled) {
          navigate("/auctions", { replace: true });
        }
      } catch (err) {
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 404)) {
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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a102c] via-[#120b22] to-[#0b0818] px-6 py-12 shadow-2xl shadow-[#ff69b4]/10 max-w-3xl mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,105,180,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(160,32,240,0.12),transparent_35%)] pointer-events-none" />
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-200">
            Maintenance
          </div>
          <h1 className="font-serif text-4xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
            A little backstage action is happening right now.
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            We’re tuning up the auction floor—tightening bolts, smoothing edges, and getting everything ready to run even more beautifully.
            Your bids and account are safe. Come back in a few and slip back into the fun.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:scale-105"
            >
              Retry now
            </Link>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
};
