import client from "@api/client";
import type { BidPack } from "@features/auctions/types/bidPack";
import type { ApiJsonResponse } from "@api/openapi-helpers";

type BidPackPayload = Partial<BidPack> & { name: string };

type AdminBidPackResponse =
  | ApiJsonResponse<"/api/v1/admin/bid-packs", "get">
  | ApiJsonResponse<"/api/v1/admin/bid-packs/{id}", "get">
  | ApiJsonResponse<"/api/v1/admin/bid-packs", "post">
  | ApiJsonResponse<"/api/v1/admin/bid-packs/{id}", "put">
  | ApiJsonResponse<"/api/v1/admin/bid-packs/{id}", "patch">
  | { bid_pack?: BidPack };

const normalizeBidPack = (pack: BidPack): BidPack => {
  const price = parseFloat(String(pack.price));
  const bids = Number(pack.bids);
  const status: BidPack["status"] =
    pack.status === "retired" || pack.status === "active"
      ? pack.status
      : typeof pack.active === "boolean"
        ? pack.active
          ? "active"
          : "retired"
        : "active";

  const active =
    typeof pack.active === "boolean" ? pack.active : status === "active";

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
    status,
    active,
  };
};

export const listBidPacks = async () => {
  const res = await client.get<AdminBidPackResponse | { bid_packs?: unknown }>(
    "/api/v1/admin/bid-packs",
  );

  const payload = res.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { bid_packs?: unknown }).bid_packs)
      ? (payload as { bid_packs: unknown[] }).bid_packs
      : [];

  return list.map((pack) => normalizeBidPack(pack as BidPack));
};

export const getBidPack = async (id: number) => {
  const res = await client.get<AdminBidPackResponse>(
    `/api/v1/admin/bid-packs/${id}`,
  );
  const pack =
    (res.data as { bid_pack?: BidPack }).bid_pack ?? (res.data as BidPack);
  return normalizeBidPack(pack);
};

export const createBidPack = async (payload: BidPackPayload) => {
  const res = await client.post<AdminBidPackResponse>(
    "/api/v1/admin/bid-packs",
    payload,
  );
  const pack =
    (res.data as { bid_pack?: BidPack }).bid_pack ?? (res.data as BidPack);
  return normalizeBidPack(pack);
};

export const updateBidPack = async (id: number, payload: Partial<BidPack>) => {
  const res = await client.put<AdminBidPackResponse>(
    `/api/v1/admin/bid-packs/${id}`,
    payload,
  );
  const pack =
    (res.data as { bid_pack?: BidPack }).bid_pack ?? (res.data as BidPack);
  return normalizeBidPack(pack);
};

export const deleteBidPack = async (id: number) => {
  await client.delete(`/api/v1/admin/bid-packs/${id}`);
};
