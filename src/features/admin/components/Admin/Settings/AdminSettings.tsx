import { useEffect, useState } from "react";
import { showToast } from "@services/toast";
import {
  extractError,
  getMaintenance,
  setMaintenance,
} from "@features/admin/api/maintenance";
import { useAuth } from "@features/auth/hooks/useAuth";

export const AdminSettings = () => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        setLoading(true);
        const state = await getMaintenance();
        setMaintenanceMode(state.enabled);
        setUpdatedAt(state.updated_at);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showToast(`Failed to load maintenance status: ${message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchMaintenance();
  }, []);

  const handleToggle = async (nextValue: boolean) => {
    if (!isSuperAdmin) {
      showToast("Superadmin only action", "error");
      return;
    }

    try {
      setSaving(true);
      const state = await setMaintenance(nextValue);
      setMaintenanceMode(state.enabled);
      setUpdatedAt(state.updated_at);
      showToast(
        `Maintenance ${state.enabled ? "enabled" : "disabled"}`,
        "success",
      );
    } catch (err: unknown) {
      const message =
        extractError(err) ?? (err instanceof Error ? err.message : String(err));
      showToast(message || "Failed to update maintenance mode", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Settings
          </p>
          <h2 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
            Platform configuration
          </h2>
          <p className="text-sm text-[color:var(--sf-mutedText)] mt-1">
            Toggle maintenance mode (superadmin only).
          </p>
        </div>
      </div>

      <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
              Maintenance mode
            </h3>
            <p className="text-sm text-[color:var(--sf-mutedText)]">
              Temporarily disable public access. Last updated:{" "}
              <span className="text-[color:var(--sf-mutedText)]">
                {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
              </span>
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[color:var(--sf-text)]">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => void handleToggle(e.target.checked)}
              disabled={loading || saving || !isSuperAdmin}
              className="h-4 w-4 rounded border-white/30 bg-white/10 text-[color:var(--sf-accent)] focus:ring-[color:var(--sf-focus-ring)]"
            />
            {loading ? "Loading..." : maintenanceMode ? "Enabled" : "Disabled"}
          </label>
        </div>
        {!isSuperAdmin && (
          <p className="text-sm text-amber-200">
            Superadmin only. Sign in as a superadmin to change this setting.
          </p>
        )}
      </div>
    </div>
  );
};
