import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { purchasesApi } from "../api/purchasesApi";
import type { PurchaseSummary } from "../types/purchase";
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

const StatusBadge = ({ status }: { status: PurchaseSummary["status"] }) => {
  const { label, styles } = useMemo(() => {
    if (status === "succeeded") {
      return {
        label: "Succeeded",
        styles: "bg-green-900 text-green-100 border border-green-300/40",
      };
    }
    if (status === "refunded") {
      return {
        label: "Refunded",
        styles: "bg-blue-900 text-blue-100 border border-blue-300/40",
      };
    }
    if (status === "pending") {
      return {
        label: "Pending",
        styles: "bg-amber-900 text-amber-100 border border-amber-300/40",
      };
    }
    return {
      label: "Failed",
      styles: "bg-red-900 text-red-100 border border-red-300/40",
    };
  }, [status]);

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles}`}
    >
      {label}
    </span>
  );
};

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

export const PurchasesListPage = () => {
  const { isReady, user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchasesApi.list();
      setPurchases(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setPurchases([]);
      setError(null);
      return;
    }
    void handleLoad();
  }, [handleLoad, isReady, user?.id]);

  const handleRowClick = (id: number) => {
    navigate(`/account/purchases/${id}`);
  };

  if (!isReady) {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading your purchases...</p>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-3 text-white">
          View your purchases
        </h2>
        <p className="mb-6 text-lg text-gray-400">
          Sign in to see your bid pack purchases and receipts.
        </p>
        <Link
          to="/login?redirect=/account/purchases"
          className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
        >
          Log In
        </Link>
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
            Purchases
          </h1>
          <p className="text-gray-400">
            Review your bid pack purchases and receipts.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/40 bg-red-900/30 p-4 text-red-100">
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold">
                We couldn&apos;t load your purchases: {error}
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
            <h2 className="text-lg font-semibold text-white">
              Purchase history
            </h2>
            <p className="text-sm text-gray-400">
              {isLoading
                ? "Loading..."
                : `${purchases.length} purchase${purchases.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Bid pack</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton />
              ) : purchases.length === 0 ? (
                <tbody>
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-400"
                      colSpan={5}
                    >
                      No purchases yet.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-white/10">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-white/[0.04] cursor-pointer"
                      onClick={() => handleRowClick(purchase.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(purchase.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {purchase.bidPackName || (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {purchase.credits !== null &&
                        purchase.credits !== undefined
                          ? `${purchase.credits.toLocaleString()} credits`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(purchase.amount, purchase.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={purchase.status} />
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
