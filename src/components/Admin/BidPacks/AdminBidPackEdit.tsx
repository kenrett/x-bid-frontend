import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBidPack, updateBidPack } from "../../../api/admin/bidPacks";
import { showToast } from "../../../services/toast";
import { logAdminAction } from "../../../services/adminAudit";
import type { BidPack } from "../../../types/bidPack";
import { AdminBidPackForm } from "./AdminBidPackForm";

export const AdminBidPackEdit = () => {
  const { id } = useParams();
  const bidPackId = Number(id);
  const navigate = useNavigate();

  const [bidPack, setBidPack] = useState<BidPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bidPackId) {
      setError("Invalid bid pack id.");
      setLoading(false);
      return;
    }

    const fetchBidPack = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBidPack(bidPackId);
        setBidPack(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load bid pack.");
      } finally {
        setLoading(false);
      }
    };

    void fetchBidPack();
  }, [bidPackId]);

  const handleSubmit = async (payload: Partial<BidPack> & { name: string }) => {
    if (!bidPackId) return;
    try {
      setIsSubmitting(true);
      await updateBidPack(bidPackId, payload);
      logAdminAction("bid_pack.update", { id: bidPackId, name: payload.name });
      showToast("Bid pack updated", "success");
      navigate("/admin/bid-packs");
    } catch (err) {
      console.error(err);
      showToast("Failed to update bid pack", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Edit</p>
        <h2 className="text-2xl font-serif font-bold text-white">Update bid pack</h2>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading bid pack...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && bidPack && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <AdminBidPackForm
            initialValues={bidPack}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};
