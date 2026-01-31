import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ActivityPage } from "./ActivityPage";
import { activityApi } from "../api/activityApi";
import { useAuth } from "@features/auth/hooks/useAuth";
import type { ActivityItem } from "../types/activity";

vi.mock("../api/activityApi");
vi.mock("@features/auth/hooks/useAuth");

const mockedActivityApi = vi.mocked(activityApi, true);
const mockedUseAuth = vi.mocked(useAuth);

const createAuthReturn = () =>
  ({
    user: {
      id: 1,
      email: "user@example.com",
      name: "Player One",
      bidCredits: 200,
      is_admin: false,
    },
    isReady: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUserBalance: vi.fn(),
    sessionRemainingSeconds: 900,
  }) as unknown as ReturnType<typeof useAuth>;

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/account/activity"]}>
      <Routes>
        <Route path="/account/activity" element={<ActivityPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(createAuthReturn());
  });

  it("renders mixed activity items", async () => {
    const items: ActivityItem[] = [
      {
        id: "a1",
        occurredAt: "2024-05-01T10:00:00Z",
        auctionId: 10,
        auctionTitle: "Gadget",
        kind: "bid",
        bidAmount: 1,
        balanceDelta: -1,
      },
      {
        id: "a2",
        occurredAt: "2024-05-02T10:00:00Z",
        auctionId: 11,
        auctionTitle: "Laptop",
        kind: "watch",
        action: "added",
      },
      {
        id: "a2b",
        occurredAt: "2024-05-02T11:00:00Z",
        auctionId: 15,
        auctionTitle: "Phone",
        kind: "watch",
        action: "removed",
      },
      {
        id: "a3",
        occurredAt: "2024-05-03T10:00:00Z",
        auctionId: 12,
        auctionTitle: "TV",
        kind: "outcome",
        outcome: "won",
        finalBid: 42,
      },
      {
        id: "a4",
        occurredAt: "2024-05-04T10:00:00Z",
        auctionId: 13,
        auctionTitle: "Prize",
        kind: "fulfillment",
        fromStatus: "pending",
        toStatus: "shipped",
        trackingUrl: "https://carrier.example/track/123",
      },
      {
        id: "a5",
        occurredAt: "2024-05-05T10:00:00Z",
        auctionId: 14,
        auctionTitle: "Mystery",
        kind: "unknown",
        title: "Odd event",
      },
      {
        id: "a6",
        occurredAt: "2024-05-05T11:00:00Z",
        auctionId: 16,
        auctionTitle: "Another",
        kind: "unknown",
        message: "Backend says hello",
      },
    ];
    mockedActivityApi.list.mockResolvedValue({
      items,
      page: 1,
      perPage: 25,
      hasMore: false,
      nextCursor: null,
    });

    renderPage();

    expect(await screen.findByText(/my activity/i)).toBeInTheDocument();
    expect(screen.getByText(/bid placed/i)).toBeInTheDocument();
    expect(screen.getByText(/^bid$/i)).toBeInTheDocument();
    expect(screen.getByText(/^watching$/i)).toBeInTheDocument();
    expect(screen.getByText(/stopped watching/i)).toBeInTheDocument();
    expect(screen.getByText(/watch removed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^won$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/fulfillment update/i)).toBeInTheDocument();
    const feedList = screen.getByRole("list");
    expect(within(feedList).getByText(/^fulfillment$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/fulfillment:\s*pending\s*→\s*shipped/i),
    ).toBeInTheDocument();

    const winLink = screen.getByRole("link", { name: "Prize" });
    expect(winLink).toHaveAttribute("href", "/account/wins/13");

    const trackingLink = screen.getByRole("link", { name: /tracking/i });
    expect(trackingLink).toHaveAttribute(
      "href",
      "https://carrier.example/track/123",
    );

    expect(screen.getAllByText(/^activity$/i)[0]).toBeInTheDocument();

    const oddLink = screen.getByRole("link", { name: /odd event/i });
    expect(oddLink).toHaveAttribute("href", "/auctions/14");
    expect(screen.getAllByText(/^odd event$/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/backend says hello/i)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockedActivityApi.list.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 25,
      hasMore: false,
      nextCursor: null,
    });

    renderPage();

    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("shows error state and can retry", async () => {
    mockedActivityApi.list
      .mockRejectedValueOnce(
        Object.assign(new Error("axios"), {
          isAxiosError: true,
          response: { status: 500, data: { error: "boom" } },
        }),
      )
      .mockResolvedValue({
        items: [],
        page: 1,
        perPage: 25,
        hasMore: false,
        nextCursor: null,
      });

    renderPage();

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
    expect(mockedActivityApi.list).toHaveBeenCalledTimes(2);
  });

  it("appends new items on load more without duplicates", async () => {
    const firstPage: ActivityItem[] = [
      {
        id: "a1",
        occurredAt: "2024-05-01T10:00:00Z",
        auctionId: 10,
        auctionTitle: "Gadget",
        kind: "bid",
        bidAmount: 1,
        balanceDelta: -1,
      },
      {
        id: "a2",
        occurredAt: "2024-05-02T10:00:00Z",
        auctionId: 11,
        auctionTitle: "Laptop",
        kind: "watch",
        action: "added",
      },
    ];

    const secondPage: ActivityItem[] = [
      {
        id: "a2",
        occurredAt: "2024-05-02T10:00:00Z",
        auctionId: 11,
        auctionTitle: "Laptop",
        kind: "watch",
        action: "added",
      },
      {
        id: "a3",
        occurredAt: "2024-05-03T10:00:00Z",
        auctionId: 12,
        auctionTitle: "TV",
        kind: "outcome",
        outcome: "lost",
      },
    ];

    mockedActivityApi.list
      .mockResolvedValueOnce({
        items: firstPage,
        page: 1,
        perPage: 25,
        hasMore: true,
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        items: secondPage,
        page: 1,
        perPage: 25,
        hasMore: false,
        nextCursor: null,
      });

    renderPage();

    expect(await screen.findByText("Gadget")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /load more/i }));

    expect(await screen.findByText("TV")).toBeInTheDocument();
    expect(screen.getAllByText("Laptop").length).toBe(1);
  });
});
