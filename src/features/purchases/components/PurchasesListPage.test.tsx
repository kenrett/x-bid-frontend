import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import { PurchasesListPage } from "./PurchasesListPage";
import { useAuth } from "@features/auth/hooks/useAuth";
import { purchasesApi } from "../api/purchasesApi";
import type { PurchaseSummary } from "../types/purchase";

vi.mock("@features/auth/hooks/useAuth");
vi.mock("../api/purchasesApi");

const mockedUseAuth = vi.mocked(useAuth);
const mockedPurchasesApi = vi.mocked(purchasesApi, true);

const createAuthReturn = () =>
  ({
    user: {
      id: 1,
      email: "user@example.com",
      name: "Player One",
      bidCredits: 100,
      is_admin: false,
    },
    isReady: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUserBalance: vi.fn(),
    token: "token",
    refreshToken: "refresh",
    sessionTokenId: "session",
    sessionRemainingSeconds: 900,
  }) as unknown as ReturnType<typeof useAuth>;

const purchases: PurchaseSummary[] = [
  {
    id: 7,
    createdAt: "2024-05-01T10:00:00Z",
    bidPackId: 3,
    bidPackName: "Starter Pack",
    credits: 100,
    amount: 10,
    currency: "usd",
    status: "succeeded",
    receiptUrl: "https://stripe.com/receipt/7",
  },
  {
    id: 8,
    createdAt: "2024-05-02T11:00:00Z",
    bidPackId: 4,
    bidPackName: "Mega Pack",
    credits: 500,
    amount: 40,
    currency: "usd",
    status: "pending",
    receiptUrl: null,
  },
];

const DetailEcho = () => {
  const { id } = useParams();
  return <div>Purchase detail {id}</div>;
};

describe("PurchasesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(createAuthReturn());
  });

  it("renders purchases and navigates to detail on row click", async () => {
    mockedPurchasesApi.list.mockResolvedValue(purchases);

    render(
      <MemoryRouter initialEntries={["/account/purchases"]}>
        <Routes>
          <Route path="/account/purchases" element={<PurchasesListPage />} />
          <Route path="/account/purchases/:id" element={<DetailEcho />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/starter pack/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10\.00/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view receipt/i })).toHaveLength(
      1,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText(/starter pack/i));

    expect(await screen.findByText(/purchase detail 7/i)).toBeInTheDocument();
  });

  it("renders a receipt link only when the url is present", async () => {
    mockedPurchasesApi.list.mockResolvedValue(purchases);

    render(
      <MemoryRouter initialEntries={["/account/purchases"]}>
        <Routes>
          <Route path="/account/purchases" element={<PurchasesListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const receiptLink = await screen.findByRole("link", {
      name: /view receipt/i,
    });
    expect(receiptLink).toHaveAttribute("href", purchases[0].receiptUrl);

    const megaRow = screen.getByText(/mega pack/i).closest("tr");
    expect(megaRow).not.toBeNull();
    expect(within(megaRow as HTMLElement).queryByRole("link")).toBeNull();
    expect(
      within(megaRow as HTMLElement).getByText(/payment details/i),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no purchases", async () => {
    mockedPurchasesApi.list.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PurchasesListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no purchases yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/purchase history/i)).toBeInTheDocument();
  });
});
