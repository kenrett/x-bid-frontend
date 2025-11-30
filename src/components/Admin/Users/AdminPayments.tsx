import type { ChangeEvent } from "react";
import type { Payment } from "./types";

interface AdminPaymentsProps {
  payments: Payment[];
  search: string;
  onSearchChange: (value: string) => void;
}

export const AdminPayments = ({ payments, search, onSearchChange }: AdminPaymentsProps) => {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white">Recent Payments</h3>
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Filter by user email"
          className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {payments.length === 0 ? (
          <div className="p-4 text-sm text-gray-300">No payments found.</div>
        ) : (
          <table className="min-w-full text-sm text-gray-200">
            <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
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
                <tr key={payment.id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-semibold text-white">#{payment.id}</td>
                  <td className="px-4 py-3 text-gray-200">{payment.userEmail}</td>
                  <td className="px-4 py-3 text-gray-200">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "succeeded"
                        ? "bg-green-900 text-green-100 border border-green-300/30"
                        : payment.status === "pending"
                          ? "bg-amber-900 text-amber-100 border border-amber-300/30"
                          : "bg-red-900 text-red-100 border border-red-300/30"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{payment.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
