import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
  },
  {
    id: 3,
    email: "superadmin@example.com",
    name: "Super Admin",
    role: "superadmin",
    status: "active",
  },
];

const mockUpdatedUser: AdminUser = {
  id: 2,
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  status: "active",
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "super@example.com", is_superuser: true },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    mockedAdminUsersApi.getUsers.mockResolvedValue(mockUsers);
    mockedAdminUsersApi.banUser.mockResolvedValue({
      ...mockUpdatedUser,
      status: "disabled",
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

    expect(screen.getByText(/admin accounts/i)).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).toHaveBeenCalled();

    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(await screen.findByText("Super Admin")).toBeInTheDocument();
  });

  it("calls the ban user API when a superadmin bans a user", async () => {
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const banButton = (await screen.findAllByText(/ban user/i))[0];
    await user.click(banButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedAdminUsersApi.banUser).toHaveBeenCalledWith(mockUsers[0].id);
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

    expect(mockedAdminUsersApi.revokeAdmin).toHaveBeenCalledWith(
      mockUsers[0].id,
    );
    expect(showToast).toHaveBeenCalledWith("Admin access removed", "success");
  });

  it("promotes a standard user when requested", async () => {
    const promoteTarget = { ...mockUsers[0], id: 9, role: "user" as const };
    mockedAdminUsersApi.getUsers.mockResolvedValue([promoteTarget]);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    const grantButton = await screen.findByText(/grant admin/i);
    await user.click(grantButton);

    expect(mockedAdminUsersApi.grantAdmin).toHaveBeenCalledWith(
      promoteTarget.id,
    );
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

    expect(mockedAdminUsersApi.revokeSuperadmin).toHaveBeenCalledWith(
      mockUsers[1].id,
    );
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

    await screen.findByText(/admin accounts/i);
    expect(showToast).toHaveBeenCalledWith(
      "Could not load users: nope",
      "error",
    );
  });

  it("blocks non-superadmin actions (no action buttons rendered)", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 2, email: "admin@example.com", is_superuser: false },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/superadmin-only page/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
  });
});
