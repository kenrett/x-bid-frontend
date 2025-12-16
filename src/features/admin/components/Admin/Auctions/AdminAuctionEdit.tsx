import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuction } from "../../../api/auctions";
import { updateAuction } from "../../../api/admin/auctions";
import { showToast } from "../../../services/toast";
import { logAdminAction } from "../../../services/adminAudit";
import type { AuctionSummary } from "../../../types/auction";
import { AdminAuctionForm } from "./AdminAuctionForm";

export const AdminAuctionEdit = () => {
  const { id } = useParams();
  const auctionId = Number(id);
  const navigate = useNavigate();

  const [auction, setAuction] = useState<AuctionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEditConfirmed, setActiveEditConfirmed] = useState(false);

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
        if (data.status === "active") {
          const confirmed = window.confirm(
            "This auction is active. Editing may affect live bidders. Continue?",
          );
          if (!confirmed) {
            navigate("/admin/auctions");
            return;
          }
          setActiveEditConfirmed(true);
        }
        setAuction(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load auction.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAuction();
  }, [auctionId, navigate]);

  const handleSubmit = async (
    payload: Partial<AuctionSummary> & { title: string },
  ) => {
    if (!auctionId) return;
    if (auction?.status === "active" && !activeEditConfirmed) {
      const confirmed = window.confirm(
        "This auction is active. Are you sure you want to save changes?",
      );
      if (!confirmed) return;
      setActiveEditConfirmed(true);
    }
    try {
      setIsSubmitting(true);
      await updateAuction(auctionId, payload);
      logAdminAction("auction.update", { id: auctionId, title: payload.title });
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
        <h2 className="text-2xl font-serif font-bold text-white">
          Update auction
        </h2>
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
