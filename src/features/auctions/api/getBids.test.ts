import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Bid } from "../types/bid";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@api/client", () => ({
  default: { get: clientMocks.get },
}));

import { getBids } from "./getBids";

describe("components/bids (API helper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches bids for an auction", async () => {
    const bids: Bid[] = [{ id: 1 } as Bid];
    clientMocks.get.mockResolvedValue({ data: bids });

    const result = await getBids(99);

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/auctions/99/bids");
    expect(result).toEqual(bids);
  });
});
