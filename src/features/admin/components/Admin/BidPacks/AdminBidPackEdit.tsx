import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getBidPack, updateBidPack } from "@features/admin/api/bidPacks";
import { showToast } from "@services/toast";
import { logAdminAction } from "@features/admin/api/adminAudit";
import type { BidPack } from "@features/auctions/types/bidPack";
import { AdminBidPackForm } from "./AdminBidPackForm";

export const AdminBidPackEdit = () => {
  const { id } = useParams();
  const bidPackId = Number(id);
  const navigate = useNavigate();

  const [bidPack, setBidPack] = useState<BidPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
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

  const handleStatusChange = async (nextActive: boolean) => {
    if (!bidPackId || !bidPack) return;

    const action = nextActive ? "reactivate" : "retire";
    const confirmed = window.confirm(
      `${action === "retire" ? "Retire" : "Reactivate"} "${bidPack.name}"? ${
        action === "retire"
          ? "Retired bid packs cannot be purchased until reactivated."
          : "It will become purchasable immediately."
      }`,
    );
    if (!confirmed) return;

    try {
      setIsTogglingStatus(true);
      const updated = await updateBidPack(bidPackId, { active: nextActive });
      setBidPack(updated);
      logAdminAction(`bid_pack.${action}`, { id: bidPackId });
      showToast(
        action === "retire" ? "Bid pack retired" : "Bid pack reactivated",
        "success",
      );
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      showToast(message || `Failed to ${action} bid pack`, "error");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
          Edit
        </p>
        <h2 className="text-2xl font-serif font-bold text-[color:var(--sf-text)]">
          Update bid pack
        </h2>
      </div>

      {loading && (
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Loading bid pack...
        </p>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && bidPack && (
        <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--sf-mutedText)]">
                Status:
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  bidPack.status === "active"
                    ? "bg-green-900 text-green-100"
                    : "bg-gray-800 text-[color:var(--sf-mutedText)] border border-[color:var(--sf-border)]"
                }`}
              >
                {bidPack.status === "active" ? "Active" : "Retired"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bidPack.status === "active" ? (
                <button
                  type="button"
                  onClick={() => void handleStatusChange(false)}
                  disabled={isTogglingStatus}
                  className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50 underline underline-offset-2"
                >
                  {isTogglingStatus ? "Retiring..." : "Retire pack"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleStatusChange(true)}
                  disabled={isTogglingStatus}
                  className="text-sm text-green-300 hover:text-green-200 disabled:opacity-50 underline underline-offset-2"
                >
                  {isTogglingStatus ? "Reactivating..." : "Reactivate pack"}
                </button>
              )}
            </div>
          </div>

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
