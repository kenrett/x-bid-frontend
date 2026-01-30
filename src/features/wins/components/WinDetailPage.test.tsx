import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  shippingCarrier: null,
  trackingNumber: null,
  trackingUrl: null,
};

const pendingDetail: WinDetail = {
  auctionId: 321,
  auctionTitle: "DJI Drone",
  endedAt: "2024-05-07T12:00:00Z",
  finalPrice: 88,
  currency: "usd",
  fulfillmentStatus: "pending",
  fulfillmentNote: null,
  shippingCarrier: null,
  trackingNumber: null,
  trackingUrl: null,
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

  it("renders claim form when win is pending", async () => {
    mockedWinsApi.get.mockResolvedValue(pendingDetail);

    render(
      <MemoryRouter initialEntries={["/account/wins/321"]}>
        <Routes>
          <Route path="/account/wins/:auction_id" element={<WinDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /dji drone/i }),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /claim prize/i }));

    expect(
      screen.getByRole("textbox", { name: /full name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /address line 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit claim/i }),
    ).toBeInTheDocument();
  });

  it("submitting a claim updates the UI to processing", async () => {
    mockedWinsApi.get.mockResolvedValue(pendingDetail);
    mockedWinsApi.claim.mockResolvedValue({
      ...pendingDetail,
      fulfillmentStatus: "claimed",
    });

    render(
      <MemoryRouter initialEntries={["/account/wins/321"]}>
        <Routes>
          <Route path="/account/wins/:auction_id" element={<WinDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /dji drone/i }),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /claim prize/i }));

    await user.type(
      screen.getByRole("textbox", { name: /full name/i }),
      "Jane Winner",
    );
    await user.type(
      screen.getByRole("textbox", { name: /address line 1/i }),
      "123 Main St",
    );
    await user.type(
      screen.getByRole("textbox", { name: /address line 2/i }),
      "Apt 4",
    );
    await user.type(screen.getByRole("textbox", { name: /city/i }), "Austin");
    await user.type(screen.getByRole("textbox", { name: /state/i }), "TX");
    await user.type(
      screen.getByRole("textbox", { name: /postal code/i }),
      "78701",
    );
    await user.type(screen.getByRole("textbox", { name: /country/i }), "US");

    await user.click(screen.getByRole("button", { name: /submit claim/i }));

    expect(await screen.findByText(/claim submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/follow up/i)).toBeInTheDocument();
  });

  it("does not allow claiming when already claimed", async () => {
    mockedWinsApi.get.mockResolvedValue({
      ...pendingDetail,
      fulfillmentStatus: "claimed",
    });

    render(
      <MemoryRouter initialEntries={["/account/wins/321"]}>
        <Routes>
          <Route path="/account/wins/:auction_id" element={<WinDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /dji drone/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /claim prize/i }),
    ).not.toBeInTheDocument();
  });

  it("shows tracking details when shipped", async () => {
    mockedWinsApi.get.mockResolvedValue({
      ...pendingDetail,
      auctionId: 555,
      auctionTitle: "PlayStation 5",
      fulfillmentStatus: "shipped",
      shippingCarrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      trackingUrl: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    });

    render(
      <MemoryRouter initialEntries={["/account/wins/555"]}>
        <Routes>
          <Route path="/account/wins/:auction_id" element={<WinDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /playstation 5/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /tracking/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ups/i)).toBeInTheDocument();
    expect(screen.getByText(/1z999aa10123456784/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /track package/i }),
    ).toHaveAttribute(
      "href",
      "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    );
  });
});
