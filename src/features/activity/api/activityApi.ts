import client from "@api/client";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";
import type {
  ActivityItem,
  ActivityListParams,
  ActivityListResponse,
  ActivityKind,
} from "../types/activity";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeKind = (value: unknown): ActivityKind => {
  // Backend -> frontend "My Activity" mapping (current contract):
  // - "bid_placed"      => kind "bid"
  // - "auction_watched" => kind "watch" (action: "added")
  // - "auction_unwatched" (or other watch-removal type) => kind "watch" (action: "removed")
  // - "auction_won"     => kind "outcome" (outcome: "won")
  // - "auction_lost"    => kind "outcome" (outcome: "lost")
  // - "fulfillment_status_changed" (or "fulfillment_shipped") => kind "fulfillment"
  // Any other/unknown type string falls back to kind "unknown".
  const lower = typeof value === "string" ? value.toLowerCase() : "";
  if (lower === "bid_placed") return "bid";
  if (lower === "auction_watched") return "watch";
  if (
    lower === "auction_unwatched" ||
    lower === "auction_unwatch" ||
    lower === "auction_watch_removed" ||
    lower === "watch_removed"
  )
    return "watch";
  if (lower === "auction_won") return "outcome";
  if (lower === "auction_lost") return "outcome";
  if (lower === "fulfillment_status_changed") return "fulfillment";
  if (lower === "fulfillment_shipped") return "fulfillment";
  return "unknown";
};

const extractItemsArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload as unknown[];
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as unknown[];
  if (Array.isArray(record.data)) return record.data as unknown[];
  if (
    record.items &&
    typeof record.items === "object" &&
    Array.isArray((record.items as { data?: unknown[] }).data)
  ) {
    return (record.items as { data: unknown[] }).data;
  }
  return null;
};

