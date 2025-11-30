import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersPage } from "./AdminUsersPage";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/services/toast";

vi.mock("@/hooks/useAuth");
vi.mock("@/services/toast", () => ({
  showToast: vi.fn(),
}));
vi.mock("@/services/adminAudit", () => ({
  logAdminAction: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "super@example.com", is_superuser: true },
      logout: vi.fn(),
    } as any);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders users heading and rows", () => {
    render(<AdminUsersPage />);

    expect(screen.getByText(/admin accounts/i)).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("allows superadmin actions to ban", async () => {
    render(<AdminUsersPage />);

    const banButtons = screen.getAllByText(/ban user/i);
    await userEvent.click(banButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
  });

  it("blocks non-superadmin actions (no action buttons rendered)", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 2, email: "admin@example.com", is_superuser: false },
      logout: vi.fn(),
    } as any);
    render(<AdminUsersPage />);

    expect(screen.queryByText(/ban user/i)).not.toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });
});
