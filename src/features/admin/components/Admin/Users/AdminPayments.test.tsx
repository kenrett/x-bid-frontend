import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPayments } from "./AdminPayments";
import type { Payment } from "@features/admin/types/users";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const payments: Payment[] = [
  {
    id: 1,
    userEmail: "a@example.com",
    amount: 10,
    status: "succeeded",
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    userEmail: "b@example.com",
    amount: 20,
    status: "failed",
    createdAt: "2024-01-02",
  },
];

describe("AdminPayments", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
  });

  it("renders payments table", () => {
    render(
      <AdminPayments payments={payments} search="" onSearchChange={() => {}} />,
    );

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("b@example.com")).toBeInTheDocument();
  });

  it("shows empty state when no payments", () => {
    render(<AdminPayments payments={[]} search="" onSearchChange={() => {}} />);

    expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
  });

  it("invokes search change handler", async () => {
    const onSearchChange = vi.fn();
    render(
      <AdminPayments
        payments={payments}
        search=""
        onSearchChange={onSearchChange}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/filter by user email/i), "b@");

    const values = onSearchChange.mock.calls.map((call) => call[0]);
    expect(values).toEqual(["b", "@"]);
  });

  it("navigates to payment details when row is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AdminPayments payments={payments} search="" onSearchChange={() => {}} />,
    );

    const row = screen.getByLabelText(/payment 1/i);
    await user.click(row);

    expect(mockedNavigate).toHaveBeenCalledWith("/admin/payments/1");
  });
});
