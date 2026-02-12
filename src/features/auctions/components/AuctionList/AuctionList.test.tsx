import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AuctionList from "./AuctionList";
import { getAuctions } from "@features/auctions/api/auctions";
import {
  UnexpectedResponseError,
  UNEXPECTED_RESPONSE_MESSAGE,
} from "@services/unexpectedResponse";
import type { AuctionSummary } from "../../types/auction";
import {
  useAuctionListChannel,
  type AuctionListUpdate,
} from "../../hooks/useAuctionListChannel";

// Mock the API module
vi.mock("@features/auctions/api/auctions");

// Mock the child Auction component to isolate the AuctionList component
vi.mock("../Auction/Auction", () => ({
  Auction: ({
    onClick,
    id,
    title,
    current_price,
  }: {
    onClick: (id: number) => void;
    id: number;
    title: string;
    current_price: number;
  }) => (
    <button data-testid={`auction-${id}`} onClick={() => onClick(id)}>
      {title} - {current_price}
    </button>
  ),
}));

vi.mock("../../hooks/useAuctionListChannel", () => ({
  useAuctionListChannel: vi.fn(),
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
const mockedUseAuctionListChannel = vi.mocked(useAuctionListChannel);
let liveUpdateHandler: ((update: AuctionListUpdate) => void) | null = null;

const mockAuctions: AuctionSummary[] = [
  {
    id: 1,
    title: "Vintage Watch",
    current_price: 150.0,
    end_time: new Date().toISOString(),
    image_url: "",
    description: "",
    status: "active",
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
  {
    id: 3,
    title: "Scheduled Sculpture",
    current_price: 220.0,
    end_time: new Date().toISOString(),
    image_url: "",
    description: "",
    status: "scheduled",
    start_date: "",
    highest_bidder_id: 0,
    bid_count: 0,
  },
  {
    id: 4,
    title: "Completed Camera",
    current_price: 410.0,
    end_time: new Date().toISOString(),
    image_url: "",
    description: "",
    status: "complete",
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
    mockedUseAuctionListChannel.mockImplementation((handler) => {
      liveUpdateHandler = handler;
      return { connectionState: "connected" } as ReturnType<
        typeof useAuctionListChannel
      >;
    });
  });

  afterEach(() => {
    liveUpdateHandler = null;
    vi.restoreAllMocks();
  });

  it("should display a loading message initially", () => {
    // Make this promise never resolve to test the initial loading state in isolation
    mockedGetAuctions.mockReturnValue(new Promise(() => {}));
    render(<AuctionList />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading auctions/i);
  });

  it("should display only active auctions on successful fetch", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);

    // Wait for the loading to finish and auctions to be displayed
    expect(
      await screen.findByText(/Vintage Watch\s*-\s*150/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Art Painting\s*-\s*300/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Scheduled Sculpture\s*-\s*220/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Completed Camera\s*-\s*410/),
    ).not.toBeInTheDocument();

    // Ensure loading state is gone
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should display an error message if the fetch fails", async () => {
    const errorMessage = "Failed to fetch auctions.";
    mockedGetAuctions.mockRejectedValue(new Error("API Error"));
    render(<AuctionList />);

    // Wait for the error message to be displayed
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();

    // Ensure loading message and auction list are not present
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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
    const user = userEvent.setup();
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);

    // Wait for an auction to be on the screen
    const auctionElement = await screen.findByTestId(
      "auction-1",
      {},
      { timeout: 2000 },
    );

    // Simulate a user click
    await user.click(auctionElement);

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

  it.skip("shows live status indicator", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);

    const status = await screen.findByTestId("live-status");
    expect(status).toHaveTextContent("Connected");
    expect(status).toHaveTextContent("Live updates on");
  });

  it("applies live updates to existing auctions", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);
    await screen.findByText(/Vintage Watch\s*-\s*150/);

    liveUpdateHandler?.({ id: 1, current_price: 200, title: "Vintage Watch" });

    expect(
      await screen.findByText(/Vintage Watch\s*-\s*200/),
    ).toBeInTheDocument();
  });

  it("adds new auctions from live updates", async () => {
    mockedGetAuctions.mockResolvedValue([mockAuctions[0]]);
    render(<AuctionList />);
    await screen.findByText(/Vintage Watch\s*-\s*150/);

    liveUpdateHandler?.({
      id: 3,
      title: "New Arrival",
      current_price: 50,
      status: "active",
    });

    expect(await screen.findByText(/New Arrival\s*-\s*50/)).toBeInTheDocument();
  });

  it("ignores non-active auctions from live updates", async () => {
    mockedGetAuctions.mockResolvedValue([mockAuctions[0]]);
    render(<AuctionList />);
    await screen.findByText(/Vintage Watch\s*-\s*150/);

    liveUpdateHandler?.({
      id: 5,
      title: "Draft Item",
      current_price: 10,
      status: "inactive",
    });

    await waitFor(() => {
      expect(screen.queryByText(/Draft Item\s*-\s*10/)).toBeNull();
    });
  });

  it("removes an existing auction when live status changes away from active", async () => {
    mockedGetAuctions.mockResolvedValue([mockAuctions[0]]);
    render(<AuctionList />);
    await screen.findByText(/Vintage Watch\s*-\s*150/);

    liveUpdateHandler?.({ id: 1, status: "complete" });

    await waitFor(() =>
      expect(screen.queryByText(/Vintage Watch\s*-\s*150/)).toBeNull(),
    );
  });

  it("removes cancelled auctions from live updates", async () => {
    mockedGetAuctions.mockResolvedValue(mockAuctions);
    render(<AuctionList />);
    await screen.findByText(/Vintage Watch\s*-\s*150/);

    liveUpdateHandler?.({ id: 1, status: "cancelled" });

    await waitFor(() =>
      expect(screen.queryByText(/Vintage Watch\s*-\s*150/)).toBeNull(),
    );
  });
});
