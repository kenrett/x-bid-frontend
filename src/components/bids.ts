import type { Bid } from '../types/bid';
import { apiClient } from './apiClient';

export const getBids = async (auctionId: number): Promise<Bid[]> => {
  const response = await apiClient.get(`/auctions/${auctionId}/bids`);
  // The API returns bids directly as an array
  return response.data;
};

// You can move placeBid from auctions.ts to here if you prefer
// export const placeBid = ...