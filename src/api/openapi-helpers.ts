import type { paths } from "./openapi-types";
import type { AuctionDetail, AuctionSummary } from "@/types/auction";
import type { Bid } from "@/types/bid";
import type { BidPack } from "@/types/bidPack";
import type { Payment } from "@/components/Admin/Users/types";
import type { MaintenanceState } from "./admin/maintenance";
import type { AdminUser } from "@/components/Admin/Users/types";
import type { CheckoutSuccessResponse } from "@/types/checkout";
import type { User } from "@/types/user";

type PlaceBidResponseShape = {
  success?: boolean;
  bid?: Bid;
  bidCredits?: number;
  auction?: AuctionDetail;
};

type OverrideResponses = {
  "/api/v1/auctions": {
    get:
      | AuctionSummary[]
      | {
          auctions?: AuctionSummary[];
        };
  };
  "/api/v1/auctions/{id}": {
    get:
      | AuctionDetail
      | {
          auction?: AuctionDetail & { bids?: Bid[] };
          bids?: Bid[];
        };
  };
  "/api/v1/auctions/{auction_id}/bid_history": {
    get: {
      auction?: {
        winning_user_id?: number | null;
        winning_user_name?: string | null;
      };
      bids?: Bid[];
    };
  };
  "/api/v1/auctions/{auction_id}/bids": {
    post: PlaceBidResponseShape;
  };
  "/api/v1/bid_packs": {
    get: BidPack[];
  };
  "/api/v1/admin/bid-packs": {
    get:
      | BidPack[]
      | {
          bid_packs?: BidPack[];
        };
    post:
      | BidPack
      | {
          bid_pack?: BidPack;
        };
  };
  "/api/v1/admin/bid-packs/{id}": {
    get:
      | BidPack
      | {
          bid_pack?: BidPack;
        };
    put:
      | BidPack
      | {
          bid_pack?: BidPack;
        };
    patch:
      | BidPack
      | {
          bid_pack?: BidPack;
        };
  };
  "/api/v1/admin/maintenance": {
    get: {
      maintenance?: MaintenanceState;
    };
    post: {
      maintenance?: MaintenanceState;
    };
  };
  "/api/v1/maintenance": {
    get: {
      maintenance?: MaintenanceState;
    };
  };
  "/api/v1/admin/users": {
    get:
      | AdminUser[]
      | {
          users?: AdminUser[];
        };
  };
  "/api/v1/admin/payments": {
    get:
      | Payment[]
      | {
          payments?: Payment[];
        };
  };
  "/api/v1/password/forgot": {
    post: {
      debug_token?: string;
    };
  };
  "/api/v1/password/reset": {
    post: CheckoutSuccessResponse;
  };
  "/api/v1/login": {
    post: {
      token: string;
      refresh_token: string;
      session_token_id: string;
      user: User;
      is_admin?: boolean;
      is_superuser?: boolean;
    };
  };
  "/api/v1/users": {
    post: {
      token: string;
      refresh_token: string;
      session_token_id: string;
      user: User;
      is_admin?: boolean;
      is_superuser?: boolean;
    };
  };
};

/**
 * Extracts the JSON response body for a given path/method if a 200 response is defined.
 * Falls back to `unknown` when the spec omits success payloads.
 */
type OverrideLookup<
  P extends keyof paths,
  M extends keyof paths[P],
> = P extends keyof OverrideResponses
  ? M extends keyof OverrideResponses[P]
    ? OverrideResponses[P][M]
    : never
  : never;

export type ApiJsonResponse<P extends keyof paths, M extends keyof paths[P]> =
  OverrideLookup<P, M> extends never
    ? paths[P][M] extends {
        responses: { 200: { content: { "application/json": infer T } } };
      }
      ? T
      : unknown
    : OverrideLookup<P, M>;
