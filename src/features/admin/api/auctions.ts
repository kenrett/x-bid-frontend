import client from "@api/client";
import type { AuctionSummary } from "@features/auctions/types/auction";
import { statusFromApi, statusToApi } from "@features/auctions/api/status";
import type { ApiJsonResponse } from "@api/openapi-helpers";
import {
  isStorefrontKey,
  type StorefrontKey,
} from "../../../storefront/getStorefrontKey";

type AdminAuctionApiRecord =
  ApiJsonResponse<"/api/v1/admin/auctions", "get"> extends Array<infer Item>
    ? Item
    : never;

type AdminAuctionsListResponse =
  | ApiJsonResponse<"/api/v1/admin/auctions", "get">
  | { auctions?: AdminAuctionApiRecord[] };

type AdminAuctionResponse =
  | ApiJsonResponse<"/api/v1/admin/auctions", "post">
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "put">
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "patch">
  | ApiJsonResponse<"/api/v1/admin/auctions/{id}", "get">
  | { auction?: NormalizableAuction };

type AdminAuctionFilters = {
  storefront_key?: StorefrontKey;
};

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
  storefront_key?: StorefrontKey | null;
  is_adult?: boolean | null;
  is_marketplace?: boolean | null;
};

const normalizeStorefrontKey = (value: unknown): StorefrontKey | null =>
  isStorefrontKey(value) ? value : null;

const normalizeAuction = (auction: NormalizableAuction): AuctionSummary => ({
  id: auction.id,
  title: auction.title,
  description: auction.description ?? "",
  current_price: parseFloat(String(auction.current_price)),
  image_url: auction.image_url ?? "",
  status: statusFromApi(auction.status),
  start_date: auction.start_date ?? "",
  end_time: auction.end_time ?? "",
  storefront_key: normalizeStorefrontKey(auction.storefront_key),
  is_adult: auction.is_adult === true,
  is_marketplace: auction.is_marketplace === true,
  highest_bidder_id: auction.highest_bidder_id ?? null,
  winning_user_name: auction.winning_user_name ?? null,
  bid_count: auction.bid_count,
});

export const getAdminAuctions = async (filters: AdminAuctionFilters = {}) => {
  const res = filters.storefront_key
    ? await client.get<AdminAuctionsListResponse>("/api/v1/admin/auctions", {
        params: { storefront_key: filters.storefront_key },
      })
    : await client.get<AdminAuctionsListResponse>("/api/v1/admin/auctions");
  const payload = res.data;
  const auctions = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { auctions?: unknown }).auctions)
      ? ((payload as { auctions: AdminAuctionApiRecord[] }).auctions ?? [])
      : [];
  return auctions.map(normalizeAuction);
};

export const getAdminAuction = async (id: number) => {
  const res = await client.get<AdminAuctionResponse>(
    `/api/v1/admin/auctions/${id}`,
  );
  const data =
    (res.data as { auction?: NormalizableAuction })?.auction ??
    (res.data as NormalizableAuction);
  return normalizeAuction(data);
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
