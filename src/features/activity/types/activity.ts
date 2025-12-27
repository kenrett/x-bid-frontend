export type ActivityKind = "bid" | "watch" | "outcome" | "unknown";

export type ActivityItemBase = {
  id: string;
  occurredAt: string;
  auctionId: number;
  auctionTitle: string;
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
};

export type OutcomeActivity = ActivityItemBase & {
  kind: "outcome";
  outcome: "won" | "lost";
  finalBid?: number | null;
};

export type UnknownActivity = ActivityItemBase & {
  kind: "unknown";
};

export type ActivityItem =
  | BidActivity
  | WatchActivity
  | OutcomeActivity
  | UnknownActivity;

export type ActivityFilter = "all" | "bid" | "watch" | "outcome";

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
