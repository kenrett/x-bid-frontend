import type { StorefrontKey } from "../../../storefront/getStorefrontKey";
export type AuctionStatus =
  | "inactive"
  | "active"
  | "scheduled"
  | "complete"
  | "cancelled";
import type { Bid } from "./bid";

export interface AuctionSummary {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  status: AuctionStatus;
  start_date: string;
  end_time: string;
  storefront_key?: StorefrontKey | null;
  is_adult?: boolean;
  is_marketplace?: boolean;
  highest_bidder_id: number | null;
  winning_user_name?: string | null;
  bid_count?: number;
}

export interface AuctionDetail extends AuctionSummary {
  bids: Bid[];
}
