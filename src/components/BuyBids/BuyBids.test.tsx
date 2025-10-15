import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BuyBids } from "./BuyBids";
import { useAuth } from "../../hooks/useAuth";
import client from "../../api/client";
import type { BidPack } from "../../types/bidPack";

// --- Mocks ---
vi.mock("../../hooks/useAuth");
vi.mock("../../api/client");

const mockedUseAuth = vi.mocked(useAuth, true);
const mockedClient = vi.mocked(client, true);

// --- Test Data ---
const mockUser = { id: 1, name: "Test User" };
const mockBidPacks: BidPack[] = [
  {
    id: 1,
    name: "Starter Pack",
    bids: 50,
    price: 5,
    description: "A little something to get you started.",
    pricePerBid: "0.10",
    highlight: false,
  },
  {
    id: 2,
    name: "Pro Pack",
    bids: 200,
    price: 18,
    description: "For the serious bidder.",
    pricePerBid: "0.09",
    highlight: true,
  },
];

const renderComponent = () => {
  return render(<BuyBids />, { wrapper: MemoryRouter });
};

describe("BuyBids Component", () => {
  beforeEach(() => {
    // Suppress console.error for tests that intentionally cause errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("when user is not logged in", () => {
    it("should display a login prompt and a link to the login page", () => {
      mockedUseAuth.mockReturnValue({ user: null } as any);
      renderComponent();

      expect(screen.getByRole("heading", { name: /your arsenal awaits/i })).toBeInTheDocument();
      expect(screen.getByText(/log in to arm yourself/i)).toBeInTheDocument();
      const loginLink = screen.getByRole("link", { name: /log in to continue/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("when user is logged in", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ user: mockUser } as any);
    });

    it("should display a loading state initially", () => {
      mockedClient.get.mockReturnValue(new Promise(() => {})); // Never resolves
      renderComponent();
      expect(screen.getByText("Loading bid packs...")).toBeInTheDocument();
    });

    it("should display an error message if fetching fails", async () => {
      mockedClient.get.mockRejectedValue(new Error("API Error"));
      renderComponent();

      const error = await screen.findByText("Failed to fetch bid packs.");
      expect(error).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it("should display bid packs on successful fetch", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      renderComponent();

      // Wait for packs to appear
      expect(await screen.findByText("Starter Pack")).toBeInTheDocument();
      expect(screen.getByText("Pro Pack")).toBeInTheDocument();

      // Check for highlight element
      expect(screen.getByText("BEST VALUE")).toBeInTheDocument();

      // Check for loading message to be gone
      expect(screen.queryByText("Loading bid packs...")).not.toBeInTheDocument();
    });

    it("should call the purchase API when an 'Acquire Pack' button is clicked", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      mockedClient.post.mockResolvedValue({ data: { success: true } });
      renderComponent();

      // Find the button within the "Starter Pack"
      const starterPackCard = (await screen.findByText("Starter Pack")).parentElement!;
      const acquireButton = within(starterPackCard).getByRole("button", {
        name: /acquire pack/i,
      });

      fireEvent.click(acquireButton);

      expect(mockedClient.post).toHaveBeenCalledTimes(1);
      expect(mockedClient.post).toHaveBeenCalledWith("bid_packs/1/purchase", {
        user_id: mockUser.id,
      });
    });
  });
});