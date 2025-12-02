export interface BidPack {
  id: number;
  name: string;
  description: string;
  bids: number;
  price: number;
  pricePerBid: string;
  highlight: boolean;
  status: "active" | "retired";
  active: boolean;
}
