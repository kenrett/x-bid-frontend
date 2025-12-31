import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountNotificationsPage } from "./AccountNotificationsPage";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountNotificationsPage />
    </MemoryRouter>,
  );

describe("AccountNotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading state", () => {
    mockedClient.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading notifications/i)).toBeInTheDocument();
  });

  it("renders server error if preferences fetch fails", async () => {
    mockedClient.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "boom" } },
    });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("saves updated preferences", async () => {
    const user = userEvent.setup();
    mockedClient.get.mockResolvedValue({
      data: {
        marketing_emails: false,
        product_updates: false,
        bidding_alerts: true,
        outbid_alerts: true,
        watched_auction_ending: true,
        receipts: true,
      },
    });
    mockedClient.put.mockResolvedValue({
      data: {
        marketing_emails: true,
        product_updates: false,
        bidding_alerts: true,
        outbid_alerts: true,
        watched_auction_ending: true,
        receipts: true,
      },
    });

    renderPage();

    await user.click(await screen.findByLabelText(/marketing emails/i));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockedClient.put).toHaveBeenCalledWith(
        "/api/v1/account/notifications",
        expect.objectContaining({
          account: expect.objectContaining({
            notification_preferences: expect.objectContaining({
              marketing_emails: true,
            }),
          }),
        }),
      );
      expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
    });
  });
});
