export type PurchaseStatus = "pending" | "succeeded" | "failed" | "refunded";

export type PurchaseSummary = {
  id: number;
  createdAt: string;
  bidPackId?: number | null;
  bidPackName: string | null;
  credits: number | null;
  creditsAdded?: number | null;
  amount: number;
  currency: string | null;
  status: PurchaseStatus;
  paymentStatus?: string | null;
  ledgerGrantEntryId?: number | null;
  receiptUrl?: string | null;
};

export type PurchaseDetail = PurchaseSummary & {
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceId?: string | null;
  stripeEventId?: string | null;
};
