import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminPaymentDetailPage } from "./AdminPaymentDetailPage";
import { adminPaymentsApi } from "@features/admin/api/adminPaymentsApi";
import { showToast } from "@services/toast";
import type { AdminPaymentReconciliation } from "@features/admin/types/users";

vi.mock("@features/admin/api/adminPaymentsApi", () => ({
  adminPaymentsApi: {
    getPayment: vi.fn(),
    repairCredits: vi.fn(),
    refundPayment: vi.fn(),
  },
}));

vi.mock("@services/toast", () => ({
  showToast: vi.fn(),
}));

const mockedApi = vi.mocked(adminPaymentsApi);
const mockPayment: AdminPaymentReconciliation = {
  id: 10,
  userEmail: "payer@example.com",
  amount: 25,
  status: "succeeded",
  createdAt: "2024-05-01T00:00:00Z",
  currency: "usd",
  bidPackId: 5,
  bidPackName: "Starter Pack",
  stripeCheckoutSessionId: "cs_123",
  stripePaymentIntentId: "pi_123",
  stripeEventId: "evt_123",
  ledgerEntries: [
    {
      id: 1,
      createdAt: "2024-05-01T00:00:01Z",
      kind: "credit",
      amount: 25,
      reason: "purchase",
      idempotencyKey: "key-1",
    },
  ],
  balanceAudit: {
    cachedBalance: 100,
    derivedBalance: 125,
    difference: 25,
    matches: false,
  },
};

describe("AdminPaymentDetailPage", () => {
  beforeEach(() => {
    mockedApi.getPayment.mockResolvedValue(mockPayment);
    mockedApi.repairCredits.mockResolvedValue({
      repaired: true,
      idempotent: false,
      message: "Credits repaired",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders payment details and allows repairing credits", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/payments/10"]}>
        <Routes>
          <Route
            path="/admin/payments/:id"
            element={<AdminPaymentDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/payer@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/starter pack/i)).toBeInTheDocument();
    expect(screen.getByText(/pi_123/i)).toBeInTheDocument();
    expect(screen.getByText(/cs_123/i)).toBeInTheDocument();
    expect(screen.getByText(/evt_123/i)).toBeInTheDocument();
    expect(screen.getByText("credit")).toBeInTheDocument();

    const repairButton = screen.getByRole("button", {
      name: /repair credits/i,
    });
    await user.click(repairButton);

    await waitFor(() =>
      expect(mockedApi.repairCredits).toHaveBeenCalledWith(10),
    );
    expect(showToast).toHaveBeenCalledWith("Credits repaired", "success");
    expect(mockedApi.getPayment).toHaveBeenCalledTimes(2);
  });

  it("allows issuing a refund and shows confirmation details", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedApi.getPayment
      .mockResolvedValueOnce(mockPayment)
      .mockResolvedValueOnce({ ...mockPayment, status: "failed" });
    mockedApi.refundPayment.mockResolvedValueOnce({
      id: 10,
      userEmail: "payer@example.com",
      amount: 25,
      status: "failed",
      createdAt: "2024-05-01T00:00:00Z",
      stripePaymentIntentId: "pi_123",
      refundId: "re_123",
      refundedCents: 2500,
    });

    render(
      <MemoryRouter initialEntries={["/admin/payments/10"]}>
        <Routes>
          <Route
            path="/admin/payments/:id"
            element={<AdminPaymentDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/payer@example.com/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("e.g. 5.00"), "5.00");
    await user.type(
      screen.getByPlaceholderText("e.g. duplicate purchase"),
      " duplicate ",
    );
    await user.click(screen.getByRole("button", { name: /issue refund/i }));

    await waitFor(() =>
      expect(mockedApi.refundPayment).toHaveBeenCalledWith(10, {
        amountCents: 500,
        reason: "duplicate",
      }),
    );

    expect(await screen.findByText("Refund issued.")).toBeInTheDocument();
    expect(screen.getByText("Refunded: $25.00")).toBeInTheDocument();
    expect(screen.getByText("Refund ID: re_123")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      "Refund issued (re_123).",
      "success",
    );
    expect(await screen.findByText("failed")).toBeInTheDocument();
  });

  it("issues full refund when amount input is left blank", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedApi.refundPayment.mockResolvedValueOnce({
      id: 10,
      userEmail: "payer@example.com",
      amount: 25,
      status: "failed",
      createdAt: "2024-05-01T00:00:00Z",
      refundId: "re_full",
      refundedCents: 2500,
    });

    render(
      <MemoryRouter initialEntries={["/admin/payments/10"]}>
        <Routes>
          <Route
            path="/admin/payments/:id"
            element={<AdminPaymentDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/payer@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /issue refund/i }));

    await waitFor(() =>
      expect(mockedApi.refundPayment).toHaveBeenCalledWith(10, {
        fullRefund: true,
        reason: undefined,
      }),
    );
  });

  it("shows an error message when refund fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedApi.refundPayment.mockRejectedValueOnce(new Error("nope"));

    render(
      <MemoryRouter initialEntries={["/admin/payments/10"]}>
        <Routes>
          <Route
            path="/admin/payments/:id"
            element={<AdminPaymentDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/payer@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /issue refund/i }));

    expect(await screen.findByText("nope")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      "Failed to issue refund: nope",
      "error",
    );
  });

  it("surfaces API errors when loading fails", async () => {
    mockedApi.getPayment.mockRejectedValueOnce(new Error("boom"));

    render(
      <MemoryRouter initialEntries={["/admin/payments/10"]}>
        <Routes>
          <Route
            path="/admin/payments/:id"
            element={<AdminPaymentDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Could not load payment"),
        "error",
      ),
    );

    expect(
      await screen.findByText(/Could not load payment: boom/i),
    ).toBeInTheDocument();
  });
});
