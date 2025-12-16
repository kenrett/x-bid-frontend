import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminBidPackCreate } from "./AdminBidPackCreate";

const mockCreateBidPack = vi.fn();
const mockShowToast = vi.fn();
const mockLogAdminAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@features/admin/api/bidPacks", () => ({
  createBidPack: (...args: unknown[]) => mockCreateBidPack(...args),
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

describe("AdminBidPackCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates bid pack, logs, toasts, and redirects", async () => {
    mockCreateBidPack.mockResolvedValue({});
    const { container } = render(
      <MemoryRouter>
        <AdminBidPackCreate />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Starter" },
    });
    fireEvent.change(screen.getByLabelText(/Bids/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByLabelText(/Highlight as featured/i));

    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await screen.findByText(/Create bid pack/i);

    expect(mockCreateBidPack).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Starter", bids: 100, price: 25 }),
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith("bid_pack.create", {
      name: "Starter",
    });
    expect(mockShowToast).toHaveBeenCalledWith("Bid pack created", "success");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/bid-packs");
  });

  it("surfaces errors via toast", async () => {
    mockCreateBidPack.mockRejectedValue(new Error("boom"));

    const { container } = render(
      <MemoryRouter>
        <AdminBidPackCreate />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Starter" },
    });
    fireEvent.change(screen.getByLabelText(/Bids/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "25" },
    });

    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    await screen.findByText(/Create bid pack/i);
    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to create bid pack",
      "error",
    );
  });
});
