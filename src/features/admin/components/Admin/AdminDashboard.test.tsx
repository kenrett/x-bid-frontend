import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminDashboard } from "./AdminDashboard";

describe("AdminDashboard", () => {
  it("shows dashboard placeholder copy", () => {
    render(<AdminDashboard />);

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Use the navigation to manage auctions, bid packs, users\/payments, and settings./i,
      ),
    ).toBeInTheDocument();
  });
});
