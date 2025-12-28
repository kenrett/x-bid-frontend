export type CheckoutSuccessResponse =
  | {
      status: "success";
      updated_bid_credits: number;
      purchaseId?: string | number;
    }
  | { status: "error"; error?: string };
