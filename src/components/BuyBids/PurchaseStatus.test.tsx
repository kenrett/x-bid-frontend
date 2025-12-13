import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import client from "@api/client";
import { PurchaseStatus } from "./PurchaseStatus";
import { UNEXPECTED_RESPONSE_MESSAGE } from "@services/unexpectedResponse";
import { useAuth } from "../../hooks/useAuth";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../hooks/useAuth");

const mockedClient = client as unknown as { get: vi.Mock; post: vi.Mock };
const mockUpdateUserBalance = vi.fn();

let searchParamsValue = "";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(searchParamsValue), vi.fn()],
  };
});

const mockNavigate = vi.fn();

const renderWithPath = (search = "") => {
  searchParamsValue = search.startsWith("?") ? search.slice(1) : search;
  const path = `/purchase-status${search ? `?${searchParamsValue}` : ""}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/purchase-status" element={<PurchaseStatus />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("PurchaseStatus", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockNavigate.mockClear();
    mockedClient.get.mockReset();
    mockUpdateUserBalance.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      updateUserBalance: mockUpdateUserBalance,
    } as unknown as ReturnType<typeof useAuth>);
    searchParamsValue = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("shows error when session id is missing", async () => {
    renderWithPath("/purchase-status");

    expect(
      await screen.findByText(
        "Could not find a payment session. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(mockedClient.get).not.toHaveBeenCalled();
    expect(mockUpdateUserBalance).not.toHaveBeenCalled();
  });

  it("handles successful verification, updates balance, and navigates after delay", async () => {
    const realSetTimeout = global.setTimeout;
    const setTimeoutSpy = vi
      .spyOn(global, "setTimeout")
      .mockImplementation((handler: TimerHandler, _delay?: number, ...args) =>
        realSetTimeout(handler as TimerHandler, 0, ...(args as [])),
      );

    mockedClient.get.mockResolvedValue({
      data: { status: "success", updated_bid_credits: 150 },
    });

    renderWithPath("?session_id=abc123");

    await vi.waitFor(() => expect(mockedClient.get).toHaveBeenCalled());
    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your purchase was successful! New balance: 150 credits.",
      ),
    ).toBeInTheDocument();
    expect(mockUpdateUserBalance).toHaveBeenCalledWith(150);

    await vi.waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/auctions"),
    );
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it("renders error message from API response", async () => {
    mockedClient.get.mockResolvedValue({
      data: { status: "error", error: "Card declined" },
    });

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/payment error/i)).toBeInTheDocument();
    expect(screen.getByText("Card declined")).toBeInTheDocument();
  });

  it("shows unexpected response message for malformed payload", async () => {
    mockedClient.get.mockResolvedValue({
      data: { status: "pending" },
    });

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/payment error/i)).toBeInTheDocument();
    expect(screen.getByText(UNEXPECTED_RESPONSE_MESSAGE)).toBeInTheDocument();
  });

  it("shows axios error message when request fails", async () => {
    const axiosError = Object.assign(new Error("fail"), {
      isAxiosError: true,
      response: { data: { error: "Server said no" } },
    });
    mockedClient.get.mockRejectedValue(axiosError);

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/payment error/i)).toBeInTheDocument();
    expect(screen.getByText("Server said no")).toBeInTheDocument();
  });

  it("shows generic error for non-axios failure", async () => {
    mockedClient.get.mockRejectedValue(new Error("boom"));

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/payment error/i)).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred."),
    ).toBeInTheDocument();
  });
});
