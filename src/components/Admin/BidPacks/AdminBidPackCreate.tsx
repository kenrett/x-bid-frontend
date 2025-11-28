import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBidPack } from "../../../api/admin/bidPacks";
import { showToast } from "../../../services/toast";
import { logAdminAction } from "../../../services/adminAudit";
import type { BidPack } from "../../../types/bidPack";
import { AdminBidPackForm } from "./AdminBidPackForm";

export const AdminBidPackCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: Partial<BidPack> & { name: string }) => {
    try {
      setIsSubmitting(true);
      await createBidPack(payload);
      logAdminAction("bid_pack.create", { name: payload.name });
      showToast("Bid pack created", "success");
      navigate("/admin/bid-packs");
    } catch (err) {
      console.error(err);
      showToast("Failed to create bid pack", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Create</p>
        <h2 className="text-2xl font-serif font-bold text-white">New bid pack</h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <AdminBidPackForm
          submitLabel="Create bid pack"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
