import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPaymentsPage } from "./AdminPaymentsPage";

describe("AdminPaymentsPage", () => {
  it("renders payments header and rows", () => {
    render(<AdminPaymentsPage />);
    expect(screen.getAllByText(/recent payments/i).length).toBeGreaterThan(0);
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });
});
