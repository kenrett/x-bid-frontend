import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../api/accountApi";
import { parseAccountApiError, type FieldErrors } from "../api/accountErrors";
import { showToast } from "@services/toast";
import { useAuth } from "@features/auth/hooks/useAuth";

const INPUT_CLASSES =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatYesNo = (value: boolean | undefined) =>
  value === true ? "Yes" : value === false ? "No" : "—";

export const AccountProfilePage = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);

  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    createdAt?: string;
    emailVerified?: boolean;
    emailVerifiedAt?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [nameDraft, setNameDraft] = useState("");

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailChangeStatus, setEmailChangeStatus] = useState<"idle" | "sent">(
    "idle",
  );

  const canSaveName = useMemo(() => {
    const trimmed = nameDraft.trim();
    return Boolean(trimmed) && trimmed !== (profile?.name ?? "").trim();
  }, [nameDraft, profile?.name]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    accountApi
      .getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setNameDraft(data.name ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(parseAccountApiError(err).message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveName = async () => {
    setFieldErrors({});
    setSuccessMessage(null);
    setError(null);

    const nextName = nameDraft.trim();
    if (!nextName) {
      setFieldErrors({ name: ["Name cannot be blank."] });
      return;
    }

    setSavingName(true);
    try {
      const updated = await accountApi.updateName(nextName);
      setProfile(updated);
      setNameDraft(updated.name ?? nextName);
      updateUser((prev) => ({ ...prev, name: updated.name ?? nextName }));
      setSuccessMessage("Profile updated.");
      showToast("Profile updated.", "success");
    } catch (err) {
      const parsed = parseAccountApiError(err);
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setSavingName(false);
    }
  };

  const handleRequestEmailChange = async () => {
    setFieldErrors({});
    setSuccessMessage(null);
    setError(null);
    setEmailChangeStatus("idle");

    const emailTrimmed = newEmail.trim();
    if (!emailTrimmed) {
      setFieldErrors({ email: ["Email cannot be blank."] });
      return;
    }

    setRequestingEmailChange(true);
    try {
      await accountApi.requestEmailChange({
        email: emailTrimmed,
        current_password: currentPassword || undefined,
      });
      setEmailChangeStatus("sent");
      setSuccessMessage("Verification email sent to your new address.");
      showToast("Verification email sent.", "success");
      setCurrentPassword("");
    } catch (err) {
      const parsed = parseAccountApiError(err);
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setRequestingEmailChange(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-lg">Loading profile…</p>;
  }

  if (error && !profile) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">Profile</h2>
        <p role="alert" className="text-red-300">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Profile</h2>
        <p className="text-sm text-gray-300">
          Review your account details and manage email verification.
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
      {successMessage && (
        <div className="rounded-xl border border-green-400/40 bg-green-900/30 px-4 py-3 text-green-50">
          {successMessage}
        </div>
      )}

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">Account info</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold">
              Name
            </label>
            <input
              id="name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className={INPUT_CLASSES}
              autoComplete="name"
            />
            {fieldErrors.name?.length ? (
              <p className="text-sm text-red-300">{fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="block text-sm font-semibold">Email</div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white">
              {profile?.email ?? "—"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-gray-400">Created</div>
            <div className="text-sm text-gray-100">
              {formatDateTime(profile?.createdAt)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-400">Email verified</div>
            <div className="text-sm text-gray-100">
              {formatYesNo(profile?.emailVerified)}
              {profile?.emailVerifiedAt
                ? ` (at ${formatDateTime(profile.emailVerifiedAt ?? undefined)})`
                : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSaveName}
            disabled={!canSaveName || savingName}
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save name"}
          </button>
          <button
            type="button"
            onClick={() => setNameDraft(profile?.name ?? "")}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Change email</h3>
            <p className="text-sm text-gray-300">
              Email changes require verification. We’ll send a verification link
              to your new address.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEmailChange((v) => !v)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            {showEmailChange ? "Close" : "Change email"}
          </button>
        </div>

        {showEmailChange && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="new-email"
                className="block text-sm font-semibold"
              >
                New email
              </label>
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={INPUT_CLASSES}
                autoComplete="email"
              />
              {fieldErrors.email?.length ? (
                <p className="text-sm text-red-300">{fieldErrors.email[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="current-password-email"
                className="block text-sm font-semibold"
              >
                Current password (if required)
              </label>
              <input
                id="current-password-email"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={INPUT_CLASSES}
                autoComplete="current-password"
              />
              {fieldErrors.current_password?.length ? (
                <p className="text-sm text-red-300">
                  {fieldErrors.current_password[0]}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRequestEmailChange}
                disabled={requestingEmailChange}
                className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {requestingEmailChange
                  ? "Sending…"
                  : emailChangeStatus === "sent"
                    ? "Sent"
                    : "Send verification"}
              </button>
              <p className="text-sm text-gray-300">
                {emailChangeStatus === "sent"
                  ? "Check your inbox to verify the new email."
                  : "We’ll keep your current email active until verified."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
