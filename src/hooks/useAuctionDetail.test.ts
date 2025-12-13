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
import {
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";

const mockedGetAuction = vi.mocked(auctionsApi.getAuction);
const mockedGetBidHistory = vi.mocked(bidsApi.getBidHistory);
const mockedPlaceBid = vi.mocked(bidsApi.placeBid);
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseAuctionChannel = vi.mocked(useAuctionChannel);
let channelHandler: ((data: unknown) => void) | undefined;

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
  mockedUseAuctionChannel.mockImplementation(
    (_id, handler: (data: unknown) => void) => {
      channelHandler = handler;
      return {
        subscription: true as unknown as ReturnType<
          typeof import("@services/cable").cable.subscriptions.create
        >,
        connectionState: "connected",
      };
    },
  );
  channelHandler = undefined;
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
  it("surfaces fetch errors", async () => {
    mockedGetAuction.mockRejectedValue(new UnexpectedResponseError("bad"));
    const { result } = renderHook(() => useAuctionDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(UNEXPECTED_RESPONSE_MESSAGE);
  });

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

  it("adds channel updates and ignores duplicate bid ids", async () => {
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      channelHandler?.({
        current_price: 5,
        highest_bidder_id: 20,
        highest_bidder_name: "Alice",
        bid: {
          id: 123,
          user_id: 20,
          username: "Alice",
          amount: 5,
          created_at: "now",
        },
      });
    });

    expect(result.current.auction?.highest_bidder_id).toBe(20);
    expect(result.current.bids[0]?.id).toBe(123);

    act(() => {
      channelHandler?.({
        bid: { id: 123, user_id: 20, username: "Alice", amount: 5 },
      });
    });
    expect(result.current.bids).toHaveLength(1);
  });

  it("ignores channel update for last bidder", async () => {
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.placeUserBid();
    });

    act(() => {
      channelHandler?.({
        bid: { id: 200, user_id: user.id, username: "User", amount: 9 },
      });
    });

    expect(result.current.bids[0]?.id).toBe(99);
  });

  it("sets bidError on axios failure and does not double add bids", async () => {
    mockedPlaceBid.mockRejectedValue(
      Object.assign(new Error("fail"), {
        isAxiosError: true,
        response: { data: { error: "nope" } },
      }),
    );
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.placeUserBid();
    });

    expect(result.current.bidError).toBe("nope");
    expect(result.current.bids).toHaveLength(0);
  });

  it("does not place bid if no subscription", async () => {
    mockedUseAuctionChannel.mockImplementation(() => ({
      subscription: null,
      connectionState: "disconnected",
    }));
    const { result } = renderHook(() => useAuctionDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.placeUserBid();
    });

    expect(mockedPlaceBid).not.toHaveBeenCalled();
  });
});
