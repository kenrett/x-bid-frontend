import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAuction } from "@features/admin/api/auctions";
import { showToast } from "@services/toast";
import { logAdminAction } from "@features/admin/api/adminAudit";
import type { AuctionSummary } from "@features/auctions/types/auction";
import { AdminAuctionForm } from "./AdminAuctionForm";

export const AdminAuctionCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    payload: Partial<AuctionSummary> & { title: string },
  ) => {
    try {
      setIsSubmitting(true);
      await createAuction(payload);
      logAdminAction("auction.create", { title: payload.title });
      showToast("Auction created", "success");
      navigate("/admin/auctions");
    } catch (err) {
      console.error(err);
      showToast("Failed to create auction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
          Create
        </p>
        <h2 className="text-2xl font-serif font-bold text-[color:var(--sf-text)]">
          New auction
        </h2>
      </div>

      <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-6">
        <AdminAuctionForm
          submitLabel="Create auction"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
