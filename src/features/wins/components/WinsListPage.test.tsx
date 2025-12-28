import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import { WinsListPage } from "./WinsListPage";
import { useAuth } from "@features/auth/hooks/useAuth";
import { winsApi } from "../api/winsApi";
import type { WinSummary } from "../types/win";

vi.mock("@features/auth/hooks/useAuth");
vi.mock("../api/winsApi");

const mockedUseAuth = vi.mocked(useAuth);
const mockedWinsApi = vi.mocked(winsApi, true);

const createAuthReturn = () =>
  ({
    user: {
      id: 1,
      email: "user@example.com",
      name: "Player One",
      bidCredits: 100,
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

const wins: WinSummary[] = [
  {
    auctionId: 101,
    auctionTitle: "MacBook Pro",
    endedAt: "2024-05-04T09:00:00Z",
    finalPrice: 12.5,
    currency: "usd",
    fulfillmentStatus: "pending",
  },
  {
    auctionId: 102,
    auctionTitle: "Nintendo Switch",
    endedAt: "2024-05-05T10:00:00Z",
    finalPrice: 33,
    currency: "usd",
    fulfillmentStatus: "shipped",
  },
];

const DetailEcho = () => {
  const { auction_id } = useParams();
  return <div>Win detail {auction_id}</div>;
};

describe("WinsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(createAuthReturn());
  });

  it("renders wins and navigates to detail on action click", async () => {
    mockedWinsApi.list.mockResolvedValue(wins);

    render(
      <MemoryRouter initialEntries={["/account/wins"]}>
        <Routes>
          <Route path="/account/wins" element={<WinsListPage />} />
          <Route path="/account/wins/:auction_id" element={<DetailEcho />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/macbook pro/i)).toBeInTheDocument();
    expect(screen.getByText(/\$12\.50/)).toBeInTheDocument();
    expect(screen.getByText(/awaiting claim/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getAllByRole("button", { name: /claim prize/i })[0],
    );

    expect(await screen.findByText(/win detail 101/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no wins", async () => {
    mockedWinsApi.list.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WinsListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/you haven’t won any auctions yet/i),
    ).toBeInTheDocument();
  });

  it("shows the correct status copy per win", async () => {
    mockedWinsApi.list.mockResolvedValue([
      {
        auctionId: 1,
        auctionTitle: "Prize A",
        endedAt: "2024-05-01T10:00:00Z",
        finalPrice: 10,
        currency: "usd",
        fulfillmentStatus: "pending",
      },
      {
        auctionId: 2,
        auctionTitle: "Prize B",
        endedAt: "2024-05-01T10:00:00Z",
        finalPrice: 10,
        currency: "usd",
        fulfillmentStatus: "claimed",
      },
      {
        auctionId: 3,
        auctionTitle: "Prize C",
        endedAt: "2024-05-01T10:00:00Z",
        finalPrice: 10,
        currency: "usd",
        fulfillmentStatus: "processing",
      },
      {
        auctionId: 4,
        auctionTitle: "Prize D",
        endedAt: "2024-05-01T10:00:00Z",
        finalPrice: 10,
        currency: "usd",
        fulfillmentStatus: "shipped",
      },
      {
        auctionId: 5,
        auctionTitle: "Prize E",
        endedAt: "2024-05-01T10:00:00Z",
        finalPrice: 10,
        currency: "usd",
        fulfillmentStatus: "fulfilled",
      },
    ]);

    render(
      <MemoryRouter>
        <WinsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/prize a/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting claim/i)).toBeInTheDocument();
    expect(screen.getByText(/preparing shipment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/processing/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/shipped/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });
});
