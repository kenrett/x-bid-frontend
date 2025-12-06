import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  listBidPacks,
  deleteBidPack,
  updateBidPack,
} from "../../../api/admin/bidPacks";
import type { BidPack } from "../../../types/bidPack";
import { showToast } from "../../../services/toast";
import { logAdminAction } from "../../../services/adminAudit";

export const AdminBidPacksList = () => {
  const [packs, setPacks] = useState<BidPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retiringId, setRetiringId] = useState<number | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [highlightFilter, setHighlightFilter] = useState<
    "all" | "featured" | "standard"
  >("all");

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listBidPacks();
      setPacks(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bid packs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPacks();
  }, [fetchPacks]);

  const handleRetire = async (id: number) => {
    const target = packs.find((pack) => pack.id === id);
    const label = target?.name ?? `Bid pack ${id}`;
    const confirmed = window.confirm(
      `Retire "${label}"? Retired bid packs cannot be purchased until reactivated.`,
    );
    if (!confirmed) return;

    try {
      setRetiringId(id);
      await deleteBidPack(id);
      logAdminAction("bid_pack.retire", { id });
      showToast("Bid pack retired", "success");
      await fetchPacks();
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || "Failed to retire bid pack", "error");
    } finally {
      setRetiringId(null);
    }
  };

  const handleReactivate = async (pack: BidPack) => {
    const confirmed = window.confirm(
      `Reactivate "${pack.name}"? It will become purchasable immediately.`,
    );
    if (!confirmed) return;

    try {
      setReactivatingId(pack.id);
      await updateBidPack(pack.id, { active: true });
      logAdminAction("bid_pack.reactivate", { id: pack.id });
      showToast("Bid pack reactivated", "success");
      await fetchPacks();
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || "Failed to reactivate bid pack", "error");
    } finally {
      setReactivatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return packs.filter((pack) => {
      const matchesSearch = pack.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesHighlight =
        highlightFilter === "all"
          ? true
          : highlightFilter === "featured"
            ? Boolean(pack.highlight)
            : !pack.highlight;
      return matchesSearch && matchesHighlight;
    });
  }, [packs, search, highlightFilter]);

  const hasPacks = useMemo(() => filtered.length > 0, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Bid Packs
          </p>
          <h2 className="text-2xl font-serif font-bold text-white">
            Manage bid packs
          </h2>
        </div>
        <Link
          to="/admin/bid-packs/new"
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          New Bid Pack
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-gray-300">
          <span>
            Showing{" "}
            <span className="text-white font-semibold">{filtered.length}</span>{" "}
            of <span className="text-white font-semibold">{packs.length}</span>{" "}
            packs
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setHighlightFilter("all");
              void fetchPacks();
            }}
            className="text-sm text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "featured", "standard"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setHighlightFilter(filter)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  highlightFilter === filter
                    ? "bg-pink-600 border-pink-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
                }`}
              >
                {filter === "all"
                  ? "All"
                  : filter === "featured"
                    ? "Featured"
                    : "Standard"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading bid packs...</p>}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-4 text-red-100 flex items-center justify-between">
          <div className="text-sm">{error}</div>
          <button
            onClick={() => void fetchPacks()}
            className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {!hasPacks ? (
            <div className="p-6 text-gray-300 flex items-center justify-between">
              <span>No bid packs found.</span>
              <button
                onClick={() => void fetchPacks()}
                className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Bids</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">$/Bid</th>
                  <th className="px-4 py-3">Highlight</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((pack) => (
                  <tr key={pack.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-white">
                      {pack.name}
                    </td>
                    <td className="px-4 py-3">{pack.bids}</td>
                    <td className="px-4 py-3">
                      ${Number(pack.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{pack.pricePerBid}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          pack.highlight
                            ? "bg-pink-900 text-pink-100"
                            : "bg-white/10 text-gray-200"
                        }`}
                      >
                        {pack.highlight ? "Featured" : "Standard"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          pack.status === "active"
                            ? "bg-green-900 text-green-100"
                            : "bg-gray-800 text-gray-200 border border-white/10"
                        }`}
                      >
                        {pack.status === "active" ? "Active" : "Retired"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/bid-packs/${pack.id}/edit`}
                        className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      {pack.status === "retired" ? (
                        <button
                          onClick={() => void handleReactivate(pack)}
                          disabled={reactivatingId === pack.id}
                          className="text-sm text-green-300 hover:text-green-200 disabled:opacity-50 underline underline-offset-2"
                        >
                          {reactivatingId === pack.id
                            ? "Reactivating..."
                            : "Reactivate"}
                        </button>
                      ) : (
                        <button
                          onClick={() => void handleRetire(pack.id)}
                          disabled={retiringId === pack.id}
                          className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50 underline underline-offset-2"
                        >
                          {retiringId === pack.id ? "Retiring..." : "Retire"}
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
