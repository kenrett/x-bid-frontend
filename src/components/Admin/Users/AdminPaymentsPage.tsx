import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Payment } from "./types";
import { AdminPayments } from "./AdminPayments";
import { adminPaymentsApi } from "@/services/adminPaymentsApi";
import { showToast } from "@/services/toast";

export const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminPaymentsApi.listPayments();
      if (isMounted.current) {
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (!isMounted.current) return;
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Could not load payments: ${message}`, "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPayments();
    return () => {
      isMounted.current = false;
    };
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) =>
      payment.userEmail.toLowerCase().includes(paymentSearch.toLowerCase()),
    );
  }, [payments, paymentSearch]);

  const handleRefresh = () => {
    void loadPayments();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Payments
          </p>
          <h2 className="text-3xl font-serif font-bold text-white">
            Recent payments
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Live payment history pulled from the API. Use refresh to sync the
            latest records.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-sm text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
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
