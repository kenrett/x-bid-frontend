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
import { useAuth } from "@features/auth/hooks/useAuth";
import { purchasesApi } from "../api/purchasesApi";
import type { PurchaseDetail } from "../types/purchase";
import { normalizeApiError } from "@api/normalizeApiError";

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
  <div className="flex items-center justify-between text-sm text-white">
    <span className="text-gray-300">{label}</span>
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
      className="text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-1 text-white transition-colors disabled:opacity-50 disabled:hover:bg-white/10"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/10 space-y-1">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-sm text-white">{value || "—"}</div>
  </div>
);

export const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isReady, user } = useAuth();
  const userId = user?.id ?? null;
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

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
    try {
      const data = await purchasesApi.get(id);
      setPurchase(data);
    } catch (err) {
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
  }, [id]);

  useEffect(() => {
    if (!isReady) return;
    if (!userId) {
      setPurchase(null);
      setError(null);
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
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => void handleLoad()}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
            >
              Retry
            </button>
            <Link
              to="/account/purchases"
              className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white transition-colors"
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
                className="text-sm text-pink-200 hover:text-pink-100 underline underline-offset-2"
              >
                View receipt
              </a>
            ) : (
              <span className="text-sm text-gray-400">Payment details</span>
            )}
          </div>
        </div>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Purchase details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryItem
              label="Pack"
              value={
                purchase.bidPackName ? (
                  <span className="text-white">
                    {purchase.bidPackName}
                    {purchase.bidPackId ? (
                      <span className="text-gray-400">{` (#${purchase.bidPackId})`}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-gray-400">Unknown</span>
                )
              }
            />
            <SummaryItem
              label="Credits added"
              value={
                creditsAdded !== null && creditsAdded !== undefined ? (
                  `${creditsAdded.toLocaleString()} credits`
                ) : (
                  <span className="text-gray-400">—</span>
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
                    className="text-pink-200 hover:text-pink-100 underline underline-offset-2"
                  >
                    View receipt
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )
              }
            />
          </div>
        </section>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-3">
          <details
            open={showTechnical}
            onToggle={(event) =>
              setShowTechnical((event.target as HTMLDetailsElement).open)
            }
            className="group"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-lg font-semibold text-white">
                Support / Debug
              </h3>
              <span className="text-sm font-semibold bg-white/10 group-open:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors">
                {showTechnical ? "Hide" : "Show"}
              </span>
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-400">
                Share these ids with support if something looks off.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-3 text-sm text-white">
                  <span className="text-gray-300">Purchase id</span>
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
                <div className="flex items-center justify-between gap-3 text-sm text-white">
                  <span className="text-gray-300">Ledger grant entry id</span>
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
