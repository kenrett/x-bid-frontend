import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountSessionsPage } from "./AccountSessionsPage";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountSessionsPage />
    </MemoryRouter>,
  );

describe("AccountSessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders a loading state", () => {
    mockedClient.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
  });

  it("renders server error if list fails", async () => {
    mockedClient.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "boom" } },
    });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("revokes a non-current session", async () => {
    const user = userEvent.setup();
    mockedClient.get
      .mockResolvedValueOnce({
        status: 200,
        headers: { "content-type": "application/json" },
        data: {
          sessions: [
            {
              id: 35,
              created_at: "2025-01-01T00:00:00Z",
              last_seen_at: null,
              user_agent: "Current device",
              ip_address: "127.0.0.1",
              current: true,
            },
            {
              id: 36,
              created_at: "2025-01-01T00:00:00Z",
              last_seen_at: null,
              user_agent: "Other device",
              ip_address: "127.0.0.2",
              current: false,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: { "content-type": "application/json" },
        data: {
          sessions: [
            {
              id: 35,
              created_at: "2025-01-01T00:00:00Z",
              last_seen_at: null,
              user_agent: "Current device",
              ip_address: "127.0.0.1",
              current: true,
            },
          ],
        },
      });
    mockedClient.delete.mockResolvedValue({});

    renderPage();

    expect(await screen.findByText(/^other device$/i)).toBeInTheDocument();
    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account/sessions");
    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    await user.click(revokeButtons[revokeButtons.length - 1]!);

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith(
        "/api/v1/account/sessions/36",
      );
    });
  });
});
