import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@hooks/useAuctionChannel", () => {
  const useAuctionChannel = vi.fn();
  return { useAuctionChannel };
});
vi.mock("@api/auctions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/auctions")>();
  return {
    ...actual,
    getAuction: vi.fn(),
  };
});
vi.mock("@api/bids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/bids")>();
  return {
    ...actual,
    getBidHistory: vi.fn(),
    placeBid: vi.fn(),
  };
});
vi.mock("@hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuctionDetail } from "./useAuctionDetail";
import { useAuctionChannel } from "@hooks/useAuctionChannel";
import * as auctionsApi from "@api/auctions";
import * as bidsApi from "@api/bids";
import { useAuth } from "@hooks/useAuth";

const mockedGetAuction = vi.mocked(auctionsApi.getAuction);
const mockedGetBidHistory = vi.mocked(bidsApi.getBidHistory);
const mockedPlaceBid = vi.mocked(bidsApi.placeBid);
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseAuctionChannel = vi.mocked(useAuctionChannel);

const baseAuction: auctionsApi.AuctionDetail = {
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
  bids: [],
};

const bidHistoryResponse: bidsApi.BidHistoryResponse = {
  auction: { winning_user_id: null, winning_user_name: null },
  bids: [],
};

const user = { id: 10, name: "User", is_admin: false, is_superuser: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuctionChannel.mockReturnValue({
    subscription: true as unknown as ReturnType<
      typeof import("@services/cable").cable.subscriptions.create
    >,
    connectionState: "connected",
  });
  mockedGetAuction.mockResolvedValue(baseAuction);
  mockedGetBidHistory.mockResolvedValue(bidHistoryResponse);
  mockedPlaceBid.mockResolvedValue({
    auction: baseAuction,
    bid: { id: 99, user_id: 10, amount: 2 },
  } as bidsApi.PlaceBidResponse);
  mockedUseAuth.mockReturnValue({ user } as unknown as ReturnType<
    typeof useAuth
  >);
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

  it("sets highestBidderDisplay from winning_user_name when present", async () => {
    mockedGetAuction.mockResolvedValueOnce({
      ...baseAuction,
      winning_user_name: "Winner",
      highest_bidder_id: 20,
    });
    mockedGetBidHistory.mockResolvedValueOnce({
      auction: { winning_user_id: 20, winning_user_name: "Winner" },
      bids: [],
    });

    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highestBidderDisplay).toBe("Winner");
  });

  it("places bid and updates bids/auction state", async () => {
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.placeUserBid();
    });

    expect(result.current.bids[0]?.id).toBe(99);
    expect(result.current.auction?.highest_bidder_id).toBe(10);
    expect(result.current.isBidding).toBe(false);
    expect(result.current.bidError).toBeNull();
  });
});
