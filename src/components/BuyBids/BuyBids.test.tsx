import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BuyBids } from "./BuyBids";
import { useAuth } from "../../hooks/useAuth";
import client from "../../api/client";
import type { BidPack } from "../../types/bidPack";

vi.mock("../../hooks/useAuth");
vi.mock("../../api/client");
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve("stripe-instance")),
}));
vi.mock("@stripe/react-stripe-js", () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="embedded-checkout-provider">{children}</div>
  ),
  EmbeddedCheckout: () => <div data-testid="embedded-checkout" />,
}));

type UseAuthReturn = ReturnType<typeof useAuth>;

const mockedUseAuth = vi.mocked(useAuth, true);
const mockedClient = vi.mocked(client, true);

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

const mockUserLoggedIn = {
  id: 1,
  name: "Test User",
  bidCredits: 100,
  email: "test@example.com",
  is_admin: false,
};

// Helper to create a full mock UseAuthReturn object
const createMockAuthReturn = (user: typeof mockUserLoggedIn | null): UseAuthReturn => ({
  user,
  login: vi.fn() as UseAuthReturn["login"],
  logout: vi.fn(),
  token: user ? "fake-token" : null,
  refreshToken: user ? "refresh-token" : null,
  sessionTokenId: user ? "session-token-id" : null,
  sessionRemainingSeconds: user ? 900 : null,
  updateUserBalance: vi.fn(),
  isReady: true,
});

const renderComponent = () => render(<BuyBids />, { wrapper: MemoryRouter });

describe("BuyBids Component", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("when user is not logged in", () => {
    it("shows the login prompt and does not fetch packs", () => {
      mockedUseAuth.mockReturnValue(createMockAuthReturn(null));
      renderComponent();

      expect(
        screen.getByRole("heading", { name: /your arsenal awaits/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /log in to continue/i })).toHaveAttribute(
        "href",
        "/login"
      );
      expect(mockedClient.get).not.toHaveBeenCalled();
      expect(mockedClient.post).not.toHaveBeenCalled();
    });
  });

  describe("when user is logged in", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue(createMockAuthReturn(mockUserLoggedIn));
    });

    it("shows a loading state initially", () => {
      mockedClient.get.mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(screen.getByText("Loading bid packs...")).toBeInTheDocument();
    });

    it("shows an error if fetching packs fails", async () => {
      mockedClient.get.mockRejectedValue(new Error("API Error"));
      renderComponent();

      expect(await screen.findByText("Failed to fetch bid packs.")).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    it("renders bid packs on successful fetch", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      renderComponent();

      expect(await screen.findByText("Starter Pack")).toBeInTheDocument();
      expect(screen.getByText("Pro Pack")).toBeInTheDocument();
      expect(screen.getByText("BEST VALUE")).toBeInTheDocument();
      expect(screen.queryByText("Loading bid packs...")).not.toBeInTheDocument();
    });

    it("posts checkout and renders embedded checkout on success, replacing the cards", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      mockedClient.post.mockResolvedValue({ data: { clientSecret: "cs_test_123" } });
      renderComponent();
      const user = userEvent.setup();

      const starterPackCard = (
        await screen.findByRole("heading", { name: "Starter Pack" })
      ).closest("div")!;
      const acquireButton = within(starterPackCard).getByRole("button", {
        name: /acquire pack/i,
      });

      await user.click(acquireButton);

      expect(mockedClient.post).toHaveBeenCalledWith("/checkouts", {
        bid_pack_id: 1,
      });
      expect(await screen.findByTestId("embedded-checkout-provider")).toBeInTheDocument();
      expect(screen.getByTestId("embedded-checkout")).toBeInTheDocument();
      expect(screen.queryByText("Arm Yourself")).not.toBeInTheDocument();
    });

    it("prevents double submissions while a purchase is in flight", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      mockedClient.post.mockReturnValue(new Promise(() => {})); // never resolves
      renderComponent();
      const user = userEvent.setup();

      const starterPackCard = (
        await screen.findByRole("heading", { name: "Starter Pack" })
      ).closest("div")!;
      const acquireButton = within(starterPackCard).getByRole("button", {
        name: /acquire pack/i,
      });

      await user.click(acquireButton);
      await user.click(acquireButton);

      expect(mockedClient.post).toHaveBeenCalledTimes(1);
      expect(acquireButton).toBeDisabled();
    });

    it("surfaces API error messages when purchase fails (axios error) and does not show checkout", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      const apiError = Object.assign(new Error("Bad request"), {
        isAxiosError: true,
        response: { data: { error: "Payment failed" } },
      });
      mockedClient.post.mockRejectedValue(apiError);
      renderComponent();
      const user = userEvent.setup();

      const starterPackCard = (
        await screen.findByRole("heading", { name: "Starter Pack" })
      ).closest("div")!;
      const acquireButton = within(starterPackCard).getByRole("button", {
        name: /acquire pack/i,
      });

      await user.click(acquireButton);

      expect(await screen.findByText("Payment failed")).toBeInTheDocument();
      expect(screen.queryByTestId("embedded-checkout-provider")).not.toBeInTheDocument();
    });

    it("surfaces a fallback message for non-Axios errors", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });
      mockedClient.post.mockRejectedValue(new Error("boom"));
      renderComponent();
      const user = userEvent.setup();

      const starterPackCard = (
        await screen.findByRole("heading", { name: "Starter Pack" })
      ).closest("div")!;
      const acquireButton = within(starterPackCard).getByRole("button", {
        name: /acquire pack/i,
      });

      await user.click(acquireButton);

      expect(await screen.findByText("An unexpected error occurred.")).toBeInTheDocument();
      expect(screen.queryByTestId("embedded-checkout-provider")).not.toBeInTheDocument();
    });

    it("handles session timeout before purchase by blocking checkout and showing an error", async () => {
      mockedClient.get.mockResolvedValue({ data: mockBidPacks });

      // Allow auth state to flip mid-session
      let authState: UseAuthReturn = createMockAuthReturn(mockUserLoggedIn);
      mockedUseAuth.mockImplementation(() => authState);

      const { rerender } = render(<MemoryRouter><BuyBids /></MemoryRouter>);

      await screen.findByText("Starter Pack");

      // Simulate session timeout before clicking purchase
      authState = createMockAuthReturn(null);
      rerender(<MemoryRouter><BuyBids /></MemoryRouter>);

      expect(
        await screen.findByRole("heading", { name: /your arsenal awaits/i })
      ).toBeInTheDocument();
      expect(mockedClient.post).not.toHaveBeenCalled();
    });
  });
});
