import { describe, it, expect, beforeEach, vi } from "vitest";

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

const statusMocks = vi.hoisted(() => ({
  fromApi: vi.fn((status: unknown) => `from:${String(status)}`),
  toApi: vi.fn((status: unknown) => `to:${String(status)}`),
}));

vi.mock("@features/auctions/api/status", () => ({
  statusFromApi: (s: unknown) => statusMocks.fromApi(s),
  statusToApi: (s: unknown) => statusMocks.toApi(s),
}));

import {
  createAuction,
  deleteAuction,
  getAdminAuction,
  getAdminAuctions,
  updateAuction,
} from "./auctions";

describe("api/admin/auctions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleAuction = {
    id: 1,
    title: "Auction",
    status: "active",
    current_price: "12.5",
    storefront_key: "main",
    is_adult: false,
    is_marketplace: false,
  };

  const normalizedAuction = {
    id: 1,
    title: "Auction",
    description: "",
    current_price: 12.5,
    image_url: "",
    status: "from:active",
    start_date: "",
    end_time: "",
    storefront_key: "main",
    is_adult: false,
    is_marketplace: false,
    highest_bidder_id: null,
    winning_user_name: null,
    bid_count: undefined,
  };

  it("fetches admin auctions from the admin endpoint and normalizes status", async () => {
    clientMocks.get.mockResolvedValue({ data: [sampleAuction] });

    const result = await getAdminAuctions();

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/auctions");
    expect(result).toEqual([normalizedAuction]);
  });

  it("passes storefront_key query param when filtering admin auctions", async () => {
    clientMocks.get.mockResolvedValue({ data: [sampleAuction] });

    await getAdminAuctions({ storefront_key: "marketplace" });

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/auctions", {
      params: { storefront_key: "marketplace" },
    });
  });

  it("fetches a single admin auction by id", async () => {
    clientMocks.get.mockResolvedValue({ data: { auction: sampleAuction } });

    const result = await getAdminAuction(8);

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/auctions/8");
    expect(result).toEqual(normalizedAuction);
  });

  it("creates an auction, converting status to API and normalizing response", async () => {
    clientMocks.post.mockResolvedValue({ data: { auction: sampleAuction } });

    const result = await createAuction({
      title: "Auction",
      status: "active",
      storefront_key: "main",
    });

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/admin/auctions", {
      auction: {
        title: "Auction",
        status: "to:active",
        storefront_key: "main",
      },
    });
    expect(statusMocks.fromApi).toHaveBeenCalledWith("active");
    expect(result).toEqual(normalizedAuction);
  });

  it("creates an auction without forcing status when omitted", async () => {
    clientMocks.post.mockResolvedValue({ data: { auction: sampleAuction } });

    await createAuction({ title: "Auction" });

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/admin/auctions", {
      auction: {
        title: "Auction",
      },
    });
    expect(statusMocks.toApi).not.toHaveBeenCalled();
  });

  it("updates an auction, converting status to API and normalizing response", async () => {
    clientMocks.put.mockResolvedValue({
      data: {
        ...sampleAuction,
        storefront_key: "marketplace",
        is_marketplace: true,
        is_adult: false,
      },
    });

    const result = await updateAuction(5, {
      status: "active",
      storefront_key: "marketplace",
      is_adult: true,
      is_marketplace: false,
    });

    expect(clientMocks.put).toHaveBeenCalledWith("/api/v1/admin/auctions/5", {
      auction: {
        status: "to:active",
        storefront_key: "marketplace",
        is_adult: true,
        is_marketplace: false,
      },
    });
    expect(result.status).toBe("from:active");
    expect(result.current_price).toBe(12.5);
    expect(result.storefront_key).toBe("marketplace");
    expect(result.is_marketplace).toBe(true);
    expect(result.is_adult).toBe(false);
  });

  it("updates an auction without forcing status when omitted", async () => {
    clientMocks.put.mockResolvedValue({ data: sampleAuction });

    await updateAuction(5, { title: "Updated title" });

    expect(clientMocks.put).toHaveBeenCalledWith("/api/v1/admin/auctions/5", {
      auction: {
        title: "Updated title",
      },
    });
    expect(statusMocks.toApi).not.toHaveBeenCalled();
  });

  it("deletes an auction", async () => {
    clientMocks.delete.mockResolvedValue({});

    await deleteAuction(7);

    expect(clientMocks.delete).toHaveBeenCalledWith("/api/v1/admin/auctions/7");
  });
});