const normalizeActivity = (raw: unknown): ActivityItem => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const typedData =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};

  const titleRaw =
    typeof data.title === "string"
      ? data.title
      : typeof (typedData as { title?: unknown }).title === "string"
        ? (typedData as { title: string }).title
        : null;
  const title = titleRaw && titleRaw.trim() !== "" ? titleRaw : null;

  const messageRaw =
    typeof (typedData as { summary?: unknown }).summary === "string"
      ? (typedData as { summary: string }).summary
      : typeof (typedData as { message?: unknown }).message === "string"
        ? (typedData as { message: string }).message
        : typeof (data as { summary?: unknown }).summary === "string"
          ? (data as { summary: string }).summary
          : typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : null;
  const message = messageRaw && messageRaw.trim() !== "" ? messageRaw : null;

  const auction =
    data.auction && typeof data.auction === "object"
      ? (data.auction as Record<string, unknown>)
      : null;

  const auctionIdRaw =
    toNumber((auction as { id?: unknown })?.id) ??
    toNumber((data as { auction_id?: unknown }).auction_id) ??
    toNumber((typedData as { auction_id?: unknown }).auction_id) ??
    toNumber((typedData as { auctionId?: unknown }).auctionId);
  const auctionId = auctionIdRaw ?? 0;

  const auctionTitle =
    typeof (auction as { title?: unknown })?.title === "string"
      ? (auction as { title: string }).title
      : "Auction";

  const auctionStatus =
    typeof (auction as { status?: unknown })?.status === "string"
      ? (auction as { status: string }).status
      : null;
  const auctionEndsAt =
    typeof (auction as { ends_at?: unknown })?.ends_at === "string"
      ? (auction as { ends_at: string }).ends_at
      : null;
  const auctionCurrentPrice =
    toNumber((auction as { current_price?: unknown })?.current_price) ?? null;

  const occurredAt =
    typeof data.occurred_at === "string"
      ? data.occurred_at
      : typeof data.created_at === "string"
        ? data.created_at
        : typeof data.timestamp === "string"
          ? data.timestamp
          : "";

  const type =
    typeof data.type === "string"
      ? data.type
      : typeof (data as { kind?: unknown }).kind === "string"
        ? (data as { kind: string }).kind
        : null;
  const kind = normalizeKind(type);

  if (kind === "bid") {
    const bidAmount = toNumber((typedData as { amount?: unknown }).amount) ?? 0;
    const balanceDelta =
      toNumber((typedData as { balance_delta?: unknown }).balance_delta) ??
      toNumber((typedData as { balanceDelta?: unknown }).balanceDelta) ??
      (bidAmount ? -bidAmount : 0);

    const bidId =
      toNumber((typedData as { bid_id?: unknown }).bid_id) ??
      toNumber((typedData as { bidId?: unknown }).bidId);

    const id =
      typeof bidId === "number"
        ? String(bidId)
        : `${type ?? "bid"}:${auctionId || "unknown"}:${occurredAt || "unknown"}`;

    return {
      id,
      occurredAt,
      auctionId,
      auctionTitle,
      title: title ?? auctionTitle,
      message,
      auctionStatus,
      auctionEndsAt,
      auctionCurrentPrice,
      kind: "bid",
      bidAmount,
      balanceDelta,
    };
  }

  if (kind === "watch") {
    const lowerType = typeof type === "string" ? type.toLowerCase() : "";
    const action: "added" | "removed" =
      lowerType === "auction_watched" ? "added" : "removed";

    const watchId =
      toNumber((typedData as { watch_id?: unknown }).watch_id) ??
      toNumber((typedData as { watchId?: unknown }).watchId);
    const id =
      typeof watchId === "number"
        ? String(watchId)
        : `${type ?? "watch"}:${auctionId || "unknown"}:${occurredAt || "unknown"}`;

    return {
      id,
      occurredAt,
      auctionId,
      auctionTitle,
      title: title ?? auctionTitle,
      message,
      auctionStatus,
      auctionEndsAt,
      auctionCurrentPrice,
      kind: "watch",
      action,
    };
  }

  if (kind === "outcome") {
    const lowerType = typeof type === "string" ? type.toLowerCase() : "";
    const outcome: "won" | "lost" =
      lowerType === "auction_won" ? "won" : "lost";

    const finalBid =
      toNumber((typedData as { winning_bid?: unknown }).winning_bid) ??
      toNumber((typedData as { final_bid?: unknown }).final_bid) ??
      toNumber((typedData as { amount?: unknown }).amount) ??
      null;

    const id = `${type ?? "outcome"}:${auctionId || "unknown"}:${occurredAt || "unknown"}`;

    return {
      id,
      occurredAt,
      auctionId,
      auctionTitle,
      title: title ?? auctionTitle,
      message,
      auctionStatus,
      auctionEndsAt,
      auctionCurrentPrice,
      kind: "outcome",
      outcome,
      finalBid,
    };
  }

  if (kind === "fulfillment") {
    const settlementId =
      toNumber((typedData as { settlement_id?: unknown }).settlement_id) ??
      toNumber((typedData as { settlementId?: unknown }).settlementId) ??
      toNumber((typedData as { win_id?: unknown }).win_id) ??
      toNumber((typedData as { winId?: unknown }).winId) ??
      null;

    const trackingUrl =
      typeof (typedData as { tracking_url?: unknown }).tracking_url === "string"
        ? (typedData as { tracking_url: string }).tracking_url
        : typeof (typedData as { trackingUrl?: unknown }).trackingUrl ===
            "string"
          ? (typedData as { trackingUrl: string }).trackingUrl
          : null;

    const fromStatus =
      typeof (typedData as { from_status?: unknown }).from_status === "string"
        ? (typedData as { from_status: string }).from_status
        : typeof (typedData as { previous_status?: unknown })
              .previous_status === "string"
          ? (typedData as { previous_status: string }).previous_status
          : typeof (typedData as { old_status?: unknown }).old_status ===
              "string"
            ? (typedData as { old_status: string }).old_status
            : null;

    const toStatus =
      typeof (typedData as { to_status?: unknown }).to_status === "string"
        ? (typedData as { to_status: string }).to_status
        : typeof (typedData as { new_status?: unknown }).new_status === "string"
          ? (typedData as { new_status: string }).new_status
          : typeof (typedData as { status?: unknown }).status === "string"
            ? (typedData as { status: string }).status
            : null;

    const status =
      typeof (typedData as { status?: unknown }).status === "string"
        ? (typedData as { status: string }).status
        : toStatus;

    const subjectId = settlementId ?? (auctionId ? auctionId : null);
    const id = `${type ?? "fulfillment"}:${subjectId ?? "unknown"}:${occurredAt || "unknown"}`;

    return {
      id,
      occurredAt,
      auctionId,
      auctionTitle,
      title: title ?? auctionTitle,
      message,
      auctionStatus,
      auctionEndsAt,
      auctionCurrentPrice,
      kind: "fulfillment",
      fromStatus,
      toStatus,
      status,
      settlementId,
      trackingUrl,
    };
  }

  const id = `${type ?? "unknown"}:${auctionId || "unknown"}:${occurredAt || "unknown"}`;
  return {
    id,
    occurredAt,
    auctionId,
    auctionTitle,
    title: title ?? auctionTitle,
    message,
    auctionStatus,
    auctionEndsAt,
    auctionCurrentPrice,
    kind: "unknown",
  };
};

