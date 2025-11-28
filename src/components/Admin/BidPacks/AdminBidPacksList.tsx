import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listBidPacks, deleteBidPack } from "../../../api/admin/bidPacks";
import type { BidPack } from "../../../types/bidPack";
import { showToast } from "../../../services/toast";

export const AdminBidPacksList = () => {
  const [packs, setPacks] = useState<BidPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [highlightFilter, setHighlightFilter] = useState<"all" | "featured" | "standard">("all");

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

  const handleDelete = async (id: number) => {
    const target = packs.find((pack) => pack.id === id);
    const label = target?.name ?? `Bid pack ${id}`;
    const confirmed = window.confirm(`Delete "${label}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteBidPack(id);
      showToast("Bid pack deleted", "success");
      await fetchPacks();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete bid pack", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    return packs.filter((pack) => {
      const matchesSearch = pack.name.toLowerCase().includes(search.toLowerCase());
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
          <p className="text-xs uppercase tracking-wide text-gray-500">Bid Packs</p>
          <h2 className="text-2xl font-serif font-bold text-white">Manage bid packs</h2>
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
            Showing <span className="text-white font-semibold">{filtered.length}</span> of{" "}
            <span className="text-white font-semibold">{packs.length}</span> packs
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
                {filter === "all" ? "All" : filter === "featured" ? "Featured" : "Standard"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading bid packs...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {!hasPacks ? (
            <div className="p-6 text-gray-300">No bid packs found.</div>
          ) : (
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Bids</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">$/Bid</th>
                  <th className="px-4 py-3">Highlight</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((pack) => (
                  <tr key={pack.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-white">{pack.name}</td>
                    <td className="px-4 py-3">{pack.bids}</td>
                    <td className="px-4 py-3">${Number(pack.price).toFixed(2)}</td>
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
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/bid-packs/${pack.id}/edit`}
                        className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => void handleDelete(pack.id)}
                        disabled={deletingId === pack.id}
                        className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50 underline underline-offset-2"
                      >
                        {deletingId === pack.id ? "Deleting..." : "Delete"}
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
