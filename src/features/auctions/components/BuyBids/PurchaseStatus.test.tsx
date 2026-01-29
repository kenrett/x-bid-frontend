import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import client from "@api/client";
import { PurchaseStatus } from "./PurchaseStatus";
import { UNEXPECTED_RESPONSE_MESSAGE } from "@services/unexpectedResponse";
import { useAuth } from "@features/auth/hooks/useAuth";
import { walletApi } from "@features/wallet/api/walletApi";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("@features/auth/hooks/useAuth");
vi.mock("@features/wallet/api/walletApi");

const mockedClient = vi.mocked(
  client as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  },
  { deep: true },
);
const mockUpdateUserBalance = vi.fn();
const mockedWalletApi = vi.mocked(walletApi, true);

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
    mockedWalletApi.getWallet.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      updateUserBalance: mockUpdateUserBalance,
      user: null,
    } as unknown as ReturnType<typeof useAuth>);
    searchParamsValue = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("shows error when session id is missing", async () => {
    renderWithPath();

    expect(
      await screen.findByText(
        "Could not find a payment session. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(mockedClient.get).not.toHaveBeenCalled();
    expect(mockUpdateUserBalance).not.toHaveBeenCalled();
  });

  it("handles applied status, updates balance, and navigates after delay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedClient.get.mockResolvedValue({
      data: { status: "applied" },
    });
    mockedWalletApi.getWallet.mockResolvedValue({
      creditsBalance: 150,
      asOf: null,
    });

    try {
      renderWithPath("?session_id=abc123");

      await waitFor(() => expect(mockedClient.get).toHaveBeenCalled());
      expect(await screen.findByText(/purchase complete/i)).toBeInTheDocument();
      expect(
        screen.getByText("Purchase complete. New balance: 150 credits."),
      ).toBeInTheDocument();
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(150);

      vi.runAllTimers();
      expect(mockNavigate).toHaveBeenCalledWith("/auctions");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders error message from API response", async () => {
    mockedClient.get.mockResolvedValue({
      data: { status: "failed", error: "Card declined" },
    });

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/payment error/i)).toBeInTheDocument();
    expect(screen.getByText("Card declined")).toBeInTheDocument();
  });

  it("shows pending UI and polls until applied", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockedClient.get.mockResolvedValue({
      data: { status: "pending" },
    });
    mockedWalletApi.getWallet.mockResolvedValue({
      creditsBalance: 200,
      asOf: null,
    });

    try {
      renderWithPath("?session_id=abc123");

      expect(
        await screen.findByText(/finalizing purchase/i),
      ).toBeInTheDocument();

      mockedClient.get.mockResolvedValueOnce({
        data: { status: "applied" },
      });

      vi.advanceTimersByTime(2000);
      await waitFor(() =>
        expect(screen.getByText(/purchase complete/i)).toBeInTheDocument(),
      );
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows unexpected response message for malformed payload", async () => {
    mockedClient.get.mockResolvedValue({
      data: null,
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

  it("prompts login for forbidden verification failures", async () => {
    const axiosError = Object.assign(new Error("forbidden"), {
      isAxiosError: true,
      response: { status: 403, data: { error: "Forbidden" } },
    });
    mockedClient.get.mockRejectedValue(axiosError);

    renderWithPath("?session_id=abc123");

    expect(await screen.findByText(/login required/i)).toBeInTheDocument();
    expect(
      screen.getByText("Please log in to verify your purchase."),
    ).toBeInTheDocument();
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
