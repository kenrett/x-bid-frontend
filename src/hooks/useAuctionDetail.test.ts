import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAuctionDetail } from "./useAuctionDetail";
import * as auctionsApi from "../api/auctions";
import * as bidsApi from "../api/bids";
import { useAuth } from "./useAuth";

vi.mock("../api/auctions");
vi.mock("../api/bids");
vi.mock("./useAuctionChannel", () => ({ useAuctionChannel: vi.fn() }));
vi.mock("./useAuth");

const mockedGetAuction = vi.mocked(auctionsApi.getAuction);
const mockedGetBidHistory = vi.mocked(bidsApi.getBidHistory);
const mockedPlaceBid = vi.mocked(bidsApi.placeBid);
const mockedUseAuth = vi.mocked(useAuth);

const auction = {
  id: 1,
  title: "Test Auction",
  description: "desc",
  current_price: 1,
  image_url: "img",
  status: "active" as const,
  start_date: "2025-01-01",
  end_time: "2025-01-02",
  highest_bidder_id: null,
  winning_user_name: null,
};

const bidHistoryResponse = {
  auction: { winning_user_id: null, winning_user_name: null },
  bids: [],
};

const user = { id: 10, name: "User", is_admin: false, is_superuser: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetAuction.mockResolvedValue(auction as any);
  mockedGetBidHistory.mockResolvedValue(bidHistoryResponse as any);
  mockedPlaceBid.mockResolvedValue({ auction, bid: { id: 99, user_id: 10, amount: 2 } } as any);
  mockedUseAuth.mockReturnValue({ user } as any);
});

describe("useAuctionDetail", () => {
  it("exposes highestBidderDisplay fallback", async () => {
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highestBidderDisplay).toBe("No bids yet");
  });

  it("onTimerEnd triggers refresh when end_time changes", async () => {
    const refreshSpy = vi.spyOn(auctionsApi, "getAuction");
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.onTimerEnd();
    });

    await waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(2));
  });
});
