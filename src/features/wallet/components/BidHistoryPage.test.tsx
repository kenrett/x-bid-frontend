import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BidHistoryPage } from "./BidHistoryPage";
import { useAuth } from "@features/auth/hooks/useAuth";
import { walletApi } from "../api/walletApi";
import type { WalletTransaction } from "../types/wallet";

vi.mock("@features/auth/hooks/useAuth");
vi.mock("../api/walletApi");

const mockedUseAuth = vi.mocked(useAuth);
const mockedWalletApi = vi.mocked(walletApi, true);

const mockUser = {
  id: 1,
  email: "player@example.com",
  name: "Player One",
  bidCredits: 200,
  is_admin: false,
};

const createAuthReturn = () =>
  ({
    user: mockUser,
    isReady: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUserBalance: vi.fn(),
    token: "token",
    refreshToken: "refresh",
    sessionTokenId: "session",
    sessionRemainingSeconds: 900,
  }) as unknown as ReturnType<typeof useAuth>;

const renderComponent = () =>
  render(
    <MemoryRouter>
      <BidHistoryPage />
    </MemoryRouter>,
  );

const baseTransactions: WalletTransaction[] = [
  {
    id: "t1",
    occurredAt: "2024-05-01T10:00:00Z",
    kind: "credit",
    amount: 50,
    reason: "Top-up",
    purchaseUrl: "/purchase/1",
    auctionUrl: "/auctions/42",
  },
];

describe("BidHistoryPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(createAuthReturn());
    mockedWalletApi.getWallet.mockResolvedValue({
      creditsBalance: 120,
      asOf: "2024-05-01T10:00:00Z",
      currency: "credits",
    });
  });

  it("renders wallet details and loads more transactions when requested", async () => {
    const extraTx: WalletTransaction = {
      id: "t2",
      occurredAt: "2024-05-02T12:00:00Z",
      kind: "debit",
      amount: -20,
      reason: "Bid spend",
      auctionUrl: "/auctions/99",
    };
    mockedWalletApi.listTransactions
      .mockResolvedValueOnce({
        transactions: baseTransactions,
        page: 1,
        perPage: 25,
        totalCount: 1,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        transactions: [extraTx],
        page: 2,
        perPage: 25,
        totalCount: 2,
        hasMore: false,
      });

    renderComponent();

    expect(await screen.findByText(/credits balance/i)).toBeInTheDocument();
    expect(screen.getByText(/120(\.00)? credits/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /purchases/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/top-up/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load more/i })).toBeEnabled();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /load more/i }));

    expect(await screen.findByText(/bid spend/i)).toBeInTheDocument();
    expect(mockedWalletApi.listTransactions).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when there are no transactions", async () => {
    mockedWalletApi.listTransactions.mockResolvedValue({
      transactions: [],
      page: 1,
      perPage: 25,
      totalCount: 0,
      hasMore: false,
    });

    renderComponent();

    expect(await screen.findByText(/no transactions yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument();
  });

  it("surfaces a friendly error state and retries when requested", async () => {
    mockedWalletApi.getWallet
      .mockRejectedValueOnce(new Error("api down"))
      .mockResolvedValue({
        creditsBalance: 55,
        asOf: "2024-06-01T09:00:00Z",
        currency: null,
      });
    mockedWalletApi.listTransactions.mockResolvedValue({
      transactions: baseTransactions,
      page: 1,
      perPage: 25,
      totalCount: 1,
      hasMore: false,
    });

    renderComponent();

    expect(
      await screen.findByText(/couldn't load your wallet/i),
    ).toBeInTheDocument();

    const callCountBeforeRetry = mockedWalletApi.getWallet.mock.calls.length;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText(/55(\.00)? credits/i)).toBeInTheDocument();
    expect(mockedWalletApi.getWallet.mock.calls.length).toBeGreaterThan(
      callCountBeforeRetry,
    );
  });

  it("navigates to purchases from wallet link", async () => {
    mockedWalletApi.listTransactions.mockResolvedValue({
      transactions: baseTransactions,
      page: 1,
      perPage: 25,
      totalCount: 1,
      hasMore: false,
    });

    render(
      <MemoryRouter initialEntries={["/account/wallet"]}>
        <Routes>
          <Route path="/account/wallet" element={<BidHistoryPage />} />
          <Route
            path="/account/purchases"
            element={<div>Purchases page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/credits balance/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: /purchases/i }));

    expect(await screen.findByText(/purchases page/i)).toBeInTheDocument();
  });
});
