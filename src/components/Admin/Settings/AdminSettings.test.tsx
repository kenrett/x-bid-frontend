import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminSettings } from "./AdminSettings";
import { getMaintenance, setMaintenance } from "@/api/admin/maintenance";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/api/admin/maintenance", () => ({
  getMaintenance: vi.fn(),
  setMaintenance: vi.fn(),
}));

vi.mock("@/hooks/useAuth");

const mockedGetMaintenance = vi.mocked(getMaintenance);
const mockedSetMaintenance = vi.mocked(setMaintenance);
const mockedUseAuth = vi.mocked(useAuth);

const renderComponent = () =>
  render(
    <MemoryRouter>
      <AdminSettings />
    </MemoryRouter>,
  );

describe("AdminSettings (maintenance)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "super@example.com", is_superuser: true },
    } as any);
    mockedGetMaintenance.mockResolvedValue({
      enabled: false,
      updated_at: null,
    });
    mockedSetMaintenance.mockResolvedValue({
      enabled: true,
      updated_at: "2025-01-01T00:00:00Z",
    });
  });

  it("loads maintenance state on mount", async () => {
    renderComponent();
    expect(
      await screen.findByRole("heading", { name: /maintenance mode/i }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedGetMaintenance).toHaveBeenCalled();
    });
  });

  it("allows superadmin to toggle maintenance", async () => {
    const user = userEvent.setup();
    renderComponent();

    const toggle = await screen.findByRole("checkbox");
    await user.click(toggle);

    await waitFor(() => {
      expect(mockedSetMaintenance).toHaveBeenCalledWith(true);
    });
  });

  it("blocks non-superadmin from toggling", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 2, email: "admin@example.com", is_superuser: false },
    } as any);
    mockedGetMaintenance.mockResolvedValue({
      enabled: false,
      updated_at: null,
    });
    renderComponent();

    const toggle = await screen.findByRole("checkbox");
    expect(toggle).toBeDisabled(); // locked for non-superadmin
  });
});
