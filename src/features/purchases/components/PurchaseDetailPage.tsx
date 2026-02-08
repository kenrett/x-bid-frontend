import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Page } from "@components/Page";
import { LoadingScreen } from "@components/LoadingScreen";
import { StorefrontBadge } from "@components/StorefrontBadge";
import { useAuth } from "@features/auth/hooks/useAuth";
import { purchasesApi } from "../api/purchasesApi";
import type { PurchaseDetail } from "../types/purchase";
import { normalizeApiError } from "@api/normalizeApiError";
import { getApiBaseUrl } from "@api/client";
import { useStorefront } from "../../../storefront/useStorefront";
import {
  STOREFRONT_CONFIGS,
  getStorefrontOrigin,
  isStorefrontKey,
  type StorefrontConfig,
  type StorefrontKey,
} from "../../../storefront/storefront";
import { recordStorefrontSwitchIntent } from "../../../debug/authDebugSwitch";

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatMoney = (amount: number, currency: string | null) => {
  if (currency && currency.length === 3) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount);
    } catch {
      // ignore invalid currency codes and fall back
    }
  }
  return `$${amount.toFixed(2)}`;
};

const StatusBadge = ({ status }: { status: PurchaseDetail["status"] }) => {
  const styles =
    status === "succeeded"
      ? "bg-green-900 text-green-100 border border-green-300/40"
      : status === "refunded"
        ? "bg-blue-900 text-blue-100 border border-blue-300/40"
        : status === "pending"
          ? "bg-amber-900 text-amber-100 border border-amber-300/40"
          : "bg-red-900 text-red-100 border border-red-300/40";

  const label =
    status === "succeeded"
      ? "Succeeded"
      : status === "refunded"
        ? "Refunded"
        : status === "pending"
          ? "Pending"
          : "Failed";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm text-[color:var(--sf-text)]">
    <span className="text-[color:var(--sf-mutedText)]">{label}</span>
    <span className="font-semibold break-all text-right">{value || "—"}</span>
  </div>
);

