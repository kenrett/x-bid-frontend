import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { activityApi } from "../api/activityApi";
import type {
  ActivityFilter,
  ActivityItem,
  ActivityKind,
} from "../types/activity";
import { Page } from "@components/Page";
import { parseApiError } from "@utils/apiError";
import { useAuth } from "@features/auth/hooks/useAuth";

const FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Bids", value: "bid" },
  { label: "Watches", value: "watch" },
  { label: "Outcomes", value: "outcome" },
  { label: "Fulfillment", value: "fulfillment" },
];

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const kindIcon = (kind: ActivityKind, outcome?: "won" | "lost") => {
  if (kind === "bid") return "🎯";
  if (kind === "watch") return "👀";
  if (kind === "fulfillment") return "📦";
  if (outcome === "won") return "🏆";
  if (outcome === "lost") return "❌";
  // Fallback for ActivityKind "unknown" (or any non-outcome item without a match).
  return "📜";
};

const pillStyles = (active: boolean) =>
  `px-3 py-1 rounded-full text-sm font-semibold transition-colors border ${
    active
      ? "bg-white/20 text-white border-white/40"
      : "bg-white/5 text-gray-200 border-white/10 hover:bg-white/10"
  }`;

const EmptyState = () => (
  <div className="text-center text-gray-400 py-10">
    <p className="text-lg font-semibold text-white mb-2">No activity yet</p>
    <p className="text-sm">
      Your bids, watches, and outcomes will appear here.
    </p>
  </div>
);

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const detail: ReactNode = (() => {
    if (item.kind === "bid") {
      const delta = item.balanceDelta;
      const sign = delta <= 0 ? "-" : "+";
      const abs = Math.abs(delta);
      const formatted = abs.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `Bid: ${sign}${formatted} credit${abs === 1 ? "" : "s"}`;
    }
    if (item.kind === "watch") {
      return null;
    }
    if (item.kind === "outcome") {
      return item.outcome === "won"
        ? `Winning bid: ${item.finalBid ?? "—"}`
        : "Auction ended";
    }
    if (item.kind === "fulfillment") {
      if (item.fromStatus && item.toStatus) {
        return `Fulfillment: ${item.fromStatus} → ${item.toStatus}`;
      }
      if (item.toStatus) return `Fulfillment: ${item.toStatus}`;
      if (item.status) return `Fulfillment: ${item.status}`;
      return "Fulfillment update";
    }
    return "Activity update";
  })();

  const label =
    item.kind === "bid"
      ? "Bid placed"
      : item.kind === "watch"
        ? item.action === "removed"
          ? "Stopped watching"
          : "Watching"
        : item.kind === "outcome"
          ? item.outcome === "won"
            ? "Won"
            : "Lost"
          : item.kind === "fulfillment"
            ? "Fulfillment update"
            : // Fallback label for kind "unknown".
              "Activity";

  const icon =
    item.kind === "watch" && item.action === "removed"
      ? "🙈"
      : kindIcon(item.kind, item.kind === "outcome" ? item.outcome : undefined);

  const primaryLinkTo =
    item.kind === "fulfillment"
      ? `/account/wins/${item.auctionId}`
      : `/auctions/${item.auctionId}`;

  return (
    <li className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="text-lg" aria-hidden>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{label}</span>
          </div>
          <span className="text-xs text-gray-400">
            {formatDate(item.occurredAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          {item.auctionId > 0 ? (
            <Link
              to={primaryLinkTo}
              className="text-sm text-pink-200 hover:text-pink-100 underline underline-offset-2"
            >
              {item.auctionTitle}
            </Link>
          ) : (
            <span className="text-sm text-gray-200">{item.auctionTitle}</span>
          )}
          {detail ? (
            <span className="text-xs text-gray-300">
              {detail}
              {item.kind === "fulfillment" && item.trackingUrl ? (
                <>
                  {" "}
                  <a
                    href={item.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-pink-200 hover:text-pink-100 underline underline-offset-2"
                  >
                    Tracking
                  </a>
                </>
              ) : null}
            </span>
          ) : item.kind === "fulfillment" && item.trackingUrl ? (
            <a
              href={item.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-pink-200 hover:text-pink-100 underline underline-offset-2"
            >
              Tracking
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
};

export const ActivityPage = () => {
  const { user, isReady } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !user) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await activityApi.list({ page: 1, perPage: 25 });
        setItems(data.items);
      } catch (err) {
        const parsed = parseApiError(err);
        setError(parsed.message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [isReady, user?.id]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  if (!isReady)
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading activity...</p>
      </Page>
    );
  if (!user)
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Sign in to view your activity.</p>
      </Page>
    );

  return (
    <Page>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Vault
            </p>
            <h1 className="text-3xl font-serif font-bold text-white">
              My Activity
            </h1>
            <p className="text-sm text-gray-400">
              Latest bids, watches, and auction outcomes.
            </p>
          </div>
          <div className="flex gap-2">
            {FILTERS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setFilter(pill.value)}
                className={pillStyles(filter === pill.value)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg shadow-black/10">
          <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Feed</h2>
            <span className="text-xs text-gray-400">
              {isLoading
                ? "Loading..."
                : `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <ul className="divide-y divide-white/10">
            {isLoading ? (
              <li className="px-4 py-6 text-center text-gray-400">
                Loading activity...
              </li>
            ) : error ? (
              <li className="px-4 py-6 text-center text-red-200">
                {error}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      void activityApi
                        .list({ page: 1, perPage: 25 })
                        .then((data) => setItems(data.items))
                        .catch((err) => setError(parseApiError(err).message))
                        .finally(() => setIsLoading(false));
                    }}
                    className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </li>
            ) : filteredItems.length === 0 ? (
              <li className="px-4 py-6">
                <EmptyState />
              </li>
            ) : (
              filteredItems.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))
            )}
          </ul>
        </div>
      </div>
    </Page>
  );
};
