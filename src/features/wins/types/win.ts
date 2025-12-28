export type WinFulfillmentStatus =
  | "unclaimed"
  | "claimed"
  | "processing"
  | "shipped"
  | "delivered"
  | "fulfilled"
  | "cancelled"
  | "canceled"
  | "unknown";

export type WinSummary = {
  auctionId: number;
  auctionTitle: string;
  endedAt: string;
  finalPrice: number;
  currency: string | null;
  fulfillmentStatus: WinFulfillmentStatus;
};

export type WinDetail = WinSummary & {
  fulfillmentNote?: string | null;
};
