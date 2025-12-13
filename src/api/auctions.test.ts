import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AuctionDetail, AuctionSummary } from "../types/auction";
import type { Bid } from "../types/bid";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("./client", () => ({
  default: { get: clientMocks.get },
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

const mockStatusFromApi = vi.hoisted(() =>
  vi.fn((status: unknown) => `status:${String(status)}`),
);

vi.mock("./status", () => ({
  statusFromApi: (value: unknown) => mockStatusFromApi(value),
}));

// Import after mocks
import { getAuctions, getAuction } from "./auctions";

describe("api/auctions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuctions", () => {
    it("normalizes list payloads and status/price fields", async () => {
      const payload: AuctionSummary[] = [
        { id: 1, title: "A", current_price: "10.5", status: "open" },
      ] as unknown as AuctionSummary[];
      clientMocks.get.mockResolvedValue({ data: payload });

      const result = await getAuctions();

      expect(result).toEqual([
        { id: 1, title: "A", current_price: 10.5, status: "status:open" },
      ]);
      expect(mockStatusFromApi).toHaveBeenCalledWith("open");
    });

    it("supports nested { auctions: [] } payloads", async () => {
      const auctions: AuctionSummary[] = [
        { id: 2, title: "B", current_price: "7.25", status: "closed" },
      ] as unknown as AuctionSummary[];
      clientMocks.get.mockResolvedValue({ data: { auctions } });

      const result = await getAuctions();

      expect(result[0].current_price).toBe(7.25);
      expect(result[0].status).toBe("status:closed");
    });

    it("throws when payload is not an array of auctions", async () => {
      clientMocks.get.mockResolvedValue({ data: { unexpected: true } });

      await expect(getAuctions()).rejects.toThrowError("getAuctions");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith("getAuctions", {
        unexpected: true,
      });
    });

    it("throws when an auction is missing a numeric id", async () => {
      const badPayload = [{ id: "oops", current_price: 1, status: "open" }];
      clientMocks.get.mockResolvedValue({ data: badPayload });

      await expect(getAuctions()).rejects.toThrowError("getAuctions.items");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getAuctions.items",
        badPayload,
      );
    });
  });

  describe("getAuction", () => {
    it("normalizes auction detail and falls back to top-level bids", async () => {
      const fallbackBids: Bid[] = [{ id: 5 } as Bid];
      const auction: Partial<AuctionDetail> = {
        id: 10,
        title: "Auction",
        current_price: "25.5",
        status: "pending",
      };
      clientMocks.get.mockResolvedValue({
        data: { auction, bids: fallbackBids },
      });

      const result = await getAuction(10);

      expect(result.id).toBe(10);
      expect(result.current_price).toBe(25.5);
      expect(result.status).toBe("status:pending");
      expect(result.bids).toEqual(fallbackBids);
      expect(mockStatusFromApi).toHaveBeenCalledWith("pending");
      expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/auctions/10");
    });

    it("throws when response is not an object", async () => {
      clientMocks.get.mockResolvedValue({ data: "bad" });

      await expect(getAuction(1)).rejects.toThrowError("getAuction");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getAuction",
        "bad",
      );
    });

    it("throws when auction id is missing or not finite", async () => {
      clientMocks.get.mockResolvedValue({
        data: { auction: { title: "No id" } },
      });

      await expect(getAuction(2)).rejects.toThrowError("getAuction.id");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getAuction.id",
        { auction: { title: "No id" } },
      );
    });

    it("throws when fallback bids are not an array", async () => {
      clientMocks.get.mockResolvedValue({
        data: { auction: { id: 3 }, bids: {} },
      });

      await expect(getAuction(3)).rejects.toThrowError("getAuction.bids");
      expect(mockReportUnexpectedResponse).toHaveBeenCalledWith(
        "getAuction.bids",
        { auction: { id: 3 }, bids: {} },
      );
    });
  });
});
