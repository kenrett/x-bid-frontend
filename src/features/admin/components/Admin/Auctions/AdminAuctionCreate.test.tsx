import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminAuctionCreate } from "./AdminAuctionCreate";

const mockCreateAuction = vi.fn();
const mockShowToast = vi.fn();
const mockLogAdminAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@features/admin/api/auctions", () => ({
  createAuction: (...args: unknown[]) => mockCreateAuction(...args),
}));
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));
vi.mock("@features/admin/api/adminAudit", () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("AdminAuctionCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates auction, logs, toasts, and redirects on success", async () => {
    mockCreateAuction.mockResolvedValue({});
    const { container } = render(
      <MemoryRouter>
        <AdminAuctionCreate />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "New Auction" },
    });
    fireEvent.change(screen.getByLabelText(/Storefront/i), {
      target: { value: "marketplace" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await screen.findByText(/Create auction/i);

    expect(mockCreateAuction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Auction",
        storefront_key: "marketplace",
      }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith("auction.create", {
      title: "New Auction",
    });
    expect(mockShowToast).toHaveBeenCalledWith("Auction created", "success");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/auctions");
  });

  it("shows error toast on failure and resets submitting state", async () => {
    mockCreateAuction.mockRejectedValue(new Error("boom"));

    const { container } = render(
      <MemoryRouter>
        <AdminAuctionCreate />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "New Auction" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await screen.findByText(/Create auction/i);

    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to create auction",
      "error",
    );
  });
});
