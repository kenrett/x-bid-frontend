export type AuctionStatus = 'inactive' | 'active' | 'scheduled' | 'complete';

export interface AuctionData {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  status: AuctionStatus;
  start_date: string;
  highest_bidder_id: number;
  bids: number;
}
