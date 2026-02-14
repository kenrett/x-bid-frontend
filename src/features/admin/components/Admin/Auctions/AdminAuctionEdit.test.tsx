import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminAuctionEdit } from "./AdminAuctionEdit";

const mockGetAuction = vi.fn();
const mockUpdateAuction = vi.fn();
const mockShowToast = vi.fn();
const mockLogAdminAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@features/admin/api/auctions", () => ({
  getAdminAuction: (...args: unknown[]) => mockGetAuction(...args),
  updateAuction: (...args: unknown[]) => mockUpdateAuction(...args),
}));
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));
vi.mock("@features/admin/api/adminAudit", () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderEdit = (initialPath = "/admin/auctions/5/edit") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/auctions/:id/edit" element={<AdminAuctionEdit />} />
      </Routes>
    </MemoryRouter>,
  );

describe("AdminAuctionEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows error for invalid id", () => {
    renderEdit("/admin/auctions/not-a-number/edit");

    expect(screen.getByText("Invalid auction id.")).toBeInTheDocument();
  });

  it("loads auction and submits updates", async () => {
    mockGetAuction.mockResolvedValue({
      id: 5,
      title: "Auction",
      status: "inactive",
      current_price: 10,
      storefront_key: "afterdark",
      is_adult: true,
      is_marketplace: false,
    });
    mockUpdateAuction.mockResolvedValue({});

    const { container } = renderEdit();

    expect(await screen.findByText("Update auction")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Updated Title" },
    });
    expect(screen.getByLabelText(/Storefront/i)).toHaveValue("afterdark");
    fireEvent.change(screen.getByLabelText(/Storefront/i), {
      target: { value: "marketplace" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUpdateAuction).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          title: "Updated Title",
          storefront_key: "marketplace",
        }),
      );
    });
    expect(mockLogAdminAction).toHaveBeenCalledWith("auction.update", {
      id: 5,
      title: "Updated Title",
      storefront_from: "afterdark",
      storefront_to: "marketplace",
    });
    expect(mockShowToast).toHaveBeenCalledWith("Auction updated", "success");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/auctions");
  });

  it("does not submit when storefront reassignment is canceled", async () => {
    mockGetAuction.mockResolvedValue({
      id: 5,
      title: "Auction",
      status: "inactive",
      current_price: 10,
      storefront_key: "afterdark",
      is_adult: true,
      is_marketplace: false,
    });
    mockUpdateAuction.mockResolvedValue({});

    const confirmSpy = vi.spyOn(window, "confirm");
    confirmSpy.mockReturnValueOnce(false);

    const { container } = renderEdit();

    expect(await screen.findByText("Update auction")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Storefront/i), {
      target: { value: "marketplace" },
    });

    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        "Reassign this auction to a different storefront? This changes where it is visible.",
      );
    });
    expect(mockUpdateAuction).not.toHaveBeenCalled();
  });

  it("handles fetch failure", async () => {
    mockGetAuction.mockRejectedValue(new Error("fail"));

    renderEdit();

    expect(
      await screen.findByText("Failed to load auction."),
    ).toBeInTheDocument();
  });
});