const formatPaymentStatus = (value: string | null | undefined) => {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  return trimmed.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const CopyButton = ({
  value,
  label,
}: {
  value: string | null | undefined;
  label: string;
}) => {
  const [copied, setCopied] = useState(false);
  const isDisabled = !value;

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op (clipboard may be blocked)
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={isDisabled}
      aria-label={label}
      className="text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-1 text-[color:var(--sf-text)] transition-colors disabled:opacity-50 disabled:hover:bg-white/10"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const coerceString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;

const extractStorefrontKeyFromRecord = (
  record?: Record<string, unknown>,
): StorefrontKey | null => {
  if (!record) return null;
  const candidate =
    coerceString(record.storefront_key) ??
    coerceString((record as { storefrontKey?: unknown }).storefrontKey) ??
    coerceString(record.storefront);
  if (!candidate) return null;
  return isStorefrontKey(candidate) ? candidate : null;
};

const extractStorefrontKeyFromError = (
  error: unknown,
): StorefrontKey | null => {
  if (!axios.isAxiosError(error)) return null;
  const body = asRecord(error.response?.data);
  const fromBody = extractStorefrontKeyFromRecord(body);
  if (fromBody) return fromBody;
  const details = asRecord(body?.details);
  const fromDetails = extractStorefrontKeyFromRecord(details);
  return fromDetails;
};

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 shadow-lg shadow-black/10 space-y-1">
    <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
      {label}
    </p>
    <div className="text-sm text-[color:var(--sf-text)]">{value || "—"}</div>
  </div>
);

export const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isReady, user } = useAuth();
  const { key: currentStorefrontKey } = useStorefront();
  const userId = user?.id ?? null;
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [blockedStorefront, setBlockedStorefront] =
    useState<StorefrontConfig | null>(null);

  const loginRedirect = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search,
      )}`,
    [location.pathname, location.search],
  );

  const handleLoad = useCallback(async () => {
    if (!id) {
      setError("Invalid purchase id.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setBlockedStorefront(null);
    try {
      const data = await purchasesApi.get(id);
      setPurchase(data);
    } catch (err) {
      const storefrontKey = extractStorefrontKeyFromError(err);
      if (
        storefrontKey &&
        storefrontKey !== currentStorefrontKey &&
        STOREFRONT_CONFIGS[storefrontKey]
      ) {
        const targetConfig = STOREFRONT_CONFIGS[storefrontKey];
        setBlockedStorefront(targetConfig);
        setError(`This item belongs to ${targetConfig.name}. Open it there.`);
        return;
      }
      const parsed = normalizeApiError(err);
      if (parsed.status === 404) {
        setError("Purchase not found.");
      } else if (parsed.status === 403) {
        setError("You do not have access to this purchase.");
      } else {
        setError(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, currentStorefrontKey]);

  useEffect(() => {
    if (!isReady) return;
    if (!userId) {
      setPurchase(null);
      setError(null);
      setBlockedStorefront(null);
      return;
    }
    void handleLoad();
  }, [handleLoad, isReady, userId]);

  if (!isReady) return <LoadingScreen item="purchase" />;

  if (!user) {
    return (
      <Page centered>
        <h2 className="text-4xl font-bold mb-3 text-[color:var(--sf-text)]">
          Sign in to view this purchase
        </h2>
        <p className="mb-6 text-lg text-[color:var(--sf-mutedText)]">
          You need an account to view purchase details and receipts.
        </p>
        <Link
          to={loginRedirect}
          className="inline-flex items-center justify-center text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
        >
          Log In
        </Link>
      </Page>
    );
  }

  if (isLoading && !purchase) return <LoadingScreen item="purchase" />;

  if (error && !purchase) {
    return (
      <Page centered>
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-lg text-red-200 font-semibold" role="alert">
            {error}
          </p>
          {blockedStorefront && (
            <p className="text-sm text-[color:var(--sf-text)]/70">
              This item belongs to {blockedStorefront.name}.{" "}
              <a
                href={getStorefrontOrigin(blockedStorefront.key)}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-[color:var(--sf-text)] underline underline-offset-2"
                onClick={() => {
                  const targetOrigin = getStorefrontOrigin(
                    blockedStorefront.key,
                  );
                  recordStorefrontSwitchIntent({
                    fromOrigin: window.location.origin,
                    fromStorefrontKey: currentStorefrontKey,
                    toOrigin: targetOrigin,
                    toStorefrontKey: blockedStorefront.key,
                    apiBaseUrl: getApiBaseUrl(),
                  });
                }}
              >
                Open it there.
              </a>
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => void handleLoad()}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-[color:var(--sf-text)] transition-colors"
            >
              Retry
            </button>
            <Link
              to="/account/purchases"
              className="text-sm font-semibold bg-[color:var(--sf-surface)] hover:bg-white/10 border border-[color:var(--sf-border)] rounded-lg px-4 py-2 text-[color:var(--sf-text)] transition-colors"
            >
              Back to purchases
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  if (!purchase) return null;

  const statusBadge = <StatusBadge status={purchase.status} />;
  const creditsAdded = purchase.creditsAdded ?? purchase.credits ?? null;

  return (
    <Page>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              to="/account/purchases"
              className="text-xs text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)] transition-colors"
            >
              ← Back to purchases
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--sf-mutedText)]">
              Purchase #{purchase.id}
            </p>
            <div>
              <StorefrontBadge storefrontKey={purchase.storefrontKey} />
            </div>
            <h1 className="text-4xl font-bold text-[color:var(--sf-text)]">
              {purchase.bidPackName || "Bid pack purchase"}
            </h1>
            <p className="text-[color:var(--sf-mutedText)]">
              Placed {formatDate(purchase.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusBadge}
            {purchase.receiptUrl ? (
              <a
                href={purchase.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[color:var(--sf-accent)] hover:text-[color:var(--sf-accent)] underline underline-offset-2"
              >
                View receipt
              </a>
            ) : (
              <span className="text-sm text-[color:var(--sf-mutedText)]">
                Payment details
              </span>
            )}
          </div>
        </div>

        <section className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-5 shadow-lg shadow-black/10 space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--sf-text)]">
            Purchase details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryItem
              label="Pack"
              value={
                purchase.bidPackName ? (
                  <span className="text-[color:var(--sf-text)]">
                    {purchase.bidPackName}
                    {purchase.bidPackId ? (
                      <span className="text-[color:var(--sf-mutedText)]">{` (#${purchase.bidPackId})`}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-[color:var(--sf-mutedText)]">
                    Unknown
                  </span>
                )
              }
            />
            <SummaryItem
              label="Credits added"
              value={
                creditsAdded !== null && creditsAdded !== undefined ? (
                  `${creditsAdded.toLocaleString()} credits`
                ) : (
                  <span className="text-[color:var(--sf-mutedText)]">—</span>
                )
              }
            />
            <SummaryItem
              label="Stripe / payment status"
              value={formatPaymentStatus(purchase.paymentStatus)}
            />
            <SummaryItem
              label="Amount"
              value={formatMoney(purchase.amount, purchase.currency)}
            />
            <SummaryItem label="Status" value={statusBadge} />
            <SummaryItem
              label="Created at"
              value={formatDate(purchase.createdAt)}
            />
            <SummaryItem
              label="Receipt"
              value={
                purchase.receiptUrl ? (
                  <a
                    href={purchase.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[color:var(--sf-accent)] hover:text-[color:var(--sf-accent)] underline underline-offset-2"
                  >
                    View receipt
                  </a>
                ) : (
                  <span className="text-[color:var(--sf-mutedText)]">—</span>
                )
              }
            />
          </div>
        </section>

        <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-5 shadow-lg shadow-black/10 space-y-3">
          <details
            open={showTechnical}
            onToggle={(event) =>
              setShowTechnical((event.target as HTMLDetailsElement).open)
            }
            className="group"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
                Support / Debug
              </h3>
              <span className="text-sm font-semibold bg-white/10 group-open:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-[color:var(--sf-text)] transition-colors">
                {showTechnical ? "Hide" : "Show"}
              </span>
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-[color:var(--sf-mutedText)]">
                Share these ids with support if something looks off.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-3 text-sm text-[color:var(--sf-text)]">
                  <span className="text-[color:var(--sf-mutedText)]">
                    Purchase id
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold break-all text-right">
                      {purchase.id}
                    </span>
                    <CopyButton
                      value={String(purchase.id)}
                      label="Copy purchase id"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-[color:var(--sf-text)]">
                  <span className="text-[color:var(--sf-mutedText)]">
                    Ledger grant entry id
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold break-all text-right">
                      {purchase.ledgerGrantEntryId ?? "—"}
                    </span>
                    <CopyButton
                      value={
                        purchase.ledgerGrantEntryId !== null &&
                        purchase.ledgerGrantEntryId !== undefined
                          ? String(purchase.ledgerGrantEntryId)
                          : null
                      }
                      label="Copy ledger grant entry id"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow
                  label="Stripe checkout session"
                  value={purchase.stripeCheckoutSessionId || "—"}
                />
                <DetailRow
                  label="Stripe payment intent"
                  value={purchase.stripePaymentIntentId || "—"}
                />
                <DetailRow
                  label="Stripe charge"
                  value={purchase.stripeChargeId || "—"}
                />
                <DetailRow
                  label="Stripe invoice"
                  value={purchase.stripeInvoiceId || "—"}
                />
                <DetailRow
                  label="Stripe customer"
                  value={purchase.stripeCustomerId || "—"}
                />
                <DetailRow
                  label="Stripe event"
                  value={purchase.stripeEventId || "—"}
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </Page>
  );
};
