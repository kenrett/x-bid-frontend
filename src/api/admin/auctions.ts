import client from "../client";
import type { AuctionData, AuctionStatus } from "../../types/auction";

const toApiStatus = (status: AuctionStatus | undefined) => {
  if (status === "scheduled") return "pending";
  if (status === "complete") return "ended";
  return status ?? "inactive";
};

const normalizeStatus = (status: string | undefined): AuctionStatus => {
  if (status === "pending") return "scheduled";
  if (status === "ended") return "complete";
  if (status === "cancelled") return "cancelled";
  if (status === "active") return "active";
  if (status === "scheduled") return "scheduled";
  if (status === "complete") return "complete";
  return "inactive";
};

const normalizeAuction = (auction: AuctionData): AuctionData => ({
  ...auction,
  status: normalizeStatus(auction.status),
  current_price: parseFloat(String(auction.current_price)),
});

export const createAuction = async (
  payload: Partial<AuctionData> & { title: string }
) => {
  const res = await client.post<AuctionData>("/auctions", {
    ...payload,
    status: toApiStatus(payload.status),
  });
  return normalizeAuction(res.data);
};

export const updateAuction = async (
  id: number,
  updates: Partial<AuctionData>
) => {
  const res = await client.put<AuctionData>(`/auctions/${id}`, {
    ...updates,
    status: toApiStatus(updates.status),
  });
  return normalizeAuction(res.data);
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
