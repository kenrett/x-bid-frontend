import client from "../client";
import type { AuctionDetail, AuctionSummary } from "../../types/auction";
import { statusFromApi, statusToApi } from "../status";

const normalizeAuction = (auction: AuctionSummary): AuctionSummary => ({
  ...auction,
  status: statusFromApi(auction.status),
  current_price: parseFloat(String(auction.current_price)),
});

export const createAuction = async (
  payload: Partial<AuctionSummary> & { title: string }
) => {
  const res = await client.post<AuctionSummary>("/auctions", {
    ...payload,
    status: statusToApi(payload.status),
  });
  return normalizeAuction(res.data);
};

export const updateAuction = async (
  id: number,
  updates: Partial<AuctionSummary>
) => {
  const res = await client.put<AuctionSummary>(`/auctions/${id}`, {
    ...updates,
    status: statusToApi(updates.status),
  });
  return normalizeAuction(res.data);
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