const extractMeta = (
  payload: unknown,
  fallback: { page: number; perPage: number; loaded: number },
): Pick<ActivityListResponse, "page" | "perPage" | "hasMore"> => {
  if (!payload || typeof payload !== "object") {
    return {
      page: fallback.page,
      perPage: fallback.perPage,
      hasMore: false,
    };
  }

  const record = payload as Record<string, unknown>;

  const page =
    toNumber(record.page) ??
    toNumber((record as { current_page?: unknown }).current_page) ??
    fallback.page;
  const perPage =
    toNumber((record as { per_page?: unknown }).per_page) ??
    toNumber((record as { perPage?: unknown }).perPage) ??
    toNumber((record as { items?: unknown }).items) ??
    fallback.perPage;

  const hasMore =
    typeof (record as { has_more?: unknown }).has_more === "boolean"
      ? Boolean((record as { has_more: boolean }).has_more)
      : typeof (record as { hasMore?: unknown }).hasMore === "boolean"
        ? Boolean((record as { hasMore: boolean }).hasMore)
        : fallback.loaded >= (perPage ?? fallback.perPage);

  return {
    page: page ?? fallback.page,
    perPage: perPage ?? fallback.perPage,
    hasMore,
  };
};

const list = async (
  params: ActivityListParams = { page: 1, perPage: 25 },
): Promise<ActivityListResponse> => {
  const response = await client.get("/api/v1/me/activity", {
    params: { page: params.page ?? 1, per_page: params.perPage ?? 25 },
  });

  const items = extractItemsArray(response.data);
  if (!items) {
    throw reportUnexpectedResponse("activity.list", response.data);
  }

  const normalized = items.map((item, index) => {
    try {
      return normalizeActivity(item);
    } catch {
      throw reportUnexpectedResponse(`activity.list[${index}]`, item);
    }
  });

  const meta = extractMeta(response.data, {
    page: params.page ?? 1,
    perPage: params.perPage ?? 25,
    loaded: normalized.length,
  });

  return {
    items: normalized,
    page: meta.page ?? params.page ?? 1,
    perPage: meta.perPage ?? params.perPage ?? 25,
    hasMore: meta.hasMore,
  };
};

export const activityApi = {
  list,
  watch: async (auctionId: number | string) => {
    await client.post(`/api/v1/auctions/${auctionId}/watch`);
    return true;
  },
  unwatch: async (auctionId: number | string) => {
    await client.delete(`/api/v1/auctions/${auctionId}/watch`);
    return true;
  },
};
