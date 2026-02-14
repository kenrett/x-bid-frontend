import type { paths } from "@api/openapi-types";
import type {
  AuctionDetail,
  AuctionSummary,
} from "@features/auctions/types/auction";
import type { Bid } from "@features/auctions/types/bid";
import type { BidPack } from "@features/auctions/types/bidPack";
import type { Payment, AdminUser } from "@features/admin/types/users";
import type { MaintenanceState } from "@features/admin/api/maintenance";
import type { CheckoutSuccessResponse } from "@features/auctions/types/checkout";
import type { User } from "@features/auth/types/user";

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
  "/api/v1/admin/auctions": {
    get:
      | AuctionSummary[]
      | {
          auctions?: AuctionSummary[];
        };
    post:
      | AuctionSummary
      | {
          auction?: AuctionSummary;
        };
  };
  "/api/v1/admin/auctions/{id}": {
    get:
      | AuctionSummary
      | {
          auction?: AuctionSummary;
        };
    put:
      | AuctionSummary
      | {
          auction?: AuctionSummary;
        };
    patch:
      | AuctionSummary
      | {
          auction?: AuctionSummary;
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
      access_token: string;
      refresh_token: string;
      session_token_id: string;
      user: User;
      is_admin?: boolean;
      is_superuser?: boolean;
    };
  };
  "/api/v1/signup": {
    post: {
      access_token: string;
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
