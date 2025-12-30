export type ActivityKind =
  | "bid"
  | "watch"
  | "outcome"
  | "fulfillment"
  | "unknown";

export type ActivityItemBase = {
  id: string;
  occurredAt: string;
  auctionId: number;
  auctionTitle: string;
  title?: string | null;
  message?: string | null;
  auctionStatus?: string | null;
  auctionEndsAt?: string | null;
  auctionCurrentPrice?: number | null;
  kind: ActivityKind;
};

export type BidActivity = ActivityItemBase & {
  kind: "bid";
  bidAmount: number;
  balanceDelta: number;
};

export type WatchActivity = ActivityItemBase & {
  kind: "watch";
  action?: "added" | "removed";
};

export type OutcomeActivity = ActivityItemBase & {
  kind: "outcome";
  outcome: "won" | "lost";
  finalBid?: number | null;
};

export type FulfillmentActivity = ActivityItemBase & {
  kind: "fulfillment";
  fromStatus?: string | null;
  toStatus?: string | null;
  status?: string | null;
  settlementId?: number | null;
  trackingUrl?: string | null;
};

export type UnknownActivity = ActivityItemBase & {
  kind: "unknown";
};

export type ActivityItem =
  | BidActivity
  | WatchActivity
  | OutcomeActivity
  | FulfillmentActivity
  | UnknownActivity;

export type ActivityFilter =
  | "all"
  | "bid"
  | "watch"
  | "outcome"
  | "fulfillment";

export type ActivityListParams = {
  page?: number;
  perPage?: number;
};

export type ActivityListResponse = {
  items: ActivityItem[];
  page: number;
  perPage: number;
  hasMore: boolean;
};
