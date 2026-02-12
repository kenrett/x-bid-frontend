import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminAuctionsList } from "./AdminAuctionsList";
import { getAuctions } from "@features/auctions/api/auctions";
import { updateAuction, deleteAuction } from "@features/admin/api/auctions";
import { showToast } from "@services/toast";
import type { AuctionSummary } from "@features/auctions/types/auction";

vi.mock("@features/auctions/api/auctions", () => ({
  getAuctions: vi.fn(),
}));

vi.mock("@features/admin/api/auctions", () => ({
  deleteAuction: vi.fn(),
  updateAuction: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("@features/admin/api/adminAudit", () => ({
  logAdminAction: vi.fn(),
}));

const mockAuctions: AuctionSummary[] = [
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
    bid_count: 0,
  },
  {
    id: 2,
    title: "Signed Jersey",
    description: "Collector's item",
    current_price: 150,
    image_url: "",
    status: "scheduled" as const,
    start_date: "2024-01-15T00:00:00Z",
    end_time: "2024-01-16T00:00:00Z",
    highest_bidder_id: null,
    winning_user_name: null,
    bid_count: 0,
  },
  {
    id: 3,
    title: "Active Watch",
    description: "Collector's item",
    current_price: 200,
    image_url: "",
    status: "active" as const,
    start_date: "2024-02-01T00:00:00Z",
    end_time: "2024-02-02T00:00:00Z",
    highest_bidder_id: 10,
    winning_user_name: "TopBidder",
    bid_count: 3,
  },
  {
    id: 4,
    title: "Completed Camera",
    description: "Auction done",
    current_price: 275,
    image_url: "",
    status: "complete" as const,
    start_date: "2024-03-01T00:00:00Z",
    end_time: "2024-03-02T00:00:00Z",
    highest_bidder_id: 20,
    winning_user_name: "Winner",
    bid_count: 8,
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
      </MemoryRouter>,
    );

    expect(await screen.findByText("Vintage Guitar")).toBeInTheDocument();
    expect(screen.getByText("Signed Jersey")).toBeInTheDocument();
    expect(screen.getByText("TopBidder")).toBeInTheDocument();

    expect(screen.getAllByText("View")).toHaveLength(4);
    expect(screen.getAllByText("Edit")).toHaveLength(4);
  });

  it("shows status actions only for valid backend transitions", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>,
    );

    const inactiveRow = (await screen.findByText("Vintage Guitar")).closest(
      "tr",
    );
    const scheduledRow = screen.getByText("Signed Jersey").closest("tr");
    const activeRow = screen.getByText("TopBidder").closest("tr");
    const completeRow = screen.getByText("Completed Camera").closest("tr");

    expect(inactiveRow).toBeTruthy();
    expect(scheduledRow).toBeTruthy();
    expect(activeRow).toBeTruthy();
    expect(completeRow).toBeTruthy();

    expect(
      within(inactiveRow as HTMLElement).getByRole("button", {
        name: "Restore to Scheduled",
      }),
    ).toBeInTheDocument();
    expect(
      within(inactiveRow as HTMLElement).queryByRole("button", {
        name: "Publish",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(inactiveRow as HTMLElement).queryByRole("button", {
        name: "Close",
      }),
    ).not.toBeInTheDocument();

    expect(
      within(scheduledRow as HTMLElement).getByRole("button", {
        name: "Publish",
      }),
    ).toBeInTheDocument();
    expect(
      within(scheduledRow as HTMLElement).queryByRole("button", {
        name: "Restore to Scheduled",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(scheduledRow as HTMLElement).queryByRole("button", {
        name: "Close",
      }),
    ).not.toBeInTheDocument();

    expect(
      within(activeRow as HTMLElement).getByRole("button", { name: "Close" }),
    ).toBeInTheDocument();
    expect(
      within(activeRow as HTMLElement).queryByRole("button", {
        name: "Publish",
      }),
    ).not.toBeInTheDocument();

    expect(
      within(completeRow as HTMLElement).queryByRole("button", {
        name: "Publish",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(completeRow as HTMLElement).queryByRole("button", {
        name: "Close",
      }),
    ).not.toBeInTheDocument();
  });

  it("sends scheduled status payload for restore", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>,
    );

    const restoreBtn = await screen.findByRole("button", {
      name: "Restore to Scheduled",
    });
    await user.click(restoreBtn);

    await waitFor(() => {
      expect(updateAuction).toHaveBeenCalledWith(1, { status: "scheduled" });
    });
  });

  it("sends active status payload for publish", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>,
    );

    const publishBtn = await screen.findByRole("button", { name: "Publish" });
    await user.click(publishBtn);

    await waitFor(() => {
      expect(updateAuction).toHaveBeenCalledWith(2, { status: "active" });
    });
    expect(showToast).toHaveBeenCalled();
  });

  it("shows transition errors with action, current status, and backend message", async () => {
    const user = userEvent.setup();
    vi.mocked(updateAuction).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: "invalid_state",
            message: "cannot start from inactive",
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>,
    );

    const publishBtn = await screen.findByRole("button", { name: "Publish" });
    await user.click(publishBtn);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Publish failed from scheduled: invalid_state: cannot start from inactive",
        "error",
      );
    });
  });

  it("retires an active auction via the retire action", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/auctions"]}>
        <AdminAuctionsList />
      </MemoryRouter>,
    );

    const retireBtn = await screen.findByText("Retire");
    await user.click(retireBtn);

    await waitFor(() => {
      expect(deleteAuction).toHaveBeenCalledWith(3);
    });
    expect(showToast).toHaveBeenCalled();
  });
});
