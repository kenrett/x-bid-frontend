import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { WinDetailPage } from "./WinDetailPage";
import { useAuth } from "@features/auth/hooks/useAuth";
import { winsApi } from "../api/winsApi";
import type { WinDetail } from "../types/win";

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

const detail: WinDetail = {
  auctionId: 123,
  auctionTitle: "iPad Air",
  endedAt: "2024-05-06T12:00:00Z",
  finalPrice: 44,
  currency: "usd",
  fulfillmentStatus: "processing",
  fulfillmentNote: "We are preparing your shipment.",
};

describe("WinDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(createAuthReturn());
  });

  it("renders win detail correctly", async () => {
    mockedWinsApi.get.mockResolvedValue(detail);

    render(
      <MemoryRouter initialEntries={["/account/wins/123"]}>
        <Routes>
          <Route path="/account/wins/:auction_id" element={<WinDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /ipad air/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$44\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/processing/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/we are preparing your shipment/i),
    ).toBeInTheDocument();
  });
});
