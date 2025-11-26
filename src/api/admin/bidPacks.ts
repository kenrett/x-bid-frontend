import client from "../client";
import type { BidPack } from "../../types/bidPack";

type BidPackPayload = Partial<BidPack> & { name: string };

const normalizeBidPack = (pack: BidPack): BidPack => {
  const price = parseFloat(String(pack.price));
  const bids = Number(pack.bids);

  const pricePerBid =
    pack.pricePerBid !== undefined && pack.pricePerBid !== null
      ? String(pack.pricePerBid)
      : bids > 0 && !Number.isNaN(price)
        ? (price / bids).toFixed(2)
        : "0.00";

  return {
    ...pack,
    price: Number.isNaN(price) ? 0 : price,
    pricePerBid,
    highlight: Boolean(pack.highlight),
  };
};

export const listBidPacks = async () => {
  const res = await client.get<BidPack[]>("/bid_packs");
  return res.data.map(normalizeBidPack);
};

export const getBidPack = async (id: number) => {
  const res = await client.get<BidPack>(`/bid_packs/${id}`);
  return normalizeBidPack(res.data);
};

export const createBidPack = async (payload: BidPackPayload) => {
  const res = await client.post<BidPack>("/bid_packs", payload);
  return normalizeBidPack(res.data);
};

export const updateBidPack = async (id: number, payload: Partial<BidPack>) => {
  const res = await client.put<BidPack>(`/bid_packs/${id}`, payload);
  return normalizeBidPack(res.data);
};

export const deleteBidPack = async (id: number) => {
  await client.delete(`/bid_packs/${id}`);
};
