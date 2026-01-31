import { useEffect, useMemo, useRef, useState } from "react";
import {
  twoFactorApi,
  type TwoFactorRecoveryCodes,
  type TwoFactorSetup,
  type TwoFactorStatus,
} from "../api/twoFactorApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { showToast } from "@services/toast";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const downloadRecoveryCodes = (codes: string[]) => {
  const blob = new Blob([codes.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "recovery-codes.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const AccountTwoFactorPage = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [recovery, setRecovery] = useState<TwoFactorRecoveryCodes | null>(null);
  const [step, setStep] = useState<"status" | "setup" | "verify" | "recovery">(
    "status",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLInputElement | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await twoFactorApi.getStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    try {
      const nextSetup = await twoFactorApi.startSetup();
      setSetup(nextSetup);
      setRecovery(null);
      setStep("setup");
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Enter the 6-digit code from your authenticator app.");
      codeRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const recoveryCodes = await twoFactorApi.verifySetup(code.trim());
      setRecovery(recoveryCodes);
      setStep("recovery");
      setCode("");
      showToast("Two-factor authentication enabled.", "success");
      await loadStatus();
    } catch (err) {
      const parsed = normalizeApiError(err);
      setError(
        parsed.status === 429
          ? "Too many attempts. Please wait and try again."
          : parsed.message,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!recovery?.recoveryCodes.length) return;
    try {
      await navigator.clipboard.writeText(recovery.recoveryCodes.join("\n"));
      setCopied(true);
      showToast("Recovery codes copied.", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Unable to copy recovery codes. Please copy them manually.");
    }
  };

  const qrSrc = useMemo(() => {
    if (setup?.qrCodeSvg) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(setup.qrCodeSvg)}`;
    }
    return setup?.otpauthUrl ?? null;
  }, [setup]);

  if (loading) {
    return (
      <p className="text-gray-400 text-lg">Loading two-factor status...</p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">
          Two-factor authentication
        </h2>
        <p className="text-sm text-gray-300">
          Add an extra layer of protection to your account with an authenticator
          app.
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

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Status: {status?.enabled ? "Enabled" : "Not enabled"}
            </p>
            <p className="text-xs text-gray-400">
              Enabled at: {formatDateTime(status?.enabledAt)}
            </p>
          </div>
          {!status?.enabled ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={busy}
              className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Starting..." : "Enable 2FA"}
            </button>
          ) : null}
        </div>

        {!status?.enabled ? (
          <p className="text-sm text-gray-300">
            Use an authenticator app (like 1Password, Google Authenticator, or
            Authy) to generate one-time codes when you sign in.
          </p>
        ) : (
          <p className="text-sm text-gray-300">
            Two-factor authentication is active. Keep your recovery codes stored
            safely.
          </p>
        )}
      </section>

      {step === "setup" && setup ? (
        <section className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Scan the QR code
            </h3>
            <p className="text-sm text-gray-300">
              Open your authenticator app and scan the QR code or enter the
              secret manually.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Two-factor QR code"
                className="h-40 w-40 rounded-xl border border-white/10 bg-white/5 p-2"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs text-gray-400">
                QR code pending
              </div>
            )}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Secret key</div>
              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100">
                {setup.secret}
              </div>
              <div className="text-xs text-gray-400">
                Issuer: {setup.issuer ?? "X Bid"} • Account:{" "}
                {setup.accountName ?? "Your account"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="two-factor-code"
              className="block text-sm font-semibold"
            >
              Enter the 6-digit code
            </label>
            <input
              id="two-factor-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              ref={codeRef}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={busy}
              className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify and enable"}
            </button>
            <button
              type="button"
              onClick={() => setStep("status")}
              disabled={busy}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {step === "recovery" && recovery ? (
        <section className="grid gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-900/10 p-5">
          <div>
            <h3 className="text-lg font-semibold text-emerald-50">
              Recovery codes
            </h3>
            <p className="text-sm text-emerald-100/90">
              Save these codes in a secure location. Each code can be used once
              to access your account.
            </p>
          </div>
          <div className="grid gap-2 rounded-lg border border-emerald-400/20 bg-black/20 px-4 py-3 text-sm text-emerald-50">
            {recovery.recoveryCodes.map((codeValue) => (
              <div key={codeValue} className="font-mono tracking-wide">
                {codeValue}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-emerald-300/40 bg-emerald-900/20 px-4 py-2 text-sm font-semibold text-emerald-50"
            >
              {copied ? "Copied" : "Copy codes"}
            </button>
            <button
              type="button"
              onClick={() => downloadRecoveryCodes(recovery.recoveryCodes)}
              className="rounded-lg border border-emerald-300/40 bg-emerald-900/20 px-4 py-2 text-sm font-semibold text-emerald-50"
            >
              Download
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};
