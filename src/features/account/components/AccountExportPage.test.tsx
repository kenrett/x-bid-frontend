import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountExportPage } from "./AccountExportPage";

vi.mock("@api/client");

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));

const mockedClient = vi.mocked(client, true);

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountExportPage />
    </MemoryRouter>,
  );

describe("AccountExportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastMocks.showToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requests an export and downloads when ready (polling)", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    mockedClient.get
      .mockResolvedValueOnce({ data: { status: "not_requested" } })
      .mockResolvedValueOnce({ data: { status: "pending" } })
      .mockResolvedValueOnce({
        data: {
          status: "ready",
          download_url: "https://example.com/data.json",
        },
      });
    mockedClient.post.mockResolvedValueOnce({ data: { status: "pending" } });

    renderPage();
    await screen.findByText(/current status/i);

    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /export data/i }));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockedClient.post).toHaveBeenCalledWith(
      "/api/v1/account/data/export",
      {},
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(document.getElementById("account-export-download")).toHaveAttribute(
      "href",
      "https://example.com/data.json",
    );

    clickSpy.mockRestore();
  });

  it("shows a download button when already ready", async () => {
    const user = userEvent.setup();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    mockedClient.get.mockResolvedValueOnce({
      data: { status: "ready", download_url: "https://example.com/data.json" },
    });

    renderPage();
    await screen.findByRole("button", { name: /download json/i });
    await user.click(screen.getByRole("button", { name: /download json/i }));

    expect(clickSpy).toHaveBeenCalled();
    expect(document.getElementById("account-export-download")).toHaveAttribute(
      "href",
      "https://example.com/data.json",
    );
    clickSpy.mockRestore();
  });
});
