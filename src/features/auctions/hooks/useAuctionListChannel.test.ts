import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuctionListChannel, __testables__ } from "./useAuctionListChannel";

const hoisted = vi.hoisted(() => ({
  mockSubscription: { unsubscribe: vi.fn() },
  createMock: vi.fn(),
}));

const authState = {
  accessToken: "jwt",
  sessionTokenId: "sid",
};

vi.mock("@services/cable", () => ({
  cable: {
    subscriptions: {
      create: hoisted.createMock,
    },
  },
}));

vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

describe("useAuctionListChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.mockSubscription.unsubscribe.mockReset();
    hoisted.createMock.mockReturnValue(hoisted.mockSubscription);
    authState.accessToken = "jwt";
    authState.sessionTokenId = "sid";
  });

  it("subscribes to the list stream and forwards normalized updates", () => {
    const onUpdate = vi.fn();
    const { result, unmount } = renderHook(() =>
      useAuctionListChannel(onUpdate),
    );

    expect(hoisted.createMock).toHaveBeenCalledWith(
      { channel: "AuctionChannel", stream: "list" },
      expect.objectContaining({
        received: expect.any(Function),
      }),
    );
    expect(result.current.connectionState).toBe("connecting");

    const [, callbacks] = hoisted.createMock.mock.calls[0];
    act(() => {
      callbacks.connected?.();
    });
    expect(result.current.connectionState).toBe("connected");

    const payload = {
      auction: {
        id: "10",
        current_price: "25.5",
        status: "pending",
        highest_bidder_id: "42",
        bid_count: "7",
      },
    };

    act(() => callbacks.received?.(payload));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        current_price: 25.5,
        status: "scheduled",
        highest_bidder_id: 42,
        bid_count: 7,
      }),
    );

    unmount();
    expect(hoisted.mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  it("normalizes top-level payloads without an auction wrapper", () => {
    const { normalizeUpdate } = __testables__;
    expect(
      normalizeUpdate({
        id: "9",
        status: "cancelled",
        current_price: "99.99",
      }),
    ).toEqual(
      expect.objectContaining({
        id: 9,
        status: "cancelled",
        current_price: 99.99,
      }),
    );
  });
});
