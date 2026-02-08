import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getAuctions } from "@features/auctions/api/auctions";
import { deleteAuction, updateAuction } from "@features/admin/api/auctions";
import { showToast } from "@services/toast";
import { logAdminAction } from "@features/admin/api/adminAudit";
import type { AuctionSummary } from "@features/auctions/types/auction";
import {
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";

export const AdminAuctionsList = () => {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retiringId, setRetiringId] = useState<number | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    AuctionSummary["status"] | "all"
  >("all");
  const [startAfter, setStartAfter] = useState("");
  const [endBefore, setEndBefore] = useState("");
  const [sortKey, setSortKey] = useState<
    "start_date" | "end_time" | "current_price"
  >("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStartAfter("");
    setEndBefore("");
    setSortKey("start_date");
    setSortDir("asc");
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuctions();
      setAuctions(data);
    } catch (err) {
      setError(
        err instanceof UnexpectedResponseError
          ? UNEXPECTED_RESPONSE_MESSAGE
          : "Failed to load auctions.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  const handleRetire = async (auction: AuctionSummary) => {
    const label = auction.title ?? `Auction ${auction.id}`;
    const confirmed = window.confirm(
      `Retire "${label}"? This will set it inactive and block bidding.`,
    );
    if (!confirmed) return;

    try {
      setRetiringId(auction.id);
      await deleteAuction(auction.id);
      logAdminAction("auction.retire", { id: auction.id });
      showToast("Auction retired", "success");
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || "Failed to retire auction", "error");
    } finally {
      setRetiringId(null);
    }
  };

  const handleReactivate = async (auction: AuctionSummary) => {
    const label = auction.title ?? `Auction ${auction.id}`;
    const confirmed = window.confirm(
      `Reactivate "${label}"? It will return to active state immediately.`,
    );
    if (!confirmed) return;

    try {
      setReactivatingId(auction.id);
      await updateAuction(auction.id, { status: "active" });
      logAdminAction("auction.reactivate", { id: auction.id });
      showToast("Auction reactivated", "success");
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || "Failed to reactivate auction", "error");
    } finally {
      setReactivatingId(null);
    }
  };

  const handleStatusChange = async (
    auction: AuctionSummary,
    nextStatus: AuctionSummary["status"],
  ) => {
    const label = auction.title ?? `Auction ${auction.id}`;
    const confirmed = window.confirm(
      `Change status of "${label}" from ${auction.status} to ${nextStatus}? This affects bidders immediately.`,
    );
    if (!confirmed) return;

    try {
      await updateAuction(auction.id, { status: nextStatus });
      logAdminAction("auction.status_change", {
        id: auction.id,
        from: auction.status,
        to: nextStatus,
      });
      showToast(`Status set to ${nextStatus}`, "success");
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || "Failed to update status", "error");
    }
  };

  const statusBadge = useCallback((status: AuctionSummary["status"]) => {
    const styles: Record<AuctionSummary["status"], string> = {
      inactive: "bg-gray-700 text-[color:var(--sf-mutedText)]",
      scheduled: "bg-blue-900 text-blue-100",
      active: "bg-green-900 text-green-100",
      complete: "bg-purple-900 text-purple-100",
      cancelled: "bg-red-900 text-red-100",
    };
    const label =
      status === "scheduled"
        ? "Scheduled"
        : status === "complete"
          ? "Complete"
          : status === "inactive"
            ? "Inactive"
            : status === "cancelled"
              ? "Cancelled"
              : "Active";
    return (
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}
      >
        {label}
      </span>
    );
  }, []);

  const filteredAndSorted = useMemo(() => {
    const parsedStartAfter = startAfter ? new Date(startAfter) : null;
    const parsedEndBefore = endBefore ? new Date(endBefore) : null;

    const filtered = auctions.filter((auction) => {
      const matchesSearch = auction.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : auction.status === statusFilter;

      const starts = auction.start_date ? new Date(auction.start_date) : null;
      const ends = auction.end_time ? new Date(auction.end_time) : null;

      const withinStart =
        parsedStartAfter && starts ? starts >= parsedStartAfter : true;
      const withinEnd =
        parsedEndBefore && ends ? ends <= parsedEndBefore : true;

      return matchesSearch && matchesStatus && withinStart && withinEnd;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "current_price") {
        return (Number(a.current_price) - Number(b.current_price)) * dir;
      }
      const aDate = sortKey === "start_date" ? a.start_date : a.end_time;
      const bDate = sortKey === "start_date" ? b.start_date : b.end_time;
      const aTime = aDate ? new Date(aDate).getTime() : 0;
      const bTime = bDate ? new Date(bDate).getTime() : 0;
      return (aTime - bTime) * dir;
    });

    return sorted;
  }, [auctions, search, statusFilter, startAfter, endBefore, sortKey, sortDir]);
  const hasAuctions = useMemo(
    () => filteredAndSorted.length > 0,
    [filteredAndSorted],
  );
  const totalCount = auctions.length;
  const filteredCount = filteredAndSorted.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Auctions
          </p>
          <h2 className="text-2xl font-serif font-bold text-[color:var(--sf-text)]">
            Manage auctions
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchAuctions()}
            className="text-sm text-[color:var(--sf-mutedText)] bg-white/10 hover:bg-white/20 border border-[color:var(--sf-border)] rounded-lg px-3 py-2 transition-colors"
          >
            Refresh
          </button>
          <Link
            to="/admin/auctions/new"
            className="bg-pink-600 hover:bg-pink-700 text-[color:var(--sf-text)] px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            New Auction
          </Link>
        </div>
      </div>

      <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-[color:var(--sf-mutedText)]">
            <span className="font-semibold text-[color:var(--sf-text)]">
              {filteredCount}
            </span>
            <span>of</span>
            <span className="font-semibold text-[color:var(--sf-text)]">
              {totalCount}
            </span>
            <span>auctions</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-[color:var(--sf-mutedText)] bg-[color:var(--sf-surface)] hover:bg-white/10 border border-[color:var(--sf-border)] rounded-lg px-3 py-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title"
            className="rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                "all",
                "inactive",
                "scheduled",
                "active",
                "complete",
                "cancelled",
              ] as const
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  statusFilter === status
                    ? "bg-pink-600 border-pink-400 text-[color:var(--sf-text)]"
                    : "bg-[color:var(--sf-surface)] border-[color:var(--sf-border)] text-[color:var(--sf-mutedText)] hover:bg-white/10"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={startAfter}
            onChange={(e) => setStartAfter(e.target.value)}
            className="rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="Start after"
          />
          <input
            type="datetime-local"
            value={endBefore}
            onChange={(e) => setEndBefore(e.target.value)}
            className="rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="End before"
          />
        </div>
      </div>

      {loading && (
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Loading auctions...
        </p>
      )}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-4 text-red-100 flex items-center justify-between">
          <div className="text-sm">{error}</div>
          <button
            onClick={() => void fetchAuctions()}
            className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-[color:var(--sf-text)] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)]">
          {!hasAuctions ? (
            <div className="p-6 text-[color:var(--sf-mutedText)] flex items-center justify-between">
              <span>No auctions found.</span>
              <button
                onClick={() => void fetchAuctions()}
                className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-[color:var(--sf-text)] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm text-[color:var(--sf-mutedText)]">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-[color:var(--sf-mutedText)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("start_date")}
                      className="flex items-center gap-1 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide hover:text-[color:var(--sf-text)]"
                    >
                      Start
                      {sortKey === "start_date" && (
                        <span className="text-[10px]">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("current_price")}
                      className="flex items-center gap-1 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide hover:text-[color:var(--sf-text)]"
                    >
                      Current Price
                      {sortKey === "current_price" && (
                        <span className="text-[10px]">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("end_time")}
                      className="flex items-center gap-1 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide hover:text-[color:var(--sf-text)]"
                    >
                      End
                      {sortKey === "end_time" && (
                        <span className="text-[10px]">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide">
                    Highest Bidder
                  </th>
                  <th className="px-4 py-3 text-right text-[color:var(--sf-mutedText)] uppercase text-xs tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAndSorted.map((auction) => (
                  <tr key={auction.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-[color:var(--sf-text)]">
                      {auction.title}
                    </td>
                    <td className="px-4 py-3">{statusBadge(auction.status)}</td>
                    <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                      {auction.start_date || "—"}
                    </td>
                    <td className="px-4 py-3">
                      ${Number(auction.current_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                      {auction.end_time || "—"}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                      {auction.winning_user_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/auctions/${auction.id}`}
                        className="text-sm text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)] underline underline-offset-2"
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin/auctions/${auction.id}/edit`}
                        className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      {["inactive", "scheduled"].includes(auction.status) && (
                        <button
                          onClick={() =>
                            void handleStatusChange(auction, "active")
                          }
                          className="text-sm text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                        >
                          Publish
                        </button>
                      )}
                      {auction.status === "active" && (
                        <button
                          onClick={() => void handleRetire(auction)}
                          disabled={retiringId === auction.id}
                          className="text-sm text-amber-200 hover:text-amber-100 underline underline-offset-2"
                        >
                          {retiringId === auction.id ? "Retiring..." : "Retire"}
                        </button>
                      )}
                      {auction.status !== "complete" && (
                        <button
                          onClick={() =>
                            void handleStatusChange(auction, "complete")
                          }
                          className="text-sm text-red-300 hover:text-red-200 underline underline-offset-2"
                        >
                          Close
                        </button>
                      )}
                      {auction.status === "inactive" && (
                        <button
                          onClick={() => void handleReactivate(auction)}
                          disabled={reactivatingId === auction.id}
                          className="text-sm text-emerald-300 hover:text-emerald-200 disabled:opacity-50 underline underline-offset-2"
                        >
                          {reactivatingId === auction.id
                            ? "Reactivating..."
                            : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
