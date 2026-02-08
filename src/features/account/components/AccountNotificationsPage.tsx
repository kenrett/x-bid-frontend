import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../api/accountApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { showToast } from "@services/toast";
import type { NotificationPreferences } from "../types/account";

const DEFAULT_PREFS: NotificationPreferences = {
  marketing_emails: false,
  product_updates: false,
  bidding_alerts: true,
  outbid_alerts: true,
  watched_auction_ending: true,
  receipts: true,
};

export const AccountNotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [originalPrefs, setOriginalPrefs] =
    useState<NotificationPreferences>(DEFAULT_PREFS);

  const isDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(originalPrefs),
    [prefs, originalPrefs],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    accountApi
      .getNotificationPreferences()
      .then((data) => {
        if (cancelled) return;
        setPrefs(data);
        setOriginalPrefs(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(normalizeApiError(err).message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle =
    (key: keyof NotificationPreferences) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrefs((prev) => ({ ...prev, [key]: e.target.checked }));
    };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await accountApi.updateNotificationPreferences(prefs);
      setPrefs(updated);
      setOriginalPrefs(updated);
      setSuccess("Notification preferences saved.");
      showToast("Preferences saved.", "success");
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[color:var(--sf-mutedText)] text-lg">
        Loading notifications…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[color:var(--sf-text)]">
          Notifications
        </h2>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Choose which emails and alerts you receive.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-red-100"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-400/40 bg-green-900/30 px-4 py-3 text-green-50">
          {success}
        </div>
      )}

      <section className="grid gap-3 rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-5">
        <Toggle
          label="Marketing emails"
          description="Discounts, promos, and offers."
          checked={prefs.marketing_emails}
          onChange={toggle("marketing_emails")}
        />
        <Toggle
          label="Product updates"
          description="New features and platform announcements."
          checked={prefs.product_updates}
          onChange={toggle("product_updates")}
        />
        <Toggle
          label="Bidding alerts"
          description="Alerts for bids placed and important auction changes."
          checked={prefs.bidding_alerts}
          onChange={toggle("bidding_alerts")}
        />
        <Toggle
          label="Outbid alerts"
          description="Get notified when someone outbids you."
          checked={prefs.outbid_alerts}
          onChange={toggle("outbid_alerts")}
        />
        <Toggle
          label="Watched auction ending"
          description="Reminders when watched auctions are close to ending."
          checked={prefs.watched_auction_ending}
          onChange={toggle("watched_auction_ending")}
        />
        <Toggle
          label="Receipts"
          description="Purchase receipts and payment confirmations."
          checked={prefs.receipts}
          onChange={toggle("receipts")}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setPrefs(originalPrefs)}
          disabled={!isDirty}
          className="rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label className="flex items-start justify-between gap-4 rounded-xl border border-[color:var(--sf-border)] bg-black/20 px-4 py-3">
    <div className="space-y-1">
      <div className="text-sm font-semibold text-[color:var(--sf-text)]">
        {label}
      </div>
      <div className="text-xs text-[color:var(--sf-mutedText)]">
        {description}
      </div>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 h-5 w-5 accent-pink-500"
    />
  </label>
);
