import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AuctionSummary } from "@features/auctions/types/auction";

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
  getAdminAuctions,
  updateAuction,
} from "./auctions";

describe("api/admin/auctions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleAuction: AuctionSummary = {
    id: 1,
    title: "Auction",
    status: "active",
    current_price: "12.5",
  } as unknown as AuctionSummary;

  it("fetches admin auctions from the admin endpoint and normalizes status", async () => {
    clientMocks.get.mockResolvedValue({ data: [sampleAuction] });

    const result = await getAdminAuctions();

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/auctions");
    expect(result).toEqual([
      {
        ...sampleAuction,
        status: "from:active",
        current_price: 12.5,
      },
    ]);
  });

  it("creates an auction, converting status to API and normalizing response", async () => {
    clientMocks.post.mockResolvedValue({ data: { auction: sampleAuction } });

    const result = await createAuction({ title: "Auction", status: "active" });

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/admin/auctions", {
      auction: {
        title: "Auction",
        status: "to:active",
      },
    });
    expect(statusMocks.fromApi).toHaveBeenCalledWith("active");
    expect(result).toEqual({
      ...sampleAuction,
      status: "from:active",
      current_price: 12.5,
    });
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
    clientMocks.put.mockResolvedValue({ data: sampleAuction });

    const result = await updateAuction(5, { status: "active" });

    expect(clientMocks.put).toHaveBeenCalledWith("/api/v1/admin/auctions/5", {
      auction: {
        status: "to:active",
      },
    });
    expect(result.status).toBe("from:active");
    expect(result.current_price).toBe(12.5);
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
