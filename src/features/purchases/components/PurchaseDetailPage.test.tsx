import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PurchaseDetailPage } from "./PurchaseDetailPage";
import { useAuth } from "@features/auth/hooks/useAuth";
import { purchasesApi } from "../api/purchasesApi";
import type { PurchaseDetail } from "../types/purchase";

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

const makeAxiosError = (status?: number, message?: string) =>
  Object.assign(new Error("axios"), {
    isAxiosError: true,
    response: status
      ? { status, data: message ? { error: message } : {} }
      : undefined,
  });

const baseDetail: PurchaseDetail = {
  id: 12,
  createdAt: "2024-05-04T09:00:00Z",
  bidPackId: 5,
  bidPackName: "Elite Pack",
  credits: 750,
  amount: 55,
  currency: "usd",
  status: "succeeded",
  receiptUrl: "https://stripe.com/receipt",
  stripeCheckoutSessionId: "cs_test_123",
  stripePaymentIntentId: "pi_123",
  stripeChargeId: "ch_123",
  stripeCustomerId: "cus_123",
  stripeInvoiceId: "in_123",
  stripeEventId: "evt_123",
};

describe("PurchaseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(createAuthReturn());
  });

  it("renders purchase details and receipt link", async () => {
    mockedPurchasesApi.get.mockResolvedValue(baseDetail);

    render(
      <MemoryRouter initialEntries={["/account/purchases/12"]}>
        <Routes>
          <Route
            path="/account/purchases/:id"
            element={<PurchaseDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /elite pack/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$55\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/succeeded/i)[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view receipt/i })).toHaveAttribute(
      "href",
      baseDetail.receiptUrl,
    );
  });

  it("handles 404 errors gracefully", async () => {
    mockedPurchasesApi.get.mockRejectedValue(makeAxiosError(404));

    render(
      <MemoryRouter initialEntries={["/account/purchases/99"]}>
        <Routes>
          <Route
            path="/account/purchases/:id"
            element={<PurchaseDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/purchase not found/i)).toBeInTheDocument();
  });

  it("handles 403 errors gracefully", async () => {
    mockedPurchasesApi.get.mockRejectedValue(makeAxiosError(403, "forbidden"));

    render(
      <MemoryRouter initialEntries={["/account/purchases/13"]}>
        <Routes>
          <Route
            path="/account/purchases/:id"
            element={<PurchaseDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/do not have access/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockedPurchasesApi.get).toHaveBeenCalledTimes(2);
  });
});
