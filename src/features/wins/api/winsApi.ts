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

const normalizeCarrier = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeTrackingNumber = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeTrackingUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

const buildTrackingUrl = (
  carrier: string | null,
  trackingNumber: string | null,
): string | null => {
  if (!trackingNumber) return null;

  const normalizedCarrier = (carrier ?? "").toLowerCase();
  const encoded = encodeURIComponent(trackingNumber);

  if (normalizedCarrier.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${encoded}`;
  }
  if (normalizedCarrier.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  }
  if (
    normalizedCarrier.includes("fedex") ||
    normalizedCarrier.includes("fed ex")
  ) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  }
  if (normalizedCarrier.includes("dhl")) {
    return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
  }

  return null;
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

  const fulfillment =
    (data as { fulfillment?: unknown }).fulfillment &&
    typeof (data as { fulfillment: unknown }).fulfillment === "object"
      ? ((data as { fulfillment: Record<string, unknown> })
          .fulfillment as Record<string, unknown>)
      : null;

  const shippingCarrier =
    normalizeCarrier((fulfillment as { carrier?: unknown })?.carrier) ??
    normalizeCarrier(
      (fulfillment as { shipping_carrier?: unknown })?.shipping_carrier,
    ) ??
    normalizeCarrier(
      (data as { shipping_carrier?: unknown }).shipping_carrier,
    ) ??
    normalizeCarrier((data as { carrier?: unknown }).carrier) ??
    null;

  const trackingNumber =
    normalizeTrackingNumber(
      (fulfillment as { tracking_number?: unknown })?.tracking_number,
    ) ??
    normalizeTrackingNumber(
      (fulfillment as { trackingNumber?: unknown })?.trackingNumber,
    ) ??
    normalizeTrackingNumber(
      (data as { tracking_number?: unknown }).tracking_number,
    ) ??
    normalizeTrackingNumber(
      (data as { trackingNumber?: unknown }).trackingNumber,
    ) ??
    null;

  const trackingUrl =
    normalizeTrackingUrl(
      (fulfillment as { tracking_url?: unknown })?.tracking_url,
    ) ??
    normalizeTrackingUrl(
      (fulfillment as { trackingUrl?: unknown })?.trackingUrl,
    ) ??
    normalizeTrackingUrl((data as { tracking_url?: unknown }).tracking_url) ??
    normalizeTrackingUrl((data as { trackingUrl?: unknown }).trackingUrl) ??
    buildTrackingUrl(shippingCarrier, trackingNumber);

  return {
    auctionId,
    auctionTitle,
    endedAt,
    finalPrice,
    currency,
    fulfillmentStatus,
    fulfillmentNote,
    shippingCarrier,
    trackingNumber,
    trackingUrl,
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
