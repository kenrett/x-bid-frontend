import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersPage } from "./AdminUsersPage";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/services/toast";
import { adminUsersApi } from "@/services/adminUsersApi";

vi.mock("@/hooks/useAuth");
vi.mock("@/services/toast", () => ({
  showToast: vi.fn(),
}));
vi.mock("@/services/adminAudit", () => ({
  logAdminAction: vi.fn(),
}));
vi.mock("@/services/adminUsersApi");

const mockedUseAuth = vi.mocked(useAuth);
const mockedAdminUsersApi = vi.mocked(adminUsersApi);

const mockUsers = [
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

const mockUpdatedUser = {
  id: 2,
  email: "admin@example.com",
  name: "Admin User",
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "super@example.com", is_superuser: true },
      logout: vi.fn(),
    } as any);
    mockedAdminUsersApi.getUsers.mockResolvedValue(mockUsers);
    mockedAdminUsersApi.banUser.mockResolvedValue({
      ...mockUpdatedUser,
      status: "disabled",
    } as any);
    mockedAdminUsersApi.grantAdmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "admin",
    } as any);
    mockedAdminUsersApi.revokeAdmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "user",
    } as any);
    mockedAdminUsersApi.revokeSuperadmin.mockResolvedValue({
      ...mockUpdatedUser,
      role: "admin",
    } as any);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and renders users on load", async () => {
    render(<AdminUsersPage />);

    expect(screen.getByText(/admin accounts/i)).toBeInTheDocument();
    expect(mockedAdminUsersApi.getUsers).toHaveBeenCalled();

    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(await screen.findByText("Super Admin")).toBeInTheDocument();
  });

  it("calls the ban user API when a superadmin bans a user", async () => {
    render(<AdminUsersPage />);
    const user = userEvent.setup();

    const banButton = (await screen.findAllByText(/ban user/i))[0];
    await user.click(banButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedAdminUsersApi.banUser).toHaveBeenCalledWith(mockUsers[0].id);
    expect(showToast).toHaveBeenCalledWith("User banned", "success");
  });

  it("calls the revoke admin API when a superadmin demotes an admin", async () => {
    render(<AdminUsersPage />);
    const user = userEvent.setup();

    const demoteButton = await screen.findByText(/remove admin/i);
    await user.click(demoteButton);

    expect(mockedAdminUsersApi.revokeAdmin).toHaveBeenCalledWith(
      mockUsers[0].id,
    );
    expect(showToast).toHaveBeenCalledWith("Admin access removed", "success");
  });

  it("blocks non-superadmin actions (no action buttons rendered)", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 2, email: "admin@example.com", is_superuser: false },
      logout: vi.fn(),
    } as any);
    render(<AdminUsersPage />);

    await screen.findByText("Admin User");
    expect(screen.queryByText(/ban user/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove admin/i)).not.toBeInTheDocument();
  });
});
