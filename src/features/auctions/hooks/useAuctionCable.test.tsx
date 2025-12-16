import { describe, it, expect, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useAuctionChannel } from "./useAuctionCable";

const createMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock("../services/cable", () => ({
  cable: {
    subscriptions: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

const TestComponent = ({
  auctionId,
  onData,
}: {
  auctionId: number;
  onData: (payload: unknown) => void;
}) => {
  useAuctionChannel(auctionId, onData);
  return null;
};

describe("useAuctionChannel (cable)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockReturnValue({ unsubscribe: unsubscribeMock });
  });

  afterEach(() => {
    cleanup();
  });

  it("subscribes with auction id and forwards received data", () => {
    const onData = vi.fn();
    render(<TestComponent auctionId={42} onData={onData} />);

    expect(createMock).toHaveBeenCalledWith(
      { channel: "AuctionChannel", auction_id: 42 },
      expect.objectContaining({ received: expect.any(Function) }),
    );

    const callbacks = createMock.mock.calls[0][1] as {
      received: (data: unknown) => void;
    };
    const payload = { foo: "bar" };
    callbacks.received(payload);
    expect(onData).toHaveBeenCalledWith(payload);
  });

  it("cleans up subscription on unmount", () => {
    const { unmount } = render(
      <TestComponent auctionId={99} onData={vi.fn()} />,
    );
    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
