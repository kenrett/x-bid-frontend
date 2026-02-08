import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminPaymentsApi } from "@features/admin/api/adminPaymentsApi";
import type { AdminPaymentReconciliation } from "@features/admin/types/users";
import { showToast } from "@services/toast";
import { LoadingScreen } from "@components/LoadingScreen";
import { ErrorScreen } from "@components/ErrorScreen";
import { ADMIN_PATHS } from "../adminPaths";

type RefundResult = {
  refundId: string | null;
  refundedCents: number | null;
};

export const AdminPaymentDetailPage = () => {
  const { id } = useParams();
  const paymentId = id ? Number(id) : null;
  const [payment, setPayment] = useState<AdminPaymentReconciliation | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundResult, setRefundResult] = useState<RefundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadPayment = useCallback(async () => {
    if (!paymentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminPaymentsApi.getPayment(paymentId);
      if (isMounted.current) setPayment(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!isMounted.current) return;
      setError(message);
      showToast(`Could not load payment: ${message}`, "error");
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [paymentId]);

  const parseRefundAmountCents = useCallback(
    (value: string): number | undefined => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) return NaN;
      return Math.round(parsed * 100);
    },
    [],
  );

  useEffect(() => {
    void loadPayment();
    return () => {
      isMounted.current = false;
    };
  }, [loadPayment]);

  const handleRepair = useCallback(async () => {
    if (!paymentId) return;
    try {
      setIsRepairing(true);
      const result = await adminPaymentsApi.repairCredits(paymentId);
      await loadPayment();

      const toastMessage =
        result.message ??
        (result.idempotent
          ? "No changes applied (already consistent)."
          : "Credits repaired and balances updated.");

      showToast(toastMessage, result.idempotent ? "info" : "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Failed to repair credits: ${message}`, "error");
    } finally {
      if (isMounted.current) setIsRepairing(false);
    }
  }, [paymentId, loadPayment]);

  const handleRefund = useCallback(async () => {
    if (!paymentId) return;
    setRefundError(null);

    const amountCents = parseRefundAmountCents(refundAmount);
    if (Number.isNaN(amountCents)) {
      setRefundError("Enter a valid refund amount in dollars (e.g. 5.00).");
      return;
    }

    const reason = refundReason.trim() || undefined;

    const confirmMessage = `Issue refund for payment #${paymentId}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsRefunding(true);
      const refundPayload =
        typeof amountCents === "number"
          ? { amountCents, reason }
          : { fullRefund: true, reason };
      const result = await adminPaymentsApi.refundPayment(
        paymentId,
        refundPayload,
      );

      const refundId =
        typeof result.refundId === "string" ? result.refundId : null;
      const refundedCents =
        typeof result.refundedCents === "number" ? result.refundedCents : null;

      setRefundResult({ refundId, refundedCents });
      setPayment((prev) =>
        prev
          ? {
              ...prev,
              status: result.status,
            }
          : prev,
      );
      showToast(`Refund issued${refundId ? ` (${refundId})` : ""}.`, "success");
      await loadPayment();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setRefundError(message);
      showToast(`Failed to issue refund: ${message}`, "error");
    } finally {
      if (isMounted.current) setIsRefunding(false);
    }
  }, [
    paymentId,
    parseRefundAmountCents,
    refundAmount,
    refundReason,
    loadPayment,
  ]);

  const hasMismatch = useMemo(() => {
    if (!payment) return false;
    return (
      payment.balanceAudit.matches === false ||
      Math.abs(payment.balanceAudit.difference) > 0.0001
    );
  }, [payment]);

  if (!paymentId) return <ErrorScreen message="Invalid payment id." />;
  if (isLoading && !payment) return <LoadingScreen item="payment" />;

  if (error && !payment) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-400/40 bg-red-900/30 p-4 text-red-100">
          <p className="font-semibold">Could not load payment: {error}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void loadPayment()}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-[color:var(--sf-text)] transition-colors"
            >
              Retry
            </button>
            <Link
              to={`/admin/${ADMIN_PATHS.payments}`}
              className="text-sm font-semibold bg-[color:var(--sf-surface)] hover:bg-white/10 border border-[color:var(--sf-border)] rounded-lg px-3 py-2 text-[color:var(--sf-text)] transition-colors"
            >
              Back to payments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  const { balanceAudit } = payment;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={`/admin/${ADMIN_PATHS.payments}`}
            className="text-xs text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)] transition-colors"
          >
            ← Back to payments
          </Link>
          <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Payment #{payment.id}
          </p>
          <h2 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
            {payment.userEmail || "Unknown user"}
          </h2>
          <p className="text-sm text-[color:var(--sf-mutedText)]">
            Created {payment.createdAt || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadPayment()}
            disabled={isLoading || isRepairing}
            className="text-sm text-[color:var(--sf-mutedText)] bg-white/10 hover:bg-white/20 border border-[color:var(--sf-border)] rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => void handleRepair()}
            disabled={isRepairing || isLoading}
            className="text-sm text-[color:var(--sf-text)] bg-pink-600 hover:bg-pink-700 border border-pink-400/60 rounded-lg px-3 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRepairing ? "Repairing..." : "Repair credits"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-4 space-y-3">
        <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
          Refund
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Amount is in dollars. Leave blank for a full refund.
        </p>
        {refundError ? (
          <div className="rounded-xl border border-red-400/40 bg-red-900/30 p-3 text-sm text-red-100">
            {refundError}
          </div>
        ) : null}
        {refundResult ? (
          <div className="rounded-xl border border-green-300/40 bg-green-900/20 p-3 text-sm text-green-100">
            <div>Refund issued.</div>
            <div>
              Refunded:{" "}
              {refundResult.refundedCents !== null
                ? `$${(refundResult.refundedCents / 100).toFixed(2)}`
                : "—"}
            </div>
            <div>Refund ID: {refundResult.refundId ?? "—"}</div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="refund-amount"
              className="block text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]"
            >
              Refund amount ($)
            </label>
            <input
              id="refund-amount"
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              placeholder="e.g. 5.00"
              inputMode="decimal"
              className="w-full rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label
              htmlFor="refund-reason"
              className="block text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]"
            >
              Reason (optional)
            </label>
            <input
              id="refund-reason"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="e.g. duplicate purchase"
              className="w-full rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={() => void handleRefund()}
            disabled={isRefunding || isLoading || isRepairing}
            className="text-sm text-[color:var(--sf-text)] bg-red-600 hover:bg-red-700 border border-red-400/60 rounded-lg px-3 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRefunding ? "Refunding..." : "Issue refund"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DetailCard
          label="Amount"
          value={`${payment.currency ? payment.currency.toUpperCase() + " " : "$"}${payment.amount.toFixed(2)}`}
        />
        <DetailCard
          label="Status"
          value={
            <StatusBadge
              status={payment.status}
              label={payment.status ?? "pending"}
            />
          }
        />
        <DetailCard
          label="Bid pack"
          value={
            payment.bidPackName ? (
              <span className="text-[color:var(--sf-text)]">
                {payment.bidPackName}{" "}
                {payment.bidPackId ? (
                  <span className="text-[color:var(--sf-mutedText)]">
                    ({payment.bidPackId})
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-[color:var(--sf-mutedText)]">Unknown</span>
            )
          }
        />
        <DetailCard
          label="Stripe checkout session"
          value={payment.stripeCheckoutSessionId || "—"}
        />
        <DetailCard
          label="Stripe payment intent"
          value={payment.stripePaymentIntentId || "—"}
        />
        <DetailCard label="Stripe event" value={payment.stripeEventId || "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--sf-border)]">
            <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
              Credit transactions ({payment.ledgerEntries.length})
            </h3>
          </div>
          {payment.ledgerEntries.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--sf-mutedText)]">
              No ledger entries.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-[color:var(--sf-mutedText)]">
                <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-[color:var(--sf-mutedText)]">
                  <tr>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Kind</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Idempotency key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payment.ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.createdAt || "—"}
                      </td>
                      <td className="px-4 py-3 capitalize">{entry.kind}</td>
                      <td className="px-4 py-3">{entry.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {entry.reason || (
                          <span className="text-[color:var(--sf-mutedText)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                        {entry.idempotencyKey || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className={`rounded-2xl border p-4 space-y-2 ${
            hasMismatch
              ? "border-amber-400/50 bg-amber-500/10"
              : "border-green-300/40 bg-green-900/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
              Balance audit
            </h3>
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                hasMismatch ? "text-amber-100" : "text-green-100"
              }`}
            >
              {hasMismatch ? "Mismatch" : "In sync"}
            </span>
          </div>
          <AuditRow
            label="Cached balance"
            value={balanceAudit.cachedBalance.toFixed(2)}
          />
          <AuditRow
            label="Derived balance"
            value={balanceAudit.derivedBalance.toFixed(2)}
          />
          <AuditRow
            label="Difference"
            value={balanceAudit.difference.toFixed(2)}
          />
          {hasMismatch ? (
            <p className="text-xs text-amber-100">
              Cached and derived balances differ. Consider repairing credits.
            </p>
          ) : (
            <p className="text-xs text-green-100">
              Ledger-derived balance matches cached balance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 shadow-lg shadow-black/10 space-y-1">
    <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
      {label}
    </p>
    <div className="text-sm text-[color:var(--sf-text)] break-all">
      {value || "—"}
    </div>
  </div>
);

const StatusBadge = ({
  status,
  label,
}: {
  status: AdminPaymentReconciliation["status"];
  label: string;
}) => {
  const styles =
    status === "succeeded"
      ? "bg-green-900 text-green-100 border border-green-300/30"
      : status === "pending"
        ? "bg-amber-900 text-amber-100 border border-amber-300/30"
        : "bg-red-900 text-red-100 border border-red-300/30";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
};

const AuditRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm text-[color:var(--sf-text)]">
    <span className="text-[color:var(--sf-mutedText)]">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
