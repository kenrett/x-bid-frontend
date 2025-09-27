export type AuctionStatus = 'inactive' | 'active' | 'scheduled' | 'complete';
import type { Bid } from './bid';

export interface AuctionData {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  status: AuctionStatus;
  start_date: string;
  end_time: string;
  highest_bidder_id: number;
  bids: Bid[] | number;
}
