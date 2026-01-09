export type WalletSummary = {
  creditsBalance: number;
  asOf: string | null;
  currency?: string | null;
};

import type { StorefrontKey } from "../../../storefront/storefront";

export type WalletTransaction = {
  id: string;
  occurredAt: string;
  kind: string;
  amount: number;
  reason?: string | null;
  purchaseUrl?: string | null;
  auctionUrl?: string | null;
  storefrontKey?: StorefrontKey | null;
};

export type WalletTransactionsPage = {
  transactions: WalletTransaction[];
  page: number;
  perPage: number;
  totalCount?: number | null;
  hasMore: boolean;
};
