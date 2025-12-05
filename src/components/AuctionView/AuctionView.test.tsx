import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuctionView } from "./AuctionView";
import type { AuctionDetail } from "../../types/auction";
import type { Bid } from "../../types/bid";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../Countdown/Countdown", () => ({
  Countdown: ({ status }: { status: string }) => <div>Status: {status}</div>,
}));

// Mock the lazy-loaded BidHistory component
let shouldSuspendBidHistory = true;

vi.mock("../BidHistory/BidHistory", () => {
  const SuspenderBidHistory = ({ bids }: { bids: Bid[] }) => {
    if (shouldSuspendBidHistory) {
      // Throwing a promise triggers Suspense fallback once.
      throw new Promise<void>((resolve) => {
        setTimeout(() => {
          shouldSuspendBidHistory = false;
          resolve();
        }, 0);
      });
    }
    return <div data-testid="bid-history">Bids: {bids.length}</div>;
  };

  return { BidHistory: SuspenderBidHistory };
});

const mockAuction: AuctionDetail = {
  id: 1,
  title: "Vintage Masterpiece",
  description: "A truly unique item.",
  current_price: 250.0,
  end_time: new Date(Date.now() + 100000).toISOString(),
  image_url: "/test-image.jpg",
  status: "active",
  start_date: new Date().toISOString(),
  highest_bidder_id: 2,
  bids: [],
};

const mockUser = { id: 1, name: "Test User" };

const defaultProps = {
  auction: mockAuction,
  user: mockUser,
  isBidding: false,
  bidError: null,
  highestBidderUsername: "BidderTwo",
  onPlaceBid: vi.fn(),
  onTimerEnd: vi.fn(),
  bids: [{ id: 1, amount: 250, created_at: new Date().toISOString(), user_id: 2, username: "BidderTwo" }],
};

const renderComponent = (props = {}) => {
  return render(<AuctionView {...defaultProps} {...props} />, {
    wrapper: MemoryRouter,
  });
};

describe("AuctionView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldSuspendBidHistory = true;
  });

  afterEach(() => {
    shouldSuspendBidHistory = true;
  });

  it("renders auction details correctly", async () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: "Vintage Masterpiece" })).toBeInTheDocument();
    expect(screen.getByText("A truly unique item.")).toBeInTheDocument();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByAltText("Vintage Masterpiece")).toHaveAttribute("src", "/test-image.jpg");

    await screen.findByTestId("bid-history");
  });

  it("renders the highest bidder's name when available", () => {
    renderComponent();
    expect(screen.getByText("Highest Bidder:")).toBeInTheDocument();
    expect(screen.getByText("BidderTwo")).toBeInTheDocument();
  });

  it("renders countdown status text from the mocked Countdown", () => {
    renderComponent();
    expect(screen.getByText("Status: active")).toBeInTheDocument();
  });

  it('renders "None" when there is no highest bidder', () => {
    renderComponent({ highestBidderUsername: null });

    const bidderInfo = screen.getByTestId("highest-bidder-info");
    expect(bidderInfo).toHaveTextContent("Highest Bidder: None");
  });

  it("calls navigate with '/auctions' when the back button is clicked", async () => {
    renderComponent();
    const user = userEvent.setup();
    const backButton = screen.getByRole("button", { name: /back to auctions/i });
    await user.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith("/auctions");
  });

  describe("Bidding Section", () => {
    it("shows the bidding section for an active auction and a logged-in, non-admin user", async () => {
      renderComponent();
      expect(screen.getByRole("button", { name: /place your bid/i })).toBeInTheDocument();
      expect(await screen.findByTestId("bid-history")).toBeInTheDocument();
    });

    it("hides the bidding section if auction is not active", () => {
      renderComponent({ auction: { ...mockAuction, status: "ended" } });
      expect(screen.queryByRole("button", { name: /place your bid/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId("bid-history")).not.toBeInTheDocument();
    });

    it("hides the bidding section if no user is logged in", () => {
      renderComponent({ user: null });
      expect(screen.queryByRole("button", { name: /place your bid/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId("bid-history")).not.toBeInTheDocument();
    });

    it("hides the bidding section if the user is an admin", () => {
      renderComponent({ user: { ...mockUser, is_admin: true } });
      expect(screen.queryByRole("button", { name: /place your bid/i })).not.toBeInTheDocument();
    });

    it("displays a bid error message when provided", () => {
      const error = "You do not have enough bids.";
      renderComponent({ bidError: error });
      expect(screen.getByRole("alert")).toHaveTextContent(error);
    });

    it("calls onPlaceBid when the bid button is clicked", async () => {
      const onPlaceBidMock = vi.fn();
      renderComponent({ onPlaceBid: onPlaceBidMock });
      const user = userEvent.setup();
      const bidButton = screen.getByRole("button", { name: /place your bid/i });
      await user.click(bidButton);
      expect(onPlaceBidMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Bid Button States", () => {
    it('is enabled with text "Place Your Bid" by default', () => {
      renderComponent();
      const bidButton = screen.getByRole("button", { name: /place your bid/i });
      expect(bidButton).toBeEnabled();
      expect(bidButton).toHaveTextContent("Place Your Bid");
    });

    it('is disabled with text "Placing Bid..." when isBidding is true', () => {
      renderComponent({ isBidding: true });
      const bidButton = screen.getByRole("button", { name: /placing bid/i });
      expect(bidButton).toBeDisabled();
      expect(bidButton).toHaveTextContent("Placing Bid...");
    });

    it('is disabled with text "You are the highest bidder" if user is the highest bidder', () => {
      renderComponent({
        auction: { ...mockAuction, highest_bidder_id: mockUser.id },
      });
      const bidButton = screen.getByRole("button", {
        name: /you are the highest bidder/i,
      });
      expect(bidButton).toBeDisabled();
      expect(bidButton).toHaveTextContent("You are the highest bidder");
    });
  });

  describe("Lazy Loading BidHistory", () => {
    it("shows the fallback and then renders BidHistory once loaded", async () => {
      renderComponent();
      expect(screen.getByText("Loading bid history...")).toBeInTheDocument();

      await waitForElementToBeRemoved(() => screen.queryByText("Loading bid history..."));
      expect(await screen.findByTestId("bid-history")).toBeInTheDocument();
    });

    it("renders BidHistory with correct bids prop after loading", async () => {
      const bids = [
        { id: 1, amount: 250, created_at: "time", user_id: 2, username: "u2" },
        { id: 2, amount: 249, created_at: "time", user_id: 1, username: "u1" },
      ];
      renderComponent({ bids });

      const bidHistory = await screen.findByTestId("bid-history");
      expect(bidHistory).toBeInTheDocument();
      expect(bidHistory).toHaveTextContent(`Bids: ${bids.length}`);
    });
  });
});
