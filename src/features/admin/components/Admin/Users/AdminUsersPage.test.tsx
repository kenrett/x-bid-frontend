import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersPage } from "./AdminUsersPage";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@services/toast";
import { adminUsersApi } from "@features/admin/api/adminUsersApi";
import type { AdminUser } from "@features/admin/types/users";

vi.mock("@features/auth/hooks/useAuth");
vi.mock("@services/toast", () => ({
  showToast: vi.fn(),
}));
vi.mock("@features/admin/api/adminAudit", () => ({
  logAdminAction: vi.fn(),
}));
vi.mock("@features/admin/api/adminUsersApi");

const mockedUseAuth = vi.mocked(useAuth);
const mockedAdminUsersApi = vi.mocked(adminUsersApi);

const mockUsers: AdminUser[] = [
  {
    id: 2,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    status: "active",
    emailVerified: true,
    emailVerifiedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    email: "superadmin@example.com",
    name: "Super Admin",
    role: "superadmin",
    status: "active",
    emailVerified: true,
    emailVerifiedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 4,
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    status: "active",
    emailVerified: false,
    emailVerifiedAt: null,
  },
];

const mockUpdatedUser: AdminUser = {
  id: 4,
  email: "user@example.com",
  name: "Regular User",
  role: "user",
  status: "active",
  emailVerified: false,
  emailVerifiedAt: null,
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "super@example.com",
        is_admin: true,
        is_superuser: true,
      },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockedAdminUsersApi.getUsers.mockResolvedValue(mockUsers);
    mockedAdminUsersApi.banUser.mockResolvedValue({
      ...mockUpdatedUser,
      status: "disabled",
    });
    mockedAdminUsersApi.suspendUser.mockResolvedValue({
      ...mockUpdatedUser,
      status: "disabled",
    });
    mockedAdminUsersApi.unsuspendUser.mockResolvedValue({
      ...mockUpdatedUser,
      status: "active",
    });
    mockedAdminUsersApi.verifyEmail.mockResolvedValue({
      ...mockUpdatedUser,
      emailVerified: true,
      emailVerifiedAt: "2026-01-02T00:00:00Z",
    });
    mockedAdminUsersApi.grantAdmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "admin",
    });
    mockedAdminUsersApi.revokeAdmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "user",
    });
    mockedAdminUsersApi.revokeSuperadmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "admin",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and renders users on load", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /user accounts/i, level: 2 }),
    ).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).toHaveBeenCalled();

    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(await screen.findByText("Super Admin")).toBeInTheDocument();
    expect(await screen.findByText("Regular User")).toBeInTheDocument();
  });

  it("calls the suspend API when an admin suspends a non-admin user", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "admin@example.com",
        is_admin: true,
        is_superuser: false,
      },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const suspendButton = await screen.findByText(/suspend user/i);
    await user.click(suspendButton);

    expect(mockedAdminUsersApi.suspendUser).toHaveBeenCalledWith(4);
    expect(showToast).toHaveBeenCalledWith("User suspended", "success");
  });

  it("calls the verify email API for non-admin users", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const verifyButton = await screen.findByText(/mark email verified/i);
    await user.click(verifyButton);

    expect(mockedAdminUsersApi.verifyEmail).toHaveBeenCalledWith(4);
    expect(showToast).toHaveBeenCalledWith("Email marked verified", "success");
  });

  it("calls the ban user API when a superadmin bans a non-admin user", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const regularUserCell = await screen.findByText("Regular User");
    const row = regularUserCell.closest("tr");
    expect(row).not.toBeNull();
    const banButton = within(row as HTMLElement).getByText(/ban user/i);
    await user.click(banButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedAdminUsersApi.banUser).toHaveBeenCalledWith(4);
    expect(showToast).toHaveBeenCalledWith("User banned", "success");
  });

  it("calls the revoke admin API when a superadmin demotes an admin", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const demoteButton = await screen.findByText(/remove admin/i);
    await user.click(demoteButton);

    expect(mockedAdminUsersApi.revokeAdmin).toHaveBeenCalledWith(2);
    expect(showToast).toHaveBeenCalledWith("Admin access removed", "success");
  });

  it("promotes a standard user when requested", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const grantButton = await screen.findByText(/grant admin/i);
    await user.click(grantButton);

    expect(mockedAdminUsersApi.grantAdmin).toHaveBeenCalledWith(4);
    expect(showToast).toHaveBeenCalledWith("Admin granted", "success");
  });

  it("removes superadmin access", async () => {
    mockedAdminUsersApi.getUsers.mockResolvedValue(mockUsers);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const removeSuperButton = await screen.findByText(/remove superadmin/i);
    await user.click(removeSuperButton);

    expect(mockedAdminUsersApi.revokeSuperadmin).toHaveBeenCalledWith(3);
    expect(showToast).toHaveBeenCalledWith(
      "Superadmin access removed",
      "success",
    );
  });

  it("surfaces load errors", async () => {
    mockedAdminUsersApi.getUsers.mockRejectedValue(new Error("nope"));
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: /user accounts/i, level: 2 });
    expect(showToast).toHaveBeenCalledWith(
      "Could not load users: nope",
      "error",
    );
  });

  it("shows access denied for non-admin users", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        email: "user@example.com",
        is_admin: false,
        is_superuser: false,
      },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/admin-only page/i)).toBeInTheDocument();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).not.toHaveBeenCalled();
  });

  it("hides superadmin role actions for admins and scopes list to non-admin users", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        email: "admin@example.com",
        is_admin: true,
        is_superuser: false,
      },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Regular User")).toBeInTheDocument();
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.queryByText(/remove admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove superadmin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/grant admin/i)).not.toBeInTheDocument();
  });
});
