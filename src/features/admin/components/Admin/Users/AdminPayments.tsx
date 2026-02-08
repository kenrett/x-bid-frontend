import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Payment } from "@features/admin/types/users";
import { ADMIN_PATHS } from "../adminPaths";

interface AdminPaymentsProps {
  payments: Payment[];
  search: string;
  onSearchChange: (value: string) => void;
}

export const AdminPayments = ({
  payments,
  search,
  onSearchChange,
}: AdminPaymentsProps) => {
  const navigate = useNavigate();

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleNavigate = (paymentId: number) => {
    navigate(`/admin/${ADMIN_PATHS.payments}/${paymentId}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const paymentId = Number(event.currentTarget.dataset.paymentId);
      if (paymentId) {
        handleNavigate(paymentId);
      }
    }
  };

  return (
    <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
          Recent Payments
        </h3>
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Filter by user email"
          className="rounded-lg bg-black/20 border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)]">
        {payments.length === 0 ? (
          <div className="p-4 text-sm text-[color:var(--sf-mutedText)]">
            No payments found.
          </div>
        ) : (
          <table className="min-w-full text-sm text-[color:var(--sf-mutedText)]">
            <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-[color:var(--sf-mutedText)]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  data-payment-id={payment.id}
                  tabIndex={0}
                  onClick={() => handleNavigate(payment.id)}
                  onKeyDown={handleKeyDown}
                  className="hover:bg-white/[0.04] cursor-pointer focus:outline-none focus:bg-white/[0.08]"
                  aria-label={`Payment ${payment.id}`}
                >
                  <td className="px-4 py-3 font-semibold text-[color:var(--sf-text)] underline decoration-dotted">
                    #{payment.id}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                    {payment.userEmail}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.status === "succeeded"
                          ? "bg-green-900 text-green-100 border border-green-300/30"
                          : payment.status === "pending"
                            ? "bg-amber-900 text-amber-100 border border-amber-300/30"
                            : "bg-red-900 text-red-100 border border-red-300/30"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--sf-mutedText)]">
                    {payment.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
