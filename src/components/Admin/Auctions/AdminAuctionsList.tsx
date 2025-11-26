import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAuctions } from "../../../api/auctions";
import { deleteAuction } from "../../../api/admin/auctions";
import { showToast } from "../../../services/toast";
import type { AuctionData } from "../../../types/auction";

export const AdminAuctionsList = () => {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const hasAuctions = useMemo(() => auctions.length > 0, [auctions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Auctions</p>
          <h2 className="text-2xl font-serif font-bold text-white">Manage auctions</h2>
        </div>
        <Link
          to="/admin/auctions/new"
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          New Auction
        </Link>
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
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Current Price</th>
                  <th className="px-4 py-3">End Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {auctions.map((auction) => (
                  <tr key={auction.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-white">{auction.title}</td>
                    <td className="px-4 py-3">{statusBadge(auction.status)}</td>
                    <td className="px-4 py-3">${Number(auction.current_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">{auction.end_time || "—"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/auctions/${auction.id}/edit`}
                        className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                      >
                        Edit
                      </Link>
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
