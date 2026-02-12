import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuctionDetail } from "./AuctionDetail";
import { useAuctionDetail } from "@features/auctions/hooks/useAuctionDetail";
import { MemoryRouter, useParams } from "react-router-dom";

// Mock dependencies
vi.mock("@features/auctions/hooks/useAuctionDetail");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});
vi.mock("../AuctionView/AuctionView", () => ({
  AuctionView: (props: {
    auction: { title: string; image_url?: string | null };
    onImageLoadError?: () => void;
    forceFallbackImage?: boolean;
    imageRenderKey?: string;
  }) => (
    <div data-testid="auction-view">
      <div>{props.auction.title}</div>
      <img
        key={props.imageRenderKey}
        alt={props.auction.title}
        src={
          props.forceFallbackImage
            ? "/assets/BidderSweet.svg"
            : (props.auction.image_url ?? "/assets/BidderSweet.svg")
        }
        onError={() => {
          void props.onImageLoadError?.();
        }}
      />
    </div>
  ),
}));

// Type-safe mocks
const mockedUseAuctionDetail = vi.mocked(useAuctionDetail);
const mockedUseParams = vi.mocked(useParams);

const mockAuction = {
  id: 1,
  title: "Test Auction",
  description: "A test description",
  current_price: 100,
  end_time: new Date().toISOString(),
  image_url: "test.jpg",
  status: "active",
  start_date: new Date().toISOString(),
  highest_bidder_id: null,
  bids: [],
};

describe("AuctionDetail Container", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Set a default mock for useParams
    mockedUseParams.mockReturnValue({ id: "1" });
  });

  it("should parse the auction ID from URL and call useAuctionDetail", () => {
    mockedUseParams.mockReturnValue({ id: "123" });
    mockedUseAuctionDetail.mockReturnValue({
      loading: true,
      auction: null,
      connectionState: "connecting",
    } as unknown as ReturnType<typeof useAuctionDetail>);

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    expect(mockedUseAuctionDetail).toHaveBeenCalledWith(123);
  });

  it("should display the loading screen while fetching data", () => {
    mockedUseAuctionDetail.mockReturnValue({
      loading: true,
      auction: null,
      connectionState: "connecting",
    } as unknown as ReturnType<typeof useAuctionDetail>);

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    expect(screen.getByText("Loading auction...")).toBeInTheDocument();
    expect(screen.queryByTestId("auction-view")).not.toBeInTheDocument();
  });

  it("should display the error screen if an error occurs", () => {
    const errorMessage = "Failed to fetch auction data.";
    mockedUseAuctionDetail.mockReturnValue({
      loading: false,
      auction: null,
      error: errorMessage,
      connectionState: "disconnected",
    } as unknown as ReturnType<typeof useAuctionDetail>);

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText("Loading auction...")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auction-view")).not.toBeInTheDocument();
  });

  it("should render AuctionView with auction data on successful fetch", () => {
    mockedUseAuctionDetail.mockReturnValue({
      loading: false,
      auction: mockAuction,
      error: null,
      connectionState: "connected",
      // ... other return values
    } as unknown as ReturnType<typeof useAuctionDetail>);

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    // Check that the mock AuctionView is rendered with the correct data
    const auctionView = screen.getByTestId("auction-view");
    expect(auctionView).toBeInTheDocument();
    expect(auctionView).toHaveTextContent("Test Auction");

    // Check that loading and error states are not rendered
    expect(screen.queryByText("Loading auction...")).not.toBeInTheDocument();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });

  it("retries image load once by refetching auction detail and using a fresh image URL", async () => {
    let auctionImageUrl = "https://example.com/expired-signed-url.jpg";
    const refreshAuction = vi.fn(async () => {
      auctionImageUrl = "https://example.com/fresh-signed-url.jpg";
    });

    mockedUseAuctionDetail.mockImplementation(
      () =>
        ({
          loading: false,
          auction: { ...mockAuction, image_url: auctionImageUrl },
          error: null,
          connectionState: "connected",
          refreshAuction,
        }) as unknown as ReturnType<typeof useAuctionDetail>,
    );

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    const image = screen.getByAltText("Test Auction");
    expect(image).toHaveAttribute(
      "src",
      "https://example.com/expired-signed-url.jpg",
    );

    fireEvent.error(image);

    await waitFor(() => {
      expect(refreshAuction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByAltText("Test Auction")).toHaveAttribute(
        "src",
        "https://example.com/fresh-signed-url.jpg",
      );
    });
  });

  it("falls back to local image if retry image load also fails", async () => {
    let auctionImageUrl = "https://example.com/expired-signed-url.jpg";
    const refreshAuction = vi.fn(async () => {
      auctionImageUrl = "https://example.com/still-broken-url.jpg";
    });

    mockedUseAuctionDetail.mockImplementation(
      () =>
        ({
          loading: false,
          auction: { ...mockAuction, image_url: auctionImageUrl },
          error: null,
          connectionState: "connected",
          refreshAuction,
        }) as unknown as ReturnType<typeof useAuctionDetail>,
    );

    render(<AuctionDetail />, { wrapper: MemoryRouter });

    const image = screen.getByAltText("Test Auction");
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByAltText("Test Auction")).toHaveAttribute(
        "src",
        "https://example.com/still-broken-url.jpg",
      );
    });

    fireEvent.error(screen.getByAltText("Test Auction"));

    await waitFor(() => {
      expect(refreshAuction).toHaveBeenCalledTimes(1);
      expect(screen.getByAltText("Test Auction")).toHaveAttribute(
        "src",
        "/assets/BidderSweet.svg",
      );
    });
  });
});
