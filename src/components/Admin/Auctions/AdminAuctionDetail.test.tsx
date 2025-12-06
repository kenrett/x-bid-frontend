import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminAuctionDetail } from "./AdminAuctionDetail";
import { useAuctionDetail } from "@/hooks/useAuctionDetail";
import { showToast } from "@/services/toast";

vi.mock("@/hooks/useAuctionDetail", () => ({
  useAuctionDetail: vi.fn(),
}));

vi.mock("@/services/toast", () => ({
  showToast: vi.fn(),
}));

const mockRefresh = vi.fn();

beforeEach(() => {
  vi.mocked(useAuctionDetail).mockReturnValue({
    auction: {
      id: 1,
      title: "Live Auction",
      description: "Desc",
      current_price: 123.45,
      image_url: "",
      status: "active",
      start_date: "2024-01-01T00:00:00Z",
      end_time: "2024-01-02T00:00:00Z",
      highest_bidder_id: 9,
      winning_user_name: "Bidder9",
      bids: [],
    },
    bids: [
      {
        id: 1,
        user_id: 9,
        amount: 123.45,
        created_at: "2024-01-01T00:00:00Z",
        username: "Bidder9",
      },
    ],
    loading: false,
    error: null,
    highestBidderUsername: "Bidder9",
    refreshAuction: mockRefresh,
    user: null,
    placeUserBid: vi.fn(),
    isBidding: false,
    bidError: null,
    lastBidderId: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdminAuctionDetail", () => {
  it("renders auction info and bid history", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/auctions/1"]}>
        <Routes>
          <Route path="/admin/auctions/:id" element={<AdminAuctionDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Live Auction")).toBeInTheDocument();
    expect(screen.getAllByText("Bidder9").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$123.45").length).toBeGreaterThan(0);
    expect(screen.getByText("Force refresh")).toBeInTheDocument();
  });

  it("invokes force refresh", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/auctions/1"]}>
        <Routes>
          <Route path="/admin/auctions/:id" element={<AdminAuctionDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const refreshBtn = await screen.findByText("Force refresh");
    await user.click(refreshBtn);

    expect(mockRefresh).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalled();
  });
});
