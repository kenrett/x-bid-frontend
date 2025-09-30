import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuctionChannel } from './useAuctionChannel';
import { cable } from '@/services/cable'; // This will be the mocked version

// Define mock objects to be used in tests
const mockSubscription = {
  unsubscribe: vi.fn(),
  perform: vi.fn(),
};

// Mock the cable service. The factory function is hoisted.
vi.mock('@/services/cable', () => ({
  cable: {
    subscriptions: {
      // The mock implementation is now defined inside the factory
      create: vi.fn(() => mockSubscription),
    },
  },
}));

describe('useAuctionChannel', () => {
  const auctionId = 123;
  const onData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not create a subscription if auctionId is invalid', () => {
    renderHook(() => useAuctionChannel(0, onData));
    expect(vi.mocked(cable.subscriptions.create)).not.toHaveBeenCalled();
  });

  it('should create a subscription with the correct channel and auction_id', () => {
    renderHook(() => useAuctionChannel(auctionId, onData));

    expect(vi.mocked(cable.subscriptions.create)).toHaveBeenCalledWith(
      { channel: 'AuctionChannel', auction_id: auctionId },
      expect.any(Object)
    );
  });

  it('should call onData with parsed data when a message is received', async () => {
    renderHook(() => useAuctionChannel(auctionId, onData));

    const receivedCallback = vi.mocked(cable.subscriptions.create).mock.calls[0][1].received;

    const rawData = {
      current_price: '150.50',
      highest_bidder_id: '42',
      highest_bidder_name: 'Bidder Bob',
      end_time: '2025-12-25T10:00:00.000Z',
      bid: { id: '101', user_id: '42', username: 'Bidder Bob', amount: '150.50', created_at: '2025-12-24T10:00:00.000Z' },
    };

    receivedCallback(rawData);

    await waitFor(() => {
      expect(onData).toHaveBeenCalledWith({
        current_price: 150.50,
        highest_bidder_id: 42,
        highest_bidder_name: 'Bidder Bob',
        end_time: '2025-12-25T10:00:00.000Z',
        bid: { id: 101, user_id: 42, username: 'Bidder Bob', amount: 150.50, created_at: '2025-12-24T10:00:00.000Z' },
      });
    });
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useAuctionChannel(auctionId, onData));

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
  });
});