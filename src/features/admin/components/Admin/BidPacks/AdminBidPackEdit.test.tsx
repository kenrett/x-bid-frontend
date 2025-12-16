import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminBidPackEdit } from "./AdminBidPackEdit";

const mockGetBidPack = vi.fn();
const mockUpdateBidPack = vi.fn();
const mockShowToast = vi.fn();
const mockLogAdminAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../api/admin/bidPacks", () => ({
  getBidPack: (...args: unknown[]) => mockGetBidPack(...args),
  updateBidPack: (...args: unknown[]) => mockUpdateBidPack(...args),
}));
vi.mock("../../../services/toast", () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));
vi.mock("../../../services/adminAudit", () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderEdit = (initialPath = "/admin/bid-packs/2/edit") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin/bid-packs/:id/edit"
          element={<AdminBidPackEdit />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("AdminBidPackEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows an error for invalid id", () => {
    renderEdit("/admin/bid-packs/not-a-number/edit");
    expect(screen.getByText("Invalid bid pack id.")).toBeInTheDocument();
  });

  it("loads bid pack and submits updates", async () => {
    mockGetBidPack.mockResolvedValue({
      id: 2,
      name: "Starter",
      status: "active",
      bids: 100,
      price: 50,
      pricePerBid: "0.50",
      highlight: false,
      active: true,
    });
    mockUpdateBidPack.mockResolvedValue({});

    const { container } = renderEdit();

    expect(await screen.findByText("Save changes")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Updated" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(mockUpdateBidPack).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ name: "Updated" }),
      ),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith("bid_pack.update", {
      id: 2,
      name: "Updated",
    });
    expect(mockShowToast).toHaveBeenCalledWith("Bid pack updated", "success");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/bid-packs");
  });

  it("handles retire/reactivate actions with confirmation", async () => {
    mockGetBidPack.mockResolvedValue({
      id: 2,
      name: "Starter",
      status: "active",
      bids: 100,
      price: 50,
      pricePerBid: "0.50",
      highlight: false,
      active: true,
    });
    mockUpdateBidPack
      .mockResolvedValueOnce({
        id: 2,
        name: "Starter",
        status: "retired",
        active: false,
      })
      .mockResolvedValueOnce({
        id: 2,
        name: "Starter",
        status: "active",
        active: true,
      });

    renderEdit();

    const retireButton = await screen.findByText(/Retire pack/i);
    fireEvent.click(retireButton);

    await waitFor(() =>
      expect(mockUpdateBidPack).toHaveBeenCalledWith(2, { active: false }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith("bid_pack.retire", {
      id: 2,
    });
    expect(mockShowToast).toHaveBeenCalledWith("Bid pack retired", "success");

    const reactivateButton = await screen.findByText(/Reactivate pack/i);
    fireEvent.click(reactivateButton);

    await waitFor(() =>
      expect(mockUpdateBidPack).toHaveBeenCalledWith(2, { active: true }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith("bid_pack.reactivate", {
      id: 2,
    });
    expect(mockShowToast).toHaveBeenCalledWith(
      "Bid pack reactivated",
      "success",
    );
  });

  it("shows error when fetch fails", async () => {
    mockGetBidPack.mockRejectedValue(new Error("fail"));
    renderEdit();

    expect(
      await screen.findByText("Failed to load bid pack."),
    ).toBeInTheDocument();
  });
});
