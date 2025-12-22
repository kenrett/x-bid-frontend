import { useEffect, useRef, useState } from "react";
import { cable } from "@services/cable";
import type { AuctionSummary } from "../types/auction";
import type { AuctionConnectionState } from "./useAuctionChannel";
import { statusFromApi } from "@features/auctions/api/status";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const normalizeUpdate = (raw: unknown): AuctionListUpdate | null => {
  if (!isRecord(raw)) return null;

  const payload = isRecord(raw.auction) ? raw.auction : raw;
  const idValue =
    (payload as { id?: unknown }).id ?? (raw as { id?: unknown }).id;
  const id = Number(idValue);
  if (!Number.isFinite(id)) return null;

  const toNumber = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const highestBidderId = (payload as { highest_bidder_id?: unknown })
    .highest_bidder_id;

  const statusValue =
    typeof payload.status === "string" ? payload.status : undefined;

  return {
    id,
    title: typeof payload.title === "string" ? payload.title : undefined,
    description:
      typeof payload.description === "string" ? payload.description : undefined,
    current_price: toNumber(
      (payload as { current_price?: unknown }).current_price,
    ),
    image_url:
      typeof payload.image_url === "string" ? payload.image_url : undefined,
    status: statusValue ? statusFromApi(statusValue) : undefined,
    start_date:
      typeof payload.start_date === "string" ? payload.start_date : undefined,
    end_time:
      typeof payload.end_time === "string" ? payload.end_time : undefined,
    highest_bidder_id:
      highestBidderId === null
        ? null
        : (toNumber(highestBidderId) ?? undefined),
    winning_user_name:
      typeof payload.winning_user_name === "string"
        ? payload.winning_user_name
        : undefined,
    bid_count: toNumber((payload as { bid_count?: unknown }).bid_count),
  };
};

export type AuctionListUpdate = Partial<AuctionSummary> & { id: number };

export const useAuctionListChannel = (
  onUpdate: (data: AuctionListUpdate) => void,
) => {
  const onUpdateRef = useRef(onUpdate);
  const [connectionState, setConnectionState] =
    useState<AuctionConnectionState>("disconnected");

  onUpdateRef.current = onUpdate;

  useEffect(() => {
    setConnectionState("connecting");
    const subscription = cable.subscriptions.create(
      { channel: "AuctionChannel", stream: "list" },
      {
        connected: () => setConnectionState("connected"),
        disconnected: () => setConnectionState("disconnected"),
        rejected: () => setConnectionState("disconnected"),
        received: (raw: unknown) => {
          const normalized = normalizeUpdate(raw);
          if (normalized) {
            onUpdateRef.current(normalized);
          }
        },
      } as Parameters<typeof cable.subscriptions.create>[1],
    );

    return () => {
      setConnectionState("disconnected");
      subscription.unsubscribe();
    };
  }, []);

  return { connectionState };
};

export const __testables__ = { normalizeUpdate };
