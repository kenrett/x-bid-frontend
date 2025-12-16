import client from "@api/client";
import type { Bid } from "../types/bid";
import type { AuctionDetail } from "../types/auction";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";

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
  const response = await client.post(`/api/v1/auctions/${auctionId}/bids`);
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
    `/api/v1/auctions/${auctionId}/bid_history`,
  );
  const data = response.data ?? {};

  if (!data || typeof data !== "object") {
    throw reportUnexpectedResponse("getBidHistory", data);
  }

  const incomingAuction = (data as { auction?: unknown }).auction;
  if (incomingAuction !== undefined && incomingAuction !== null) {
    if (typeof incomingAuction !== "object") {
      throw reportUnexpectedResponse("getBidHistory.auction", data);
    }
  }

  if (!Array.isArray((data as { bids?: unknown }).bids)) {
    throw reportUnexpectedResponse("getBidHistory.bids", data);
  }
  return {
    auction: {
      winning_user_id:
        (incomingAuction as { winning_user_id?: number | null })
          ?.winning_user_id ?? null,
      winning_user_name:
        (incomingAuction as { winning_user_name?: string | null })
          ?.winning_user_name ?? null,
    },
    bids: (data as { bids: Bid[] }).bids as Bid[],
  };
};
