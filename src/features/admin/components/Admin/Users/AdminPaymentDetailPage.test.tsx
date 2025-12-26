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
  bidPackId: 5,
  bidPackName: "Starter Pack",
  stripePaymentIntentId: "pi_123",
  stripeChargeId: "ch_123",
  stripeCustomerId: "cus_123",
  stripeInvoiceId: "in_123",
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
