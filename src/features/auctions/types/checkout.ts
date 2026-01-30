export type CheckoutSuccessResponse = {
  status?: string | null;
  payment_status?: string | null;
  updated_bid_credits?: number | null;
  applied?: boolean | null;
  idempotent?: boolean | null;
  purchaseId?: string | number;
  message?: string | null;
  error?: string | null;
};
