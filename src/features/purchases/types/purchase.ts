export type PurchaseStatus = "pending" | "succeeded" | "failed" | "refunded";

export type PurchaseSummary = {
  id: number;
  createdAt: string;
  bidPackId?: number | null;
  bidPackName: string | null;
  credits: number | null;
  amount: number;
  currency: string | null;
  status: PurchaseStatus;
};

export type PurchaseDetail = PurchaseSummary & {
  receiptUrl?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceId?: string | null;
  stripeEventId?: string | null;
};
