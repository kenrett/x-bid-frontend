import client from "../client";
import type { AuctionSummary } from "../../types/auction";
import { statusFromApi, statusToApi } from "../status";
import type { ApiJsonResponse } from "../openapi-helpers";

type AdminAuctionResponse =
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "get">
  | ApiJsonResponse<"/api/v1/admin/auctions", "post">
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "put">
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "patch">
  | { auction?: AuctionSummary };

const normalizeAuction = (auction: AuctionSummary): AuctionSummary => ({
  ...auction,
  status: statusFromApi(auction.status),
  current_price: parseFloat(String(auction.current_price)),
});

export const createAuction = async (
  payload: Partial<AuctionSummary> & { title: string },
) => {
  const res = await client.post<AdminAuctionResponse>("/auctions", {
    ...payload,
    status: statusToApi(payload.status),
  });
  const data =
    (res.data as { auction?: AuctionSummary })?.auction ??
    (res.data as AuctionSummary);
  return normalizeAuction(data);
};

export const updateAuction = async (
  id: number,
  updates: Partial<AuctionSummary>,
) => {
  const res = await client.put<AdminAuctionResponse>(`/auctions/${id}`, {
    ...updates,
    status: statusToApi(updates.status),
  });
  const data =
    (res.data as { auction?: AuctionSummary })?.auction ??
    (res.data as AuctionSummary);
  return normalizeAuction(data);
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/auctions/${id}`);
};
