import client from "./client";
import type { Bid } from "../types/bid";
import type { AuctionDetail } from "../types/auction";
import type { ApiJsonResponse } from "./openapi-helpers";

export type PlaceBidResponse = ApiJsonResponse<
  "/api/v1/auctions/{auction_id}/bids",
  "post"
> & {
  success?: boolean;
  bid?: Bid;
  bidCredits?: number;
  auction?: AuctionDetail;
};

export const placeBid = async (
  auctionId: number,
): Promise<PlaceBidResponse> => {
  const response = await client.post(`/auctions/${auctionId}/bids`);
  return response.data;
};

export type BidHistoryResponse = ApiJsonResponse<
  "/api/v1/auctions/{auction_id}/bid_history",
  "get"
> & {
  auction?: {
    winning_user_id?: number | null;
    winning_user_name?: string | null;
  };
  bids?: Bid[];
};

export const getBidHistory = async (
  auctionId: number,
): Promise<BidHistoryResponse> => {
  const response = await client.get<BidHistoryResponse>(
    `auctions/${auctionId}/bid_history`,
  );
  const data = response.data ?? {};
  return {
    auction: {
      winning_user_id: data.auction?.winning_user_id ?? null,
      winning_user_name: data.auction?.winning_user_name ?? null,
    },
    bids: Array.isArray(data.bids) ? data.bids : [],
  };
};
