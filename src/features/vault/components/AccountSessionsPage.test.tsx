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
        data: {
          sessions: [
            {
              id: "current",
              device_label: "Current device",
              current_session: true,
            },
            {
              id: "other",
              device_label: "Other device",
              current_session: false,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          sessions: [
            {
              id: "current",
              device_label: "Current device",
              current_session: true,
            },
          ],
        },
      });
    mockedClient.delete.mockResolvedValue({});

    renderPage();

    expect(await screen.findByText(/^other device$/i)).toBeInTheDocument();
    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    await user.click(revokeButtons[revokeButtons.length - 1]!);

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith(
        "/api/v1/me/account/sessions/other",
      );
    });
  });
});
