import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Page } from "@components/Page";
import { LoadingScreen } from "@components/LoadingScreen";
import { useAuth } from "@features/auth/hooks/useAuth";
import { winsApi } from "../api/winsApi";
import type { WinDetail, WinFulfillmentStatus } from "../types/win";
import { parseApiError } from "@utils/apiError";

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatMoney = (amount: number, currency: string | null) => {
  if (currency && currency.length === 3) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount);
    } catch {
      // ignore invalid currency codes and fall back
    }
  }
  return `$${amount.toFixed(2)}`;
};

const statusMeta = (status: WinFulfillmentStatus) => {
  if (status === "unclaimed") {
    return {
      label: "Unclaimed",
      styles: "bg-amber-900 text-amber-100 border border-amber-300/40",
      action: "Claim prize",
    };
  }
  if (status === "claimed") {
    return {
      label: "Claimed",
      styles: "bg-blue-900 text-blue-100 border border-blue-300/40",
      action: "View auction",
    };
  }
  if (status === "processing") {
    return {
      label: "Processing",
      styles: "bg-purple-900 text-purple-100 border border-purple-300/40",
      action: "View auction",
    };
  }
  if (status === "shipped") {
    return {
      label: "Shipped",
      styles: "bg-sky-900 text-sky-100 border border-sky-300/40",
      action: "View auction",
    };
  }
  if (status === "delivered") {
    return {
      label: "Delivered",
      styles: "bg-green-900 text-green-100 border border-green-300/40",
      action: "View auction",
    };
  }
  if (status === "fulfilled") {
    return {
      label: "Fulfilled",
      styles: "bg-green-900 text-green-100 border border-green-300/40",
      action: "View auction",
    };
  }
  if (status === "canceled" || status === "cancelled") {
    return {
      label: "Canceled",
      styles: "bg-red-900 text-red-100 border border-red-300/40",
      action: "View auction",
    };
  }
  return {
    label: "Unknown",
    styles: "bg-white/10 text-gray-200 border border-white/20",
    action: "View auction",
  };
};

const StatusBadge = ({ status }: { status: WinFulfillmentStatus }) => {
  const { label, styles } = useMemo(() => statusMeta(status), [status]);
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/10 space-y-1">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-sm text-white">{value || "—"}</div>
  </div>
);

export const WinDetailPage = () => {
  const { auction_id } = useParams<{ auction_id: string }>();
  const location = useLocation();
  const { isReady, user } = useAuth();
  const [win, setWin] = useState<WinDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginRedirect = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search,
      )}`,
    [location.pathname, location.search],
  );

  const handleLoad = useCallback(async () => {
    if (!auction_id) {
      setError("Invalid auction id.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await winsApi.get(auction_id);
      setWin(data);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.type === "not_found") {
        setError("Win not found.");
      } else if (parsed.type === "forbidden") {
        setError("You do not have access to this win.");
      } else {
        setError(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [auction_id]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setWin(null);
      setError(null);
      return;
    }
    void handleLoad();
  }, [handleLoad, isReady, user?.id]);

  if (!isReady) return <LoadingScreen item="win" />;

  if (!user) {
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-3 text-white">
          Sign in to view this win
        </h2>
        <p className="mb-6 text-lg text-gray-400">
          You need an account to view your won auctions.
        </p>
        <Link
          to={loginRedirect}
          className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
        >
          Log In
        </Link>
      </Page>
    );
  }

  if (isLoading && !win) return <LoadingScreen item="win" />;

  if (error && !win) {
    return (
      <Page centered>
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-lg text-red-200 font-semibold">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => void handleLoad()}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
            >
              Retry
            </button>
            <Link
              to="/account/wins"
              className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white transition-colors"
            >
              Back to wins
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  if (!win) return null;

  const meta = statusMeta(win.fulfillmentStatus);

  return (
    <Page>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              to="/account/wins"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Back to wins
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-400">
              Auction #{win.auctionId}
            </p>
            <h1 className="font-serif text-4xl font-bold text-white">
              {win.auctionTitle || "Won auction"}
            </h1>
            <p className="text-gray-400">Ended {formatDate(win.endedAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusBadge status={win.fulfillmentStatus} />
            <Link
              to={`/auctions/${win.auctionId}`}
              className="text-sm text-pink-200 hover:text-pink-100 underline underline-offset-2"
            >
              {meta.action}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryItem
            label="Final price"
            value={formatMoney(win.finalPrice, win.currency)}
          />
          <SummaryItem label="Ended" value={formatDate(win.endedAt)} />
          <SummaryItem label="Fulfillment" value={meta.label} />
        </div>

        {win.fulfillmentNote ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-2">
            <h3 className="text-lg font-semibold text-white">Notes</h3>
            <p className="text-sm text-gray-300">{win.fulfillmentNote}</p>
          </div>
        ) : null}
      </div>
    </Page>
  );
};
