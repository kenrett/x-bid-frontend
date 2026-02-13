import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountSessionsPage } from "./AccountSessionsPage";
import { useAuth } from "@features/auth/hooks/useAuth";

vi.mock("@api/client");
vi.mock("@features/auth/hooks/useAuth");

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));

const mockedClient = vi.mocked(client, true);
const mockedUseAuth = vi.mocked(useAuth);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/account/sessions"]}>
      <Routes>
        <Route path="/account/sessions" element={<AccountSessionsPage />} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("AccountSessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastMocks.showToast.mockReset();
    mockedUseAuth.mockReturnValue({
      logout: vi.fn(),
      user: null,
      sessionRemainingSeconds: null,
      reconnecting: false,
      login: vi.fn(),
      updateUser: vi.fn(),
      updateUserBalance: vi.fn(),
      isReady: true,
    });
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

  it("renders sessions and sign-out actions", async () => {
    mockedClient.get.mockResolvedValueOnce({
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

    renderPage();
    expect(
      (await screen.findAllByText(/current device/i)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /sign out of this device/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out of other devices/i }),
    ).toBeInTheDocument();
  });

  it("revokes a non-current session via confirm modal", async () => {
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

    await screen.findByText(/^other device$/i);
    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account/sessions");
    const otherCard = await screen.findByTestId("session-card-36");
    await user.click(
      within(otherCard).getByRole("button", { name: "Sign out" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Sign out",
      }),
    );

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith(
        "/api/v1/account/sessions/36",
      );
    });
  });

  it("revokes other sessions via confirm modal", async () => {
    const user = userEvent.setup();
    mockedClient.get.mockResolvedValueOnce({
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
    });
    mockedClient.post.mockResolvedValueOnce({ status: 200, data: {} });
    mockedClient.get.mockResolvedValueOnce({
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

    renderPage();
    await screen.findByTestId("session-card-36");
    await user.click(
      screen.getByRole("button", { name: /sign out of other devices/i }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Sign out",
      }),
    );

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith(
        "/api/v1/account/sessions/revoke_others",
        {},
      );
    });
  });

  it("revokes current session and forces logout", async () => {
    const user = userEvent.setup();
    const logoutSpy = vi.fn();
    mockedUseAuth.mockReturnValue({
      logout: logoutSpy,
      user: null,
      sessionRemainingSeconds: null,
      reconnecting: false,
      login: vi.fn(),
      updateUser: vi.fn(),
      updateUserBalance: vi.fn(),
      isReady: true,
    });

    mockedClient.get.mockResolvedValueOnce({
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
    mockedClient.delete.mockResolvedValueOnce({ status: 200, data: {} });

    renderPage();
    expect(
      (await screen.findAllByText(/current device/i)).length,
    ).toBeGreaterThan(0);
    await user.click(
      screen.getByRole("button", { name: /sign out of this device/i }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Sign out",
      }),
    );

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith(
        "/api/v1/account/sessions/35",
      );
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });
});
