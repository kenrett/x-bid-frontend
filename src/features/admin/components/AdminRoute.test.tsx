import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AdminRoute } from "./AdminRoute";

const mockUseAuth = vi.fn();
vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const showToast = vi.fn();
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

const renderRoute = (initialPath = "/admin") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>admin content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while auth is not ready", () => {
    mockUseAuth.mockReturnValue({ isReady: false, user: null });

    const { container } = renderRoute();

    expect(container).toBeEmptyDOMElement();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("redirects non-admins to login with redirect param and shows toast once", () => {
    mockUseAuth.mockReturnValue({ isReady: true, user: { is_admin: false } });

    renderRoute("/admin?foo=bar");

    expect(screen.getByText("login")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      "Admin access only. Please sign in with an admin account.",
      "error",
    );
    // ensure toast isn't re-fired on re-render
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("renders admin content for admins", () => {
    mockUseAuth.mockReturnValue({ isReady: true, user: { is_admin: true } });

    renderRoute();

    expect(screen.getByText("admin content")).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });
});
