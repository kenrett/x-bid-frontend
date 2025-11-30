import { useMemo, useState } from "react";
import type { Payment } from "./types";
import { AdminPayments } from "./AdminPayments";
import { showToast } from "@/services/toast";

const mockPayments: Payment[] = [
  { id: 101, userEmail: "admin@example.com", amount: 49.99, status: "succeeded", createdAt: "2024-07-01T12:00:00Z" },
  { id: 102, userEmail: "superadmin@example.com", amount: 99.99, status: "failed", createdAt: "2024-07-02T13:10:00Z" },
  { id: 103, userEmail: "user@example.com", amount: 19.99, status: "pending", createdAt: "2024-07-03T15:45:00Z" },
];

export const AdminPaymentsPage = () => {
  const [payments] = useState<Payment[]>(mockPayments);
  const [paymentSearch, setPaymentSearch] = useState("");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) =>
      payment.userEmail.toLowerCase().includes(paymentSearch.toLowerCase())
    );
  }, [payments, paymentSearch]);

  const handleRefresh = () => {
    showToast("Refresh coming soon (wire to backend)", "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Payments</p>
          <h2 className="text-3xl font-serif font-bold text-white">Recent payments</h2>
          <p className="text-sm text-gray-400 mt-1">Placeholder data shown; wire to backend for live data.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="text-sm text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          Refresh
        </button>
      </div>

      <AdminPayments
        payments={filteredPayments}
        search={paymentSearch}
        onSearchChange={setPaymentSearch}
      />
    </div>
  );
};
