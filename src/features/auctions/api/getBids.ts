import type { Bid } from "../types/bid";
import client from "@api/client";

export const getBids = async (auctionId: number): Promise<Bid[]> => {
  const response = await client.get<Bid[]>(
    `/api/v1/auctions/${auctionId}/bids`,
  );
  // The API returns bids directly as an array
  return response.data;
};
