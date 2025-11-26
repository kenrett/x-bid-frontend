import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuction } from "../../../api/auctions";
import { updateAuction } from "../../../api/admin/auctions";
import { showToast } from "../../../services/toast";
import type { AuctionData } from "../../../types/auction";
import { AdminAuctionForm } from "./AdminAuctionForm";

export const AdminAuctionEdit = () => {
  const { id } = useParams();
  const auctionId = Number(id);
  const navigate = useNavigate();

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) {
      setError("Invalid auction id.");
      setLoading(false);
      return;
    }

    const fetchAuction = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuction(auctionId);
        setAuction(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load auction.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAuction();
  }, [auctionId]);

  const handleSubmit = async (payload: Partial<AuctionData> & { title: string }) => {
    if (!auctionId) return;
    try {
      setIsSubmitting(true);
      await updateAuction(auctionId, payload);
      showToast("Auction updated", "success");
      navigate("/admin/auctions");
    } catch (err) {
      console.error(err);
      showToast("Failed to update auction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Edit</p>
        <h2 className="text-2xl font-serif font-bold text-white">Update auction</h2>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading auction...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && auction && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <AdminAuctionForm
            initialValues={auction}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};
