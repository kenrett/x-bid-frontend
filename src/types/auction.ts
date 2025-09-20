export type AuctionStatus = 'inactive' | 'active' | 'scheduled' | 'complete';

export interface Auction {
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  status: AuctionStatus;
  start_date: string;
}
