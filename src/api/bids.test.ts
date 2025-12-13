import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Bid } from "../types/bid";
import type { AuctionDetail } from "../types/auction";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("./client", () => ({
  default: { get: clientMocks.get, post: clientMocks.post },
}));

const mockReportUnexpectedResponse = vi.hoisted(() =>
  vi.fn((context: string, payload: unknown) => {
    const error = new Error(context);
    (error as { payload?: unknown }).payload = payload;
    return error;
  }),
);

vi.mock("@services/unexpectedResponse", () => ({
  reportUnexpectedResponse: (
    ...args: Parameters<typeof mockReportUnexpectedResponse>
  ) => mockReportUnexpectedResponse(...args),
}));

// Import after mocks
import { placeBid, getBidHistory } from "./bids";

describe("api/bids", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a bid and returns the API payload", async () => {
    const response = { success: true, bid: { id: 1 } as Bid };
    clientMocks.post.mockResolvedValue({ data: response });

    const result = await placeBid(42);

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/auctions/42/bids");
    expect(result).toEqual(response);
  });

  describe("getBidHistory", () => {
    it("normalizes auction fields and returns bids array", async () => {
      const bids: Bid[] = [{ id: 7 } as Bid];
      clientMocks.get.mockResolvedValue({
        data: {
          auction: { winning_user_id: 9, winning_user_name: "Jane" },
          bids,
        },
      });

      const result = await getBidHistory(5);

      expect(clientMocks.get).toHaveBeenCalledWith(
        "/api/v1/auctions/5/bid_history",
      );
      expect(result).toEqual({
        auction: { winning_user_id: 9, winning_user_name: "Jane" },
        bids,
      });
    });

    it("throws when response is not an object", async () => {
      clientMocks.get.mockResolvedValue({ data: null });

      await expect(getBidHistory(1)).rejects.toThrowError("getBidHistory.bids");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getBidHistory.bids",
        {},
      );
    });

    it("throws when auction is not an object", async () => {
      clientMocks.get.mockResolvedValue({
        data: { auction: "bad", bids: [] as Bid[] },
      });

      await expect(getBidHistory(2)).rejects.toThrowError(
        "getBidHistory.auction",
      );
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getBidHistory.auction",
        { auction: "bad", bids: [] },
      );
    });

    it("throws when bids are not an array", async () => {
      clientMocks.get.mockResolvedValue({
        data: { auction: {} as AuctionDetail, bids: {} },
      });

      await expect(getBidHistory(3)).rejects.toThrowError("getBidHistory.bids");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getBidHistory.bids",
        { auction: {}, bids: {} },
      );
    });
  });
});
