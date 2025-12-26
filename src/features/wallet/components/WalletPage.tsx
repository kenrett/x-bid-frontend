import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { walletApi } from "../api/walletApi";
import type { WalletSummary, WalletTransaction } from "../types/wallet";
import {
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";

const DEFAULT_PAGE_SIZE = 25;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatAmount = (amount: number) => {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${Math.abs(amount).toFixed(2)} credits`;
};

const SummarySkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl animate-pulse">
    <div className="h-4 w-32 bg-white/10 rounded mb-3" />
    <div className="h-9 w-48 bg-white/20 rounded mb-2" />
    <div className="h-3 w-40 bg-white/10 rounded" />
  </div>
);

const TableSkeleton = () => (
  <tbody className="divide-y divide-white/10">
    {Array.from({ length: 4 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="h-3 w-24 bg-white/10 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-20 bg-white/10 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-16 bg-white/10 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-32 bg-white/10 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-28 bg-white/10 rounded" />
        </td>
      </tr>
    ))}
  </tbody>
);

const isExternalLink = (href: string) => /^https?:\/\//i.test(href);

const LinksCell = ({
  purchaseUrl,
  auctionUrl,
}: {
  purchaseUrl?: string | null;
  auctionUrl?: string | null;
}) => {
  const links = [
    purchaseUrl
      ? {
          href: purchaseUrl,
          label: "Purchase",
        }
      : null,
    auctionUrl
      ? {
          href: auctionUrl,
          label: "Auction",
        }
      : null,
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return <span className="text-gray-500">—</span>;

  return (
    <div className="flex gap-3">
      {links.map((link) =>
        isExternalLink(link.href) ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-pink-200 hover:text-pink-100 underline underline-offset-2"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            to={link.href}
            className="text-pink-200 hover:text-pink-100 underline underline-offset-2"
          >
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
};

export const WalletPage = () => {
  const { user, isReady, updateUserBalance } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pageInfo, setPageInfo] = useState<{
    page: number;
    perPage: number;
    hasMore: boolean;
  }>({ page: 1, perPage: DEFAULT_PAGE_SIZE, hasMore: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summary, txPage] = await Promise.all([
        walletApi.getWallet(),
        walletApi.listTransactions({
          page: 1,
          perPage: DEFAULT_PAGE_SIZE,
        }),
      ]);

      setWallet(summary);
      updateUserBalance(summary.creditsBalance);
      setTransactions(txPage.transactions);
      setPageInfo({
        page: txPage.page ?? 1,
        perPage: txPage.perPage ?? DEFAULT_PAGE_SIZE,
        hasMore: txPage.hasMore,
      });
    } catch (err) {
      const friendlyMessage =
        err instanceof UnexpectedResponseError
          ? UNEXPECTED_RESPONSE_MESSAGE
          : "We couldn't load your wallet right now. Please try again.";
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, [updateUserBalance]);

  useEffect(() => {
    if (!isReady) return;
    const userId = user?.id;
    if (!userId) {
      setWallet(null);
      setTransactions([]);
      setPageInfo({ page: 1, perPage: DEFAULT_PAGE_SIZE, hasMore: false });
      setError(null);
      return;
    }
    void handleLoad();
  }, [isReady, user?.id, handleLoad]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !pageInfo.hasMore) return;
    const nextPage = pageInfo.page + 1;
    setIsLoadingMore(true);
    setError(null);
    try {
      const next = await walletApi.listTransactions({
        page: nextPage,
        perPage: pageInfo.perPage,
      });
      setTransactions((prev) => [...prev, ...next.transactions]);
      setPageInfo({
        page: next.page ?? nextPage,
        perPage: next.perPage ?? pageInfo.perPage,
        hasMore: next.hasMore,
      });
    } catch (err) {
      const friendlyMessage =
        err instanceof UnexpectedResponseError
          ? UNEXPECTED_RESPONSE_MESSAGE
          : "We couldn't load more transactions. Please try again.";
      setError(friendlyMessage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const balanceLabel = useMemo(() => {
    if (!wallet) return null;
    const formatted = wallet.creditsBalance.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${formatted} credits`;
  }, [wallet]);

  if (!isReady) {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading your wallet...</p>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-3 text-white">
          Your Wallet Awaits
        </h2>
        <p className="mb-6 text-lg text-gray-400">
          Sign in to see your credits and activity.
        </p>
        <Link
          to="/login?redirect=/account/wallet"
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
          <h1 className="font-serif text-4xl font-bold text-white">Wallet</h1>
          <p className="text-gray-400">
            Track your credits balance and the activity behind every change.
          </p>
        </div>

        {error && !isLoading && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/30 text-red-100 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>{error}</span>
            <button
              onClick={() => void handleLoad()}
              className="self-start md:self-auto text-sm px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <SummarySkeleton />
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <p className="text-sm text-gray-400 mb-2">Credits balance</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                  {balanceLabel ?? "—"}
                </span>
                {wallet?.currency && (
                  <span className="text-sm text-gray-400">
                    {wallet.currency}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                As of {formatDate(wallet?.asOf)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-white">
              Transaction history
            </h3>
            <div className="text-xs text-gray-400">
              Showing {transactions.length} entries
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Links</th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton />
              ) : transactions.length === 0 ? (
                <tbody>
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      No transactions yet
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-white/10">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-gray-200">
                        {formatDate(tx.occurredAt)}
                      </td>
                      <td className="px-4 py-3 capitalize">{tx.kind}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${
                          tx.amount >= 0 ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {tx.reason ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <LinksCell
                          purchaseUrl={tx.purchaseUrl}
                          auctionUrl={tx.auctionUrl}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
          {pageInfo.hasMore && !isLoading && (
            <div className="flex justify-center">
              <button
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
                className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-60"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
