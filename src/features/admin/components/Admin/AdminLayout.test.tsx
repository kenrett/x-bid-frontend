import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminLayout } from "./AdminLayout";

const mockUseAuth = vi.fn();
const mockLogout = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const renderAdminLayout = (path = "/admin/auctions") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/:section/*" element={<AdminLayout />}>
          <Route index element={<div>child content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { name: "Admin User", email: "admin@example.com" },
      logout: mockLogout,
    });
  });

  it("renders user info, navigation links, and outlet content", () => {
    renderAdminLayout();

    expect(screen.getAllByText("Admin User")).toHaveLength(2);
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Admin navigation")).toBeInTheDocument();
    expect(screen.getByText("Auctions")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("calls logout when button is clicked", () => {
    renderAdminLayout();

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
