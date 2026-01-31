import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminRoute } from "@features/admin/components/AdminRoute";
import { AdminLayout } from "@features/admin/components/Admin/AdminLayout";
import { AdminDashboard } from "@features/admin/components/Admin/AdminDashboard";
import { AdminUsersPage } from "@features/admin/components/Admin/Users/AdminUsersPage";
import { ADMIN_PATHS } from "@features/admin/components/Admin/adminPaths";
import { adminUsersApi } from "@features/admin/api/adminUsersApi";
import { useLocation } from "react-router-dom";

const mockUseAuth = vi.fn();
vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const showToast = vi.fn();
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

vi.mock("@features/admin/api/adminUsersApi", () => ({
  adminUsersApi: {
    getUsers: vi.fn(),
  },
}));

const mockedAdminUsersApi = vi.mocked(adminUsersApi, true);

const LoginPage = () => {
  const location = useLocation();
  return <div>{`login:${location.pathname}${location.search}`}</div>;
};

const renderAdminRoute = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path={ADMIN_PATHS.users} element={<AdminUsersPage />} />
            <Route
              path={ADMIN_PATHS.payments}
              element={<div>payments page</div>}
            />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("admin navigation smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows access denied for non-admin users on /admin routes", () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: false, is_superuser: false },
      logout: vi.fn(),
    });

    renderAdminRoute("/admin/payments");

    expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      "Admin access only. Please sign in with an admin account.",
      "error",
    );
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it("lets admins access /admin and renders the admin shell", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: true, is_superuser: false, name: "Admin", email: "" },
      logout: vi.fn(),
    });

    renderAdminRoute("/admin");

    expect(await screen.findByText(/admin console/i)).toBeInTheDocument();
    expect(screen.getByText(/control center/i)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /admin navigation/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Auctions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bid Packs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Users" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });

  it("lets admins access /admin/payments", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: true, is_superuser: false, name: "Admin", email: "" },
      logout: vi.fn(),
    });

    renderAdminRoute("/admin/payments");

    expect(await screen.findByText(/admin console/i)).toBeInTheDocument();
    expect(screen.getByText("payments page")).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("lets superadmins access /admin and shows Users navigation", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: {
        is_admin: false,
        is_superuser: true,
        name: "Superadmin",
        email: "",
      },
      logout: vi.fn(),
    });
    mockedAdminUsersApi.getUsers.mockResolvedValue([]);

    renderAdminRoute("/admin/users");

    expect(await screen.findByText(/admin console/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(
      await screen.findByText(/manage user roles and access/i),
    ).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).toHaveBeenCalledTimes(1);
  });

  it("shows an access denied page for admins visiting superadmin-only routes", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: true, is_superuser: false },
      logout: vi.fn(),
    });

    renderAdminRoute("/admin/users");

    expect(
      await screen.findByText(/superadmin-only page/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to admin/i }),
    ).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).not.toHaveBeenCalled();
  });

  const makeApiError = (status: 401 | 403) =>
    Object.assign(new Error(String(status)), {
      isAxiosError: true,
      response: { status, data: {} },
    });

  it("surfaces forbidden API errors via toast when admin users fetch fails", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: false, is_superuser: true },
      logout: vi.fn(),
    });
    mockedAdminUsersApi.getUsers.mockRejectedValueOnce(makeApiError(403));

    renderAdminRoute("/admin/users");

    expect(
      await screen.findByText(/manage user roles and access/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Could not load users: 403"),
        "error",
      ),
    );
  });

  it("surfaces unauthorized API errors via toast when admin users fetch fails", async () => {
    mockUseAuth.mockReturnValue({
      isReady: true,
      user: { is_admin: false, is_superuser: true },
      logout: vi.fn(),
    });
    mockedAdminUsersApi.getUsers.mockRejectedValueOnce(makeApiError(401));

    renderAdminRoute("/admin/users");

    expect(
      await screen.findByText(/manage user roles and access/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Could not load users: 401"),
        "error",
      ),
    );
  });
});
