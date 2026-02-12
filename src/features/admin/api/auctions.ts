import client from "@api/client";
import type { AuctionSummary } from "@features/auctions/types/auction";
import { statusFromApi, statusToApi } from "@features/auctions/api/status";
import type { ApiJsonResponse } from "@api/openapi-helpers";

type AdminAuctionApiRecord =
  ApiJsonResponse<"/api/v1/admin/auctions", "get"> extends Array<infer Item>
    ? Item
    : never;

type AdminAuctionsListResponse =
  | ApiJsonResponse<"/api/v1/admin/auctions", "get">
  | { auctions?: AdminAuctionApiRecord[] };

type AdminAuctionResponse =
  | ApiJsonResponse<"/api/v1/auctions/{id}", "get">
  | ApiJsonResponse<"/api/v1/auctions", "post">
  | ApiJsonResponse<"/api/v1/auctions/{id}", "put">
  | ApiJsonResponse<"/api/v1/auctions/{id}", "patch">
  | { auction?: AuctionSummary };

type NormalizableAuction = {
  id: number;
  title: string;
  current_price: number | string;
  status?: string;
  image_url?: string | null;
  description?: string;
  start_date?: string;
  end_time?: string;
  highest_bidder_id?: number | null;
  winning_user_name?: string | null;
  bid_count?: number;
};

const normalizeAuction = (auction: NormalizableAuction): AuctionSummary => ({
  id: auction.id,
  title: auction.title,
  description: auction.description ?? "",
  current_price: parseFloat(String(auction.current_price)),
  image_url: auction.image_url ?? "",
  status: statusFromApi(auction.status),
  start_date: auction.start_date ?? "",
  end_time: auction.end_time ?? "",
  highest_bidder_id: auction.highest_bidder_id ?? null,
  winning_user_name: auction.winning_user_name ?? null,
  bid_count: auction.bid_count,
});

export const getAdminAuctions = async () => {
  const res = await client.get<AdminAuctionsListResponse>(
    "/api/v1/admin/auctions",
  );
  const payload = res.data;
  const auctions = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { auctions?: unknown }).auctions)
      ? ((payload as { auctions: AdminAuctionApiRecord[] }).auctions ?? [])
      : [];
  return auctions.map(normalizeAuction);
};

export const createAuction = async (
  payload: Partial<AuctionSummary> & { title: string },
) => {
  const { status, ...restPayload } = payload;
  const auctionPayload: Omit<Partial<AuctionSummary>, "status"> & {
    status?: ReturnType<typeof statusToApi>;
  } = {
    ...restPayload,
  };
  if (status !== undefined) {
    auctionPayload.status = statusToApi(status);
  }

  const res = await client.post<AdminAuctionResponse>(
    "/api/v1/admin/auctions",
    {
      auction: auctionPayload,
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
