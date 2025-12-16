export type CheckoutSuccessResponse =
  | { status: "success"; updated_bid_credits: number }
  | { status: "error"; error?: string };
