import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    token: "token",
    refreshToken: "refresh",
    sessionTokenId: "session",
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
      },
    ];
    mockedActivityApi.list.mockResolvedValue({
      items,
      page: 1,
      perPage: 25,
      hasMore: false,
    });

    renderPage();

    expect(await screen.findByText(/my activity/i)).toBeInTheDocument();
    expect(screen.getByText(/bid placed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/watching/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/won/i)).toBeInTheDocument();
    expect(screen.getByText(/fulfillment update/i)).toBeInTheDocument();
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

    expect(screen.getByText(/^activity$/i)).toBeInTheDocument();
    expect(screen.getByText(/activity update/i)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockedActivityApi.list.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 25,
      hasMore: false,
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
      });

    renderPage();

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
    expect(mockedActivityApi.list).toHaveBeenCalledTimes(2);
  });
});
