import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminBidPacksList } from "./AdminBidPacksList";
import {
  listBidPacks,
  deleteBidPack,
  updateBidPack,
} from "@api/admin/bidPacks";
import { showToast } from "../../../services/toast";
import { logAdminAction } from "../../../services/adminAudit";
import type { BidPack } from "../../../types/bidPack";

vi.mock("@api/admin/bidPacks");
vi.mock("../../../services/toast");
vi.mock("../../../services/adminAudit");

const mockedListBidPacks = vi.mocked(listBidPacks);
const mockedDeleteBidPack = vi.mocked(deleteBidPack);
const mockedUpdateBidPack = vi.mocked(updateBidPack);
const mockedShowToast = vi.mocked(showToast);
const mockedLogAdminAction = vi.mocked(logAdminAction);

const activePack: BidPack = {
  id: 1,
  name: "Starter",
  bids: 50,
  price: 5,
  description: "entry",
  pricePerBid: "0.10",
  highlight: false,
  status: "active",
  active: true,
};

const retiredPack: BidPack = {
  id: 2,
  name: "Legacy",
  bids: 100,
  price: 9.5,
  description: "retired",
  pricePerBid: "0.09",
  highlight: false,
  status: "retired",
  active: false,
};

const renderComponent = () =>
  render(
    <MemoryRouter>
      <AdminBidPacksList />
    </MemoryRouter>,
  );

describe("AdminBidPacksList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows retire and reactivate actions based on status", async () => {
    mockedListBidPacks.mockResolvedValue([activePack, retiredPack]);
    renderComponent();

    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();

    const activeRow = screen.getByText("Starter").closest("tr")!;
    const retiredRow = screen.getByText("Legacy").closest("tr")!;

    expect(
      within(activeRow).getByRole("button", { name: /retire/i }),
    ).toBeInTheDocument();
    expect(
      within(retiredRow).getByRole("button", { name: /reactivate/i }),
    ).toBeInTheDocument();
    expect(mockedListBidPacks).toHaveBeenCalledTimes(1);
  });

  it("retires an active pack via delete endpoint and refreshes list", async () => {
    mockedListBidPacks
      .mockResolvedValueOnce([activePack, retiredPack])
      .mockResolvedValueOnce([retiredPack]); // after retire
    mockedDeleteBidPack.mockResolvedValue();

    renderComponent();

    const retireButton = await screen.findByRole("button", { name: /retire/i });
    await userEvent.click(retireButton);

    await waitFor(() => {
      expect(mockedDeleteBidPack).toHaveBeenCalledWith(activePack.id);
      expect(mockedLogAdminAction).toHaveBeenCalledWith("bid_pack.retire", {
        id: activePack.id,
      });
      expect(mockedListBidPacks).toHaveBeenCalledTimes(2); // initial + refresh
    });
    expect(mockedShowToast).toHaveBeenCalledWith("Bid pack retired", "success");
  });

  it("reactivates a retired pack and refreshes list", async () => {
    mockedListBidPacks
      .mockResolvedValueOnce([retiredPack])
      .mockResolvedValueOnce([retiredPack, activePack]); // after reactivation
    mockedUpdateBidPack.mockResolvedValue({
      ...retiredPack,
      status: "active",
      active: true,
    });

    renderComponent();

    const reactivateButton = await screen.findByRole("button", {
      name: /reactivate/i,
    });
    await userEvent.click(reactivateButton);

    await waitFor(() => {
      expect(mockedUpdateBidPack).toHaveBeenCalledWith(retiredPack.id, {
        active: true,
      });
      expect(mockedLogAdminAction).toHaveBeenCalledWith("bid_pack.reactivate", {
        id: retiredPack.id,
      });
      expect(mockedListBidPacks).toHaveBeenCalledTimes(2);
    });
    expect(mockedShowToast).toHaveBeenCalledWith(
      "Bid pack reactivated",
      "success",
    );
  });
});
