import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";
import { BidHistory } from "@/components/BidHistory/BidHistory";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { showToast } from "@/services/toast";
import { logAdminAction } from "@/services/adminAudit";

export const AdminAuctionDetail = () => {
  const { id } = useParams();
  const auctionId = id ? Number(id) : 0;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    auction,
    bids,
    loading,
    error,
    highestBidderUsername,
    refreshAuction,
  } = useAuctionDetail(auctionId);

  if (!auctionId) {
    return <ErrorScreen message="Invalid auction id." />;
  }

  if (error) return <ErrorScreen message={error} />;
  if (loading || !auction) return <LoadingScreen item="auction" />;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAuction();
      logAdminAction("auction.refresh", { id: auctionId });
      showToast("Auction refreshed", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to refresh auction", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Admin Monitor</p>
          <h2 className="text-3xl font-serif font-bold text-white">{auction.title}</h2>
          <p className="text-sm text-gray-400 mt-1">Live overview with bid stream and controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="text-sm text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? "Refreshing..." : "Force refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Status" value={auction.status} />
        <InfoCard label="Current price" value={`$${Number(auction.current_price).toFixed(2)}`} />
        <InfoCard label="Highest bidder" value={highestBidderUsername ?? "—"} />
        <InfoCard label="End time" value={auction.end_time || "—"} />
        <InfoCard label="Start time" value={auction.start_date || "—"} />
        <InfoCard label="Auction ID" value={auction.id} />
        <InfoCard label="Highest bidder ID" value={auction.highest_bidder_id ?? "—"} />
        <InfoCard label="Winning user" value={auction.winning_user_name ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
          <div className="space-y-2 text-sm text-gray-200">
            <div>
              <span className="text-gray-400">Description: </span>
              <span>{auction.description || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400">Image URL: </span>
              <span className="break-all">{auction.image_url || "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Bid history</h3>
            <span className="text-xs text-gray-400">{bids.length} bids</span>
          </div>
          <div className="max-h-[420px] overflow-auto pr-2">
            <BidHistory bids={bids} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-lg font-semibold text-white break-all">{value}</div>
  </div>
);
