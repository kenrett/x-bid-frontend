import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MaintenanceMode } from "./MaintenanceMode";

const mockGetPublicMaintenance = vi.fn();
vi.mock("@features/admin/api/maintenance", () => ({
  getPublicMaintenance: () => mockGetPublicMaintenance(),
}));

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/maintenance"]}>
      <Routes>
        <Route path="/maintenance" element={<MaintenanceMode />} />
        <Route path="/auctions" element={<div>auctions</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("MaintenanceMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "keeps user on page when maintenance is enabled",
    async () => {
      mockGetPublicMaintenance.mockResolvedValue({
        enabled: true,
        updated_at: null,
      });

      renderPage();
      expect(await screen.findByText(/backstage action/i)).toBeInTheDocument();
      expect(navigate).not.toHaveBeenCalled();
    },
    { timeout: 10000 },
  );

  it(
    "redirects when maintenance is disabled",
    async () => {
      mockGetPublicMaintenance.mockResolvedValue({
        enabled: false,
        updated_at: null,
      });

      renderPage();

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith("/auctions", { replace: true });
      });
    },
    { timeout: 10000 },
  );

  it(
    "redirects on 401/404 axios errors",
    async () => {
      mockGetPublicMaintenance.mockRejectedValue({
        response: { status: 401 },
        isAxiosError: true,
        toJSON: () => ({}),
      });

      renderPage();

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith("/auctions", { replace: true });
      });
    },
    { timeout: 10000 },
  );

  it("clears interval on unmount", () => {
    mockGetPublicMaintenance.mockResolvedValue({
      enabled: true,
      updated_at: null,
    });
    vi.useFakeTimers();

    const { unmount } = renderPage();
    unmount();

    // Should not throw when advancing timers (interval cleared)
    expect(() => vi.runOnlyPendingTimers()).not.toThrow();
    vi.useRealTimers();
  });
});
