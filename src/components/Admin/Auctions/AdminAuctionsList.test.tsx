import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminAuctionsList } from "./AdminAuctionsList";
import { getAuctions } from "../../../api/auctions";
import { updateAuction, deleteAuction } from "../../../api/admin/auctions";
import { showToast } from "../../../services/toast";

vi.mock("../../../api/auctions", () => ({
  getAuctions: vi.fn(),
}));

vi.mock("../../../api/admin/auctions", () => ({
  deleteAuction: vi.fn(),
  updateAuction: vi.fn(),
}));

vi.mock("../../../services/toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../../services/adminAudit", () => ({
  logAdminAction: vi.fn(),
}));

const mockAuctions = [
  {
    id: 1,
    title: "Vintage Guitar",
    description: "A nice guitar",
    current_price: 100,
    image_url: "",
    status: "inactive" as const,
    start_date: "2024-01-01T00:00:00Z",
    end_time: "2024-01-02T00:00:00Z",
    highest_bidder_id: 0,
    winning_user_name: null,
    bids: [],
  },
  {
    id: 2,
    title: "Signed Jersey",
    description: "Collector's item",
    current_price: 200,
    image_url: "",
    status: "active" as const,
    start_date: "2024-02-01T00:00:00Z",
    end_time: "2024-02-02T00:00:00Z",
    highest_bidder_id: 10,
    winning_user_name: "TopBidder",
    bids: [],
  },
];

describe("AdminAuctionsList", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(getAuctions).mockResolvedValue(mockAuctions);
    vi.mocked(updateAuction).mockResolvedValue(mockAuctions[0]);
    vi.mocked(deleteAuction).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders auctions with highest bidder info and view/edit links", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>
    );

    expect(await screen.findByText("Vintage Guitar")).toBeInTheDocument();
    expect(screen.getByText("Signed Jersey")).toBeInTheDocument();
    expect(screen.getByText("TopBidder")).toBeInTheDocument();

    expect(screen.getAllByText("View")).toHaveLength(2);
    expect(screen.getAllByText("Edit")).toHaveLength(2);
  });

  it("allows status change via table actions with confirmation", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>
    );

    const publishBtn = await screen.findByText("Publish");
    await user.click(publishBtn);

    await waitFor(() => {
      expect(updateAuction).toHaveBeenCalledWith(1, { status: "active" });
    });

    expect(showToast).toHaveBeenCalled();
  });

  it("retires an active auction via the retire action", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>
    );

    const retireBtn = await screen.findByText("Retire");
    await user.click(retireBtn);

    await waitFor(() => {
      expect(deleteAuction).toHaveBeenCalledWith(2);
    });
    expect(showToast).toHaveBeenCalled();
  });
});
