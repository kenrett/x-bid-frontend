import client from "@api/client";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";
import type {
  WinClaimAddress,
  WinDetail,
  WinFulfillmentStatus,
  WinSummary,
} from "../types/win";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeStatus = (value: unknown): WinFulfillmentStatus => {
  const status = typeof value === "string" ? value.toLowerCase() : "";
  if (!status) return "unknown";
  if (
    status === "pending" ||
    status === "unclaimed" ||
    status === "pending_claim" ||
    status === "awaiting_claim"
  )
    return "pending";
  if (status === "claimed") return "claimed";
  if (status === "processing" || status === "packing") return "processing";
  if (status === "shipped" || status === "in_transit") return "shipped";
  if (status === "delivered") return "delivered";
  if (status === "fulfilled" || status === "complete") return "fulfilled";
  if (status === "canceled" || status === "cancelled") return status;
  return "unknown";
};

const extractWinsArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload as unknown[];
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.wins,
    record.items,
    record.data,
    (record as { wins?: { data?: unknown[] } }).wins?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as unknown[];
  }

  return null;
};

const normalizeMoney = (data: Record<string, unknown>) => {
  const cents =
    toNumber((data as { final_price_cents?: unknown }).final_price_cents) ??
    toNumber((data as { price_cents?: unknown }).price_cents) ??
    toNumber((data as { amount_cents?: unknown }).amount_cents) ??
    null;
  const amount =
    cents !== null
      ? cents / 100
      : (toNumber((data as { final_price?: unknown }).final_price) ??
        toNumber((data as { price?: unknown }).price) ??
        toNumber((data as { amount?: unknown }).amount) ??
        0);

  const currency =
    typeof (data as { currency?: unknown }).currency === "string"
      ? (data as { currency: string }).currency || null
      : typeof (data as { currency_code?: unknown }).currency_code === "string"
        ? (data as { currency_code: string }).currency_code || null
        : typeof (data as { currencyCode?: unknown }).currencyCode === "string"
          ? (data as { currencyCode: string }).currencyCode || null
          : null;

  return {
    finalPrice: Number.isFinite(amount) ? amount : 0,
    currency,
  };
};

const normalizeWin = (raw: unknown): WinDetail => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const auction =
    data.auction && typeof data.auction === "object"
      ? (data.auction as Record<string, unknown>)
      : null;

  const auctionId =
    toNumber((auction as { id?: unknown })?.id) ??
    toNumber((data as { auction_id?: unknown }).auction_id) ??
    toNumber((data as { auctionId?: unknown }).auctionId);

  if (auctionId === null) {
    throw reportUnexpectedResponse("wins.normalizeWin.auctionId", raw);
  }

  const auctionTitle =
    typeof (auction as { title?: unknown })?.title === "string"
      ? (auction as { title: string }).title
      : typeof (auction as { name?: unknown })?.name === "string"
        ? (auction as { name: string }).name
        : typeof (data as { auction_title?: unknown }).auction_title ===
            "string"
          ? (data as { auction_title: string }).auction_title
          : typeof (data as { auctionTitle?: unknown }).auctionTitle ===
              "string"
            ? (data as { auctionTitle: string }).auctionTitle
            : "Auction";

  const endedAt =
    typeof (auction as { ended_at?: unknown })?.ended_at === "string"
      ? (auction as { ended_at: string }).ended_at
      : typeof (auction as { ends_at?: unknown })?.ends_at === "string"
        ? (auction as { ends_at: string }).ends_at
        : typeof (data as { ended_at?: unknown }).ended_at === "string"
          ? (data as { ended_at: string }).ended_at
          : typeof (data as { endedAt?: unknown }).endedAt === "string"
            ? (data as { endedAt: string }).endedAt
            : "";

  const fulfillmentStatus = normalizeStatus(
    (data as { fulfillment_status?: unknown }).fulfillment_status ??
      (data as { fulfillmentStatus?: unknown }).fulfillmentStatus ??
      ((data as { fulfillment?: unknown }).fulfillment &&
      typeof (data as { fulfillment: unknown }).fulfillment === "object"
        ? ((data as { fulfillment: { status?: unknown } }).fulfillment.status ??
          (data as { fulfillment: { state?: unknown } }).fulfillment.state)
        : null),
  );

  const { finalPrice, currency } = normalizeMoney({
    ...(auction ?? {}),
    ...data,
  });

  const fulfillmentNote =
    typeof (data as { fulfillment_note?: unknown }).fulfillment_note ===
    "string"
      ? (data as { fulfillment_note: string }).fulfillment_note
      : typeof (data as { fulfillmentNote?: unknown }).fulfillmentNote ===
          "string"
        ? (data as { fulfillmentNote: string }).fulfillmentNote
        : null;

  return {
    auctionId,
    auctionTitle,
    endedAt,
    finalPrice,
    currency,
    fulfillmentStatus,
    fulfillmentNote,
  };
};

const toSummary = (detail: WinDetail): WinSummary => ({
  auctionId: detail.auctionId,
  auctionTitle: detail.auctionTitle,
  endedAt: detail.endedAt,
  finalPrice: detail.finalPrice,
  currency: detail.currency,
  fulfillmentStatus: detail.fulfillmentStatus,
});

const list = async (): Promise<WinSummary[]> => {
  const response = await client.get("/api/v1/me/wins");
  const wins = extractWinsArray(response.data);
  if (!wins) throw reportUnexpectedResponse("wins.list", response.data);

  return wins.map((item, index) => {
    try {
      return toSummary(normalizeWin(item));
    } catch {
      throw reportUnexpectedResponse(`wins.list[${index}]`, item);
    }
  });
};

const get = async (auctionId: number | string): Promise<WinDetail> => {
  const response = await client.get(`/api/v1/me/wins/${auctionId}`);
  try {
    return normalizeWin(response.data);
  } catch {
    throw reportUnexpectedResponse("wins.get", response.data);
  }
};

export const winsApi = {
  list,
  get,
  claim: async (
    auctionId: number | string,
    address: WinClaimAddress,
  ): Promise<WinDetail> => {
    const response = await client.post(`/api/v1/me/wins/${auctionId}/claim`, {
      address,
    });
    try {
      return normalizeWin(response.data);
    } catch {
      throw reportUnexpectedResponse("wins.claim", response.data);
    }
  },
};
