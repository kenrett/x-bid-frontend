import client from "@api/client";
import type { AuctionSummary } from "@features/auctions/types/auction";
import { statusFromApi, statusToApi } from "@features/auctions/api/status";
import type { ApiJsonResponse } from "@api/openapi-helpers";

type AdminAuctionResponse =
  | ApiJsonResponse<"/api/v1/auctions/{id}", "get">
  | ApiJsonResponse<"/api/v1/auctions", "post">
  | ApiJsonResponse<"/api/v1/auctions/{id}", "put">
  | ApiJsonResponse<"/api/v1/auctions/{id}", "patch">
  | { auction?: AuctionSummary };

const normalizeAuction = (auction: AuctionSummary): AuctionSummary => ({
  ...auction,
  status: statusFromApi(auction.status),
  current_price: parseFloat(String(auction.current_price)),
});

export const createAuction = async (
  payload: Partial<AuctionSummary> & { title: string },
) => {
  const res = await client.post<AdminAuctionResponse>(
    "/api/v1/admin/auctions",
    {
      auction: {
        ...payload,
        status: statusToApi(payload.status),
      },
    },
  );
  const data =
    (res.data as { auction?: AuctionSummary })?.auction ??
    (res.data as AuctionSummary);
  return normalizeAuction(data);
};

export const updateAuction = async (
  id: number,
  updates: Partial<AuctionSummary>,
) => {
  const { status, ...restUpdates } = updates;
  const auctionPayload: Omit<Partial<AuctionSummary>, "status"> & {
    status?: ReturnType<typeof statusToApi>;
  } = { ...restUpdates };
  if (status !== undefined) {
    auctionPayload.status = statusToApi(status);
  }

  const res = await client.put<AdminAuctionResponse>(
    `/api/v1/admin/auctions/${id}`,
    {
      auction: auctionPayload,
    },
  );
  const data =
    (res.data as { auction?: AuctionSummary })?.auction ??
    (res.data as AuctionSummary);
  return normalizeAuction(data);
};

export const deleteAuction = async (id: number) => {
  await client.delete(`/api/v1/admin/auctions/${id}`);
};
