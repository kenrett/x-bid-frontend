import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AuctionSummary } from "@features/auctions/types/auction";

const clientMocks = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@api/client", () => ({
  default: {
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

import { createAuction, updateAuction, deleteAuction } from "./auctions";

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

  it("deletes an auction", async () => {
    clientMocks.delete.mockResolvedValue({});

    await deleteAuction(7);

    expect(clientMocks.delete).toHaveBeenCalledWith("/api/v1/admin/auctions/7");
  });
});
