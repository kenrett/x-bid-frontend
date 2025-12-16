import { describe, it, expect, beforeEach, vi } from "vitest";
import type { BidPack } from "@features/auctions/types/bidPack";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@api/client", () => ({
  default: {
    get: clientMocks.get,
    post: clientMocks.post,
    put: clientMocks.put,
    delete: clientMocks.delete,
  },
}));

import {
  listBidPacks,
  getBidPack,
  createBidPack,
  updateBidPack,
  deleteBidPack,
} from "./bidPacks";

type RawBidPack = Omit<BidPack, "price" | "bids" | "active" | "highlight"> & {
  price: number | string;
  bids: number | string;
  pricePerBid?: string | number | null;
  active?: boolean | number | null;
  highlight?: boolean | number | null;
};

const buildPack = (overrides: Partial<RawBidPack> = {}): BidPack =>
  ({
    id: 1,
    name: "Pack",
    description: "Pack description",
    price: 10,
    bids: 20,
    pricePerBid: "0.50",
    status: "active",
    active: undefined,
    highlight: undefined,
    ...overrides,
  }) as unknown as BidPack;

describe("api/admin/bidPacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists bid packs with normalization from flat array payload", async () => {
    clientMocks.get.mockResolvedValue({ data: [buildPack()] });

    const result = await listBidPacks();

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/bid-packs");
    const [pack] = result;
    expect(pack.price).toBe(10);
    expect(Number(pack.bids)).toBe(20);
    expect(pack.pricePerBid).toBe("0.50");
    expect(pack.status).toBe("active");
    expect(pack.active).toBe(true);
    expect(pack.highlight).toBe(false);
  });

  it("lists bid packs from nested payload", async () => {
    clientMocks.get.mockResolvedValue({
      data: {
        bid_packs: [buildPack({ price: 5, bids: 5, pricePerBid: undefined })],
      },
    });

    const [pack] = await listBidPacks();
    expect(pack.pricePerBid).toBe("1.00");
  });

  it("gets a bid pack and normalizes numbers/flags", async () => {
    clientMocks.get.mockResolvedValue({ data: { bid_pack: buildPack() } });

    const pack = await getBidPack(3);

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/bid-packs/3");
    expect(pack.price).toBe(10);
    expect(Number(pack.bids)).toBe(20);
  });

  it("creates a bid pack and normalizes the response", async () => {
    clientMocks.post.mockResolvedValue({ data: { bid_pack: buildPack() } });

    const pack = await createBidPack({ name: "New" } as BidPack);

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/admin/bid-packs", {
      name: "New",
    });
    expect(pack.status).toBe("active");
  });

  it("updates a bid pack and normalizes the response", async () => {
    clientMocks.put.mockResolvedValue({
      data: buildPack({ status: "retired" }),
    });

    const pack = await updateBidPack(9, { status: "retired" });

    expect(clientMocks.put).toHaveBeenCalledWith("/api/v1/admin/bid-packs/9", {
      status: "retired",
    });
    expect(pack.status).toBe("retired");
    expect(pack.active).toBe(false);
  });

  it("deletes a bid pack", async () => {
    clientMocks.delete.mockResolvedValue({});

    await deleteBidPack(4);

    expect(clientMocks.delete).toHaveBeenCalledWith(
      "/api/v1/admin/bid-packs/4",
    );
  });
});
