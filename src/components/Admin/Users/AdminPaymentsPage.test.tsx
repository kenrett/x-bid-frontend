import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPaymentsPage } from "./AdminPaymentsPage";
import { adminPaymentsApi } from "@services/adminPaymentsApi";
import { showToast } from "@services/toast";
import type { Payment } from "./types";

vi.mock("@services/adminPaymentsApi");
vi.mock("@services/toast", () => ({
  showToast: vi.fn(),
}));

const mockedAdminPaymentsApi = vi.mocked(adminPaymentsApi);
const mockPayments: Payment[] = [
  {
    id: 101,
    userEmail: "admin@example.com",
    amount: 49.99,
    status: "succeeded",
    createdAt: "2024-07-01T12:00:00Z",
  },
  {
    id: 102,
    userEmail: "superadmin@example.com",
    amount: 99.99,
    status: "failed",
    createdAt: "2024-07-02T13:10:00Z",
  },
];

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    mockedAdminPaymentsApi.listPayments.mockResolvedValue(mockPayments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders payments header and rows", async () => {
    render(<AdminPaymentsPage />);

    expect(mockedAdminPaymentsApi.listPayments).toHaveBeenCalled();
    expect(screen.getAllByText(/recent payments/i).length).toBeGreaterThan(0);
    expect(
      await screen.findByRole("button", { name: /refresh/i }),
    ).toBeInTheDocument();
  });

  it("fetches and displays payments", async () => {
    render(<AdminPaymentsPage />);

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(
      await screen.findByText("superadmin@example.com"),
    ).toBeInTheDocument();
  });

  it("refreshes payments from the API", async () => {
    mockedAdminPaymentsApi.listPayments
      .mockResolvedValueOnce(mockPayments)
      .mockResolvedValueOnce([
        {
          id: 201,
          userEmail: "new@example.com",
          amount: 10,
          status: "pending",
          createdAt: "2024-08-01T00:00:00Z",
        },
      ]);

    render(<AdminPaymentsPage />);
    const user = userEvent.setup();

    await screen.findByText("admin@example.com");
    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(await screen.findByText("new@example.com")).toBeInTheDocument();
    expect(mockedAdminPaymentsApi.listPayments).toHaveBeenCalledTimes(2);
  });

  it("surfaces errors from the API", async () => {
    mockedAdminPaymentsApi.listPayments.mockRejectedValueOnce(
      new Error("boom"),
    );

    render(<AdminPaymentsPage />);

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Could not load payments"),
        "error",
      ),
    );
  });
});
