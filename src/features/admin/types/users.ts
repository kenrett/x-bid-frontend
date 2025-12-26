export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "superadmin" | "user";
  status: "active" | "disabled";
};

export type Payment = {
  id: number;
  userEmail: string;
  amount: number;
  status: "succeeded" | "failed" | "pending";
  createdAt: string;
};

export type AdminLedgerEntry = {
  id: number;
  createdAt: string;
  kind: string;
  amount: number;
  reason?: string | null;
  idempotencyKey?: string | null;
};

export type AdminPaymentReconciliation = {
  id: number;
  userEmail: string;
  amount: number;
  status: Payment["status"];
  createdAt: string;
  bidPackId?: number | null;
  bidPackName?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceId?: string | null;
  ledgerEntries: AdminLedgerEntry[];
  balanceAudit: {
    cachedBalance: number;
    derivedBalance: number;
    difference: number;
  };
};
