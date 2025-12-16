import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AuctionList from "./AuctionList";
import { getAuctions } from "@features/auctions/api/auctions";
import {
  UnexpectedResponseError,
  UNEXPECTED_RESPONSE_MESSAGE,
} from "@services/unexpectedResponse";
import type { AuctionSummary } from "../../types/auction";

// Mock the API module
vi.mock("@features/auctions/api/auctions");

// Mock the child Auction component to isolate the AuctionList component
vi.mock("../Auction/Auction", () => ({
  Auction: ({
    onClick,
    id,
    title,
  }: {
    onClick: (id: number) => void;
    id: number;
    title: string;
  }) => (
    <button data-testid={`auction-${id}`} onClick={() => onClick(id)}>
      {title}
    </button>
  ),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockedGetAuctions = vi.mocked(getAuctions);

const mockAuctions: AuctionSummary[] = [
  {
    id: 1,
    title: "Vintage Watch",
    current_price: 150.0,
    end_time: new Date().toISOString(),
    image_url: "",
    description: "",
    status: "inactive",
    start_date: "",
    highest_bidder_id: 0,
    bid_count: 0,
  },
  {
    id: 2,
    title: "Art Painting",
    current_price: 300.0,
    end_time: new Date().toISOString(),
    image_url: "",
    description: "",
    status: "inactive",
    start_date: "",
    highest_bidder_id: 0,
    bid_count: 0,
  },
];

describe("AuctionList", () => {
  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();
    // Suppress console.error for tests that intentionally cause errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display a loading message initially", () => {
    // Make this promise never resolve to test the initial loading state in isolation
    mockedGetAuctions.mockReturnValue(new Promise(() => {}));
    render(<AuctionList />);
    expect(screen.getByText("Loading auctions...")).toBeInTheDocument();
  });

  it("should display a list of auctions on successful fetch", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);

    // Wait for the loading to finish and auctions to be displayed
    expect(await screen.findByText("Vintage Watch")).toBeInTheDocument();
    expect(screen.getByText("Art Painting")).toBeInTheDocument();

    // Ensure loading message is gone
    expect(screen.queryByText("Loading auctions...")).not.toBeInTheDocument();
  });

  it("should display an error message if the fetch fails", async () => {
    const errorMessage = "Failed to fetch auctions.";
    mockedGetAuctions.mockRejectedValue(new Error("API Error"));
    render(<AuctionList />);

    // Wait for the error message to be displayed
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();

    // Ensure loading message and auction list are not present
    expect(screen.queryByText("Loading auctions...")).not.toBeInTheDocument();
    expect(screen.queryByText("Vintage Watch")).not.toBeInTheDocument();
  });

  it("shows the unexpected-response message when response shape is invalid", async () => {
    mockedGetAuctions.mockRejectedValue(
      new UnexpectedResponseError("getAuctions"),
    );
    render(<AuctionList />);

    const errorElement = await screen.findByText(UNEXPECTED_RESPONSE_MESSAGE);
    expect(errorElement).toBeInTheDocument();
  });

  it('should display a "No auctions found" message when the fetch returns an empty array', async () => {
    mockedGetAuctions.mockResolvedValue([]);
    render(<AuctionList />);

    // Wait for the "No auctions found" message
    const noAuctionsMessage = await screen.findByText("No auctions found.");
    expect(noAuctionsMessage).toBeInTheDocument();
  });

  it("should navigate to the auction detail page when an auction is clicked", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);

    // Wait for an auction to be on the screen
    const auctionElement = await screen.findByTestId(
      "auction-1",
      {},
      { timeout: 2000 },
    );

    // Simulate a user click
    fireEvent.click(auctionElement);

    // Assert that navigate was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith("/auctions/1");
  });

  it("should only fetch auctions once on initial render", async () => {
    mockedGetAuctions.mockResolvedValue([]);
    render(<AuctionList />);

    // Wait for loading to complete
    await screen.findByText("No auctions found.");

    // Verify the API was called exactly once
    expect(mockedGetAuctions).toHaveBeenCalledTimes(1);
  });

  it("should not attempt to update state if the component unmounts during fetch", async () => {
    // This promise will be resolved manually later
    let resolvePromise: (value: AuctionSummary[]) => void;
    const promise = new Promise<AuctionSummary[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockedGetAuctions.mockImplementation(() => promise);

    const { unmount } = render(<AuctionList />);
    unmount();

    await resolvePromise!(mockAuctions);

    // The main assertion is that no "Can't perform a React state update on an unmounted component" warning is logged.
    // The `console.error` spy in `beforeEach` will catch this. We expect it to NOT have been called.
    expect(console.error).not.toHaveBeenCalled();
  });
});
