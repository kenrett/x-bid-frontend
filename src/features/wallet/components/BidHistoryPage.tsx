import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";
import { walletApi } from "../api/walletApi";
import type { WalletSummary, WalletTransaction } from "../types/wallet";
import { StorefrontBadge } from "@components/StorefrontBadge";
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

type TxDirection = "credit" | "debit" | "unknown";

const normalizeKindKey = (kind: string | null | undefined) =>
  (kind ?? "").trim().toLowerCase();

const kindPresentation = (
  kind: string | null | undefined,
): { label: string; direction: TxDirection } => {
  const key = normalizeKindKey(kind);
  if (!key) return { label: "Transaction", direction: "unknown" };

  const known: Record<string, { label: string; direction: TxDirection }> = {
    bid_placed: { label: "Bid placed", direction: "debit" },
    bid_spent: { label: "Bid placed", direction: "debit" },
    debit: { label: "Debit", direction: "debit" },
    bid_pack_purchase: { label: "Bid pack purchase", direction: "credit" },
    bid_pack_purchased: { label: "Bid pack purchase", direction: "credit" },
    credit: { label: "Credit", direction: "credit" },
    admin_adjustment: { label: "Admin adjustment", direction: "unknown" },
    admin_adjustment_credit: { label: "Admin adjustment", direction: "credit" },
    admin_adjustment_debit: { label: "Admin adjustment", direction: "debit" },
  };

  const hit = known[key];
  if (hit) return hit;

  const fallbackLabel = key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { label: fallbackLabel, direction: "unknown" };
};

const signedAmountForKind = (amount: number, direction: TxDirection) => {
  if (!Number.isFinite(amount)) return 0;
  if (direction === "credit") return Math.abs(amount);
  if (direction === "debit") return -Math.abs(amount);
  return amount;
};

const SummarySkeleton = () => (
  <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-[var(--sf-radius)] p-6 shadow-[var(--sf-shadow)] animate-pulse">
    <div className="h-4 w-32 bg-black/5 rounded mb-3" />
    <div className="h-9 w-48 bg-black/10 rounded mb-2" />
    <div className="h-3 w-40 bg-black/5 rounded" />
  </div>
);

const TableSkeleton = () => (
  <tbody className="divide-y divide-[color:var(--sf-border)]">
    {Array.from({ length: 4 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="h-3 w-24 bg-black/5 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-20 bg-black/5 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-20 bg-black/5 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-16 bg-black/5 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-32 bg-black/5 rounded" />
        </td>
        <td className="px-4 py-3">
          <div className="h-3 w-28 bg-black/5 rounded" />
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

  if (links.length === 0)
    return <span className="text-[color:var(--sf-mutedText)]">—</span>;

  return (
    <div className="flex gap-3">
      {links.map((link) =>
        isExternalLink(link.href) ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--sf-primary)] hover:brightness-95 underline underline-offset-2"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            to={link.href}
            className="text-[color:var(--sf-primary)] hover:brightness-95 underline underline-offset-2"
          >
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
};

export const BidHistoryPage = () => {
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
        <p className="text-[color:var(--sf-mutedText)] text-lg">
          Loading your wallet...
        </p>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page centered>
        <h2 className="text-4xl font-bold mb-3 text-[color:var(--sf-text)]">
          Your Bid History Awaits
        </h2>
        <p className="mb-6 text-lg text-[color:var(--sf-mutedText)]">
          Sign in to see your credits and activity.
        </p>
        <Link
          to="/login?redirect=/account/wallet"
          className="inline-flex items-center justify-center text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90"
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
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--sf-mutedText)]">
            Account
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-[color:var(--sf-text)]">
                Bid History
              </h1>
              <p className="text-[color:var(--sf-mutedText)]">
                Track your credits balance and the activity behind every change.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/account/purchases"
                data-testid="wallet-purchases-link"
                className="text-sm font-semibold bg-[color:var(--sf-surface)] hover:brightness-95 border border-[color:var(--sf-border)] rounded-[var(--sf-radius)] px-4 py-2 text-[color:var(--sf-text)] transition"
              >
                Purchases
              </Link>
            </div>
          </div>
        </div>

        {error && !isLoading && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/30 text-red-100 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>{error}</span>
            <button
              onClick={() => void handleLoad()}
              className="self-start md:self-auto text-sm px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-[color:var(--sf-text)] hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <SummarySkeleton />
          ) : (
            <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-6 shadow-xl">
              <p className="text-sm text-[color:var(--sf-mutedText)] mb-2">
                Credits balance
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[color:var(--sf-text)]">
                  {balanceLabel ?? "—"}
                </span>
                {wallet?.currency && (
                  <span className="text-sm text-[color:var(--sf-mutedText)]">
                    {wallet.currency}
                  </span>
                )}
              </div>
              <p className="text-sm text-[color:var(--sf-mutedText)] mt-2">
                As of {formatDate(wallet?.asOf)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
              Transaction history
            </h3>
            <div className="text-xs text-[color:var(--sf-mutedText)]">
              Showing {transactions.length} entries
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-[color:var(--sf-border)] bg-black/20">
            <table className="min-w-full text-sm text-[color:var(--sf-mutedText)]">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-[color:var(--sf-mutedText)]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Storefront</th>
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
                      colSpan={6}
                      className="px-4 py-6 text-center text-[color:var(--sf-mutedText)]"
                    >
                      No transactions yet
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-white/10">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.04]">
                      {(() => {
                        const { label, direction } = kindPresentation(tx.kind);
                        const signedAmount = signedAmountForKind(
                          tx.amount,
                          direction,
                        );
                        return (
                          <>
                            <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                              {formatDate(tx.occurredAt)}
                            </td>
                            <td className="px-4 py-3">
                              <StorefrontBadge
                                storefrontKey={tx.storefrontKey}
                              />
                            </td>
                            <td className="px-4 py-3">{label}</td>
                            <td
                              className={`px-4 py-3 font-semibold ${
                                signedAmount >= 0
                                  ? "text-green-300"
                                  : "text-red-300"
                              }`}
                            >
                              {formatAmount(signedAmount)}
                            </td>
                            <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                              {tx.reason ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <LinksCell
                                purchaseUrl={tx.purchaseUrl}
                                auctionUrl={tx.auctionUrl}
                              />
                            </td>
                          </>
                        );
                      })()}
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
                className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-[color:var(--sf-text)] hover:bg-white/20 transition-colors disabled:opacity-60"
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
