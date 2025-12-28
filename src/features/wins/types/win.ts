export type WinFulfillmentStatus =
  | "pending"
  | "unclaimed"
  | "claimed"
  | "processing"
  | "shipped"
  | "delivered"
  | "fulfilled"
  | "cancelled"
  | "canceled"
  | "unknown";

export type WinClaimAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

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
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};
