import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAuctions } from "../../../api/auctions";
import { deleteAuction, updateAuction } from "../../../api/admin/auctions";
import { showToast } from "../../../services/toast";
import type { AuctionData } from "../../../types/auction";

export const AdminAuctionsList = () => {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuctionData["status"] | "all">("all");
  const [startAfter, setStartAfter] = useState("");
  const [endBefore, setEndBefore] = useState("");
  const [sortKey, setSortKey] = useState<"start_date" | "end_time" | "current_price">("start_date");
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
      setError("Failed to load auctions.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  const handleDelete = async (id: number) => {
    const target = auctions.find((auction) => auction.id === id);
    const label = target?.title ?? `Auction ${id}`;
    const confirmed = window.confirm(`Delete "${label}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteAuction(id);
      showToast("Auction deleted", "success");
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete auction", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (auction: AuctionData, nextStatus: AuctionData["status"]) => {
    const label = auction.title ?? `Auction ${auction.id}`;
    const confirmed = window.confirm(
      `Change status of "${label}" from ${auction.status} to ${nextStatus}? This affects bidders immediately.`
    );
    if (!confirmed) return;

    try {
      await updateAuction(auction.id, { status: nextStatus });
      showToast(`Status set to ${nextStatus}`, "success");
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    }
  };

  const statusBadge = useCallback((status: AuctionData["status"]) => {
    const styles: Record<AuctionData["status"], string> = {
      inactive: "bg-gray-700 text-gray-100",
      scheduled: "bg-blue-900 text-blue-100",
      active: "bg-green-900 text-green-100",
      complete: "bg-purple-900 text-purple-100",
    };
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  }, []);

  const filteredAndSorted = useMemo(() => {
    const parsedStartAfter = startAfter ? new Date(startAfter) : null;
    const parsedEndBefore = endBefore ? new Date(endBefore) : null;

    const filtered = auctions.filter((auction) => {
      const matchesSearch = auction.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : auction.status === statusFilter;

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
  const hasAuctions = useMemo(() => filteredAndSorted.length > 0, [filteredAndSorted]);
  const totalCount = auctions.length;
  const filteredCount = filteredAndSorted.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Auctions</p>
          <h2 className="text-2xl font-serif font-bold text-white">Manage auctions</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchAuctions()}
            className="text-sm text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-2 transition-colors"
          >
            Refresh
          </button>
          <Link
            to="/admin/auctions/new"
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            New Auction
          </Link>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="font-semibold text-white">{filteredCount}</span>
            <span>of</span>
            <span className="font-semibold text-white">{totalCount}</span>
            <span>auctions</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
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
            className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "inactive", "scheduled", "active", "complete"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  statusFilter === status
                    ? "bg-pink-600 border-pink-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
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
            className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Start after"
          />
          <input
            type="datetime-local"
            value={endBefore}
            onChange={(e) => setEndBefore(e.target.value)}
            className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="End before"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading auctions...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {!hasAuctions ? (
            <div className="p-6 text-gray-300">No auctions found.</div>
          ) : (
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 uppercase text-xs tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-gray-300 uppercase text-xs tracking-wide">Status</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("start_date")}
                      className="flex items-center gap-1 text-left text-gray-300 uppercase text-xs tracking-wide hover:text-white"
                    >
                      Start
                      {sortKey === "start_date" && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("current_price")}
                      className="flex items-center gap-1 text-left text-gray-300 uppercase text-xs tracking-wide hover:text-white"
                    >
                      Current Price
                      {sortKey === "current_price" && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("end_time")}
                      className="flex items-center gap-1 text-left text-gray-300 uppercase text-xs tracking-wide hover:text-white"
                    >
                      End
                      {sortKey === "end_time" && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 uppercase text-xs tracking-wide">Highest Bidder</th>
                  <th className="px-4 py-3 text-right text-gray-300 uppercase text-xs tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAndSorted.map((auction) => (
                  <tr key={auction.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-white">{auction.title}</td>
                    <td className="px-4 py-3">{statusBadge(auction.status)}</td>
                    <td className="px-4 py-3 text-gray-300">{auction.start_date || "—"}</td>
                    <td className="px-4 py-3">${Number(auction.current_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">{auction.end_time || "—"}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {auction.winning_user_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/auctions/${auction.id}/edit`}
                        className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      {["inactive", "scheduled"].includes(auction.status) && (
                        <button
                          onClick={() => void handleStatusChange(auction, "active")}
                          className="text-sm text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                        >
                          Publish
                        </button>
                      )}
                      {auction.status === "active" && (
                        <button
                          onClick={() => void handleStatusChange(auction, "inactive")}
                          className="text-sm text-amber-200 hover:text-amber-100 underline underline-offset-2"
                        >
                          Pause
                        </button>
                      )}
                      {auction.status !== "complete" && (
                        <button
                          onClick={() => void handleStatusChange(auction, "complete")}
                          className="text-sm text-red-300 hover:text-red-200 underline underline-offset-2"
                        >
                          Close
                        </button>
                      )}
                      <button
                        onClick={() => void handleDelete(auction.id)}
                        disabled={deletingId === auction.id}
                        className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50 underline underline-offset-2"
                      >
                        {deletingId === auction.id ? "Deleting..." : "Delete"}
                      </button>
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
