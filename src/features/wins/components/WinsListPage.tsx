import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { winsApi } from "../api/winsApi";
import type { WinFulfillmentStatus, WinSummary } from "../types/win";
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
      // fall through if currency code is invalid
    }
  }
  return `$${amount.toFixed(2)}`;
};

const statusMeta = (status: WinFulfillmentStatus) => {
  if (status === "pending" || status === "unclaimed") {
    return {
      label: "Pending",
      styles: "bg-amber-900 text-amber-100 border border-amber-300/40",
    };
  }
  if (status === "claimed") {
    return {
      label: "Claimed",
      styles: "bg-blue-900 text-blue-100 border border-blue-300/40",
    };
  }
  if (status === "processing") {
    return {
      label: "Processing",
      styles: "bg-purple-900 text-purple-100 border border-purple-300/40",
    };
  }
  if (status === "shipped") {
    return {
      label: "Shipped",
      styles: "bg-sky-900 text-sky-100 border border-sky-300/40",
    };
  }
  if (status === "delivered") {
    return {
      label: "Delivered",
      styles: "bg-green-900 text-green-100 border border-green-300/40",
    };
  }
  if (status === "fulfilled") {
    return {
      label: "Fulfilled",
      styles: "bg-green-900 text-green-100 border border-green-300/40",
    };
  }
  if (status === "canceled" || status === "cancelled") {
    return {
      label: "Canceled",
      styles: "bg-red-900 text-red-100 border border-red-300/40",
    };
  }
  return {
    label: "Unknown",
    styles: "bg-white/10 text-gray-200 border border-white/20",
  };
};

const StatusBadge = ({ status }: { status: WinFulfillmentStatus }) => {
  const { label, styles } = useMemo(() => statusMeta(status), [status]);
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles}`}
    >
      {label}
    </span>
  );
};

const primaryActionLabel = (status: WinFulfillmentStatus) =>
  status === "pending" || status === "unclaimed"
    ? "Claim prize"
    : "View details";

const TableSkeleton = () => (
  <tbody className="divide-y divide-white/10">
    {Array.from({ length: 4 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        {Array.from({ length: 5 }).map((__, cellIdx) => (
          <td key={cellIdx} className="px-4 py-3">
            <div className="h-3 w-28 bg-white/10 rounded" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const WinsListPage = () => {
  const { isReady, user } = useAuth();
  const navigate = useNavigate();
  const [wins, setWins] = useState<WinSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await winsApi.list();
      setWins(data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setWins([]);
      setError(null);
      return;
    }
    void handleLoad();
  }, [handleLoad, isReady, user?.id]);

  if (!isReady) {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading your wins...</p>
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-pink-400">
            Account
          </p>
          <h1 className="font-serif text-4xl font-bold text-white">
            Won Auctions
          </h1>
          <p className="text-gray-400">
            Review your auction wins and fulfillment status.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/40 bg-red-900/30 p-4 text-red-100">
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold">
                We couldn&apos;t load your wins: {error}
              </p>
              <button
                onClick={() => void handleLoad()}
                className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Wins</h2>
            <p className="text-sm text-gray-400">
              {isLoading
                ? "Loading..."
                : `${wins.length} win${wins.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Ended</th>
                  <th className="px-4 py-3">Auction</th>
                  <th className="px-4 py-3">Final price</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton />
              ) : wins.length === 0 ? (
                <tbody>
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-400"
                      colSpan={5}
                    >
                      You haven’t won any auctions yet.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-white/10">
                  {wins.map((win) => (
                    <tr key={win.auctionId} className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(win.endedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <Link
                            to={`/auctions/${win.auctionId}`}
                            className="text-pink-200 hover:text-pink-100 underline underline-offset-2 font-semibold"
                          >
                            {win.auctionTitle}
                          </Link>
                          <span className="text-xs text-gray-400">
                            Auction #{win.auctionId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatMoney(win.finalPrice, win.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={win.fulfillmentStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            navigate(`/account/wins/${win.auctionId}`)
                          }
                          className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
                        >
                          {primaryActionLabel(win.fulfillmentStatus)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
};
