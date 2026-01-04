import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import type { LoginPayload } from "@features/auth/types/auth";
import type { User } from "@features/auth/types/user";

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]): void => {
    toastMocks.showToast(...args);
  },
}));

const cableMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  create: vi.fn(() => mockSubscription),
  reset: vi.fn(),
}));

vi.mock("@api/client", () => {
  const get = vi.fn();
  return {
    default: {
      get,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

const mockSubscription = { unsubscribe: vi.fn() };
vi.mock("@services/cable", () => ({
  cable: {
    connect: cableMocks.connect,
    disconnect: cableMocks.disconnect,
    subscriptions: { create: cableMocks.create, remove: vi.fn() },
  },
  resetCable: cableMocks.reset,
}));

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import client from "@api/client";
import { authTokenStore } from "../tokenStore";

// Minimal consumer to read context values
const TestConsumer = () => {
  const auth = useAuth();
  const mockUser: User = {
    id: 1,
    email: "user@example.com",
    name: "User",
    bidCredits: 0,
    is_admin: false,
  };
  return (
    <div>
      <div data-testid="user">{auth.user?.email ?? "none"}</div>
      <div data-testid="token">{auth.token ?? "none"}</div>
      <div data-testid="remaining">
        {auth.sessionRemainingSeconds ?? "none"}
      </div>
      <button onClick={() => auth.logout()}>logout</button>
      <button
        onClick={() =>
          auth.login({
            token: "jwt",
            refreshToken: "refresh",
            sessionTokenId: "sid",
            user: mockUser,
          } satisfies LoginPayload)
        }
      >
        login
      </button>
    </div>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const mockedClient = vi.mocked(client, true);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authTokenStore.clear();
  toastMocks.showToast.mockReset();
  mockedClient.get.mockReset();
  mockedClient.get.mockResolvedValue({
    data: { remaining_seconds: 300 },
  });
  mockSubscription.unsubscribe.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("logs in without persisting tokens to localStorage", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const view = render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    expect(screen.getByTestId("user")).toHaveTextContent("none");

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("user")[0]).toHaveTextContent(
        "user@example.com",
      );
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("sessionTokenId")).toBeNull();
    expect(setItemSpy).not.toHaveBeenCalledWith("token", expect.anything());
    expect(setItemSpy).not.toHaveBeenCalledWith(
      "refreshToken",
      expect.anything(),
    );
    expect(setItemSpy).not.toHaveBeenCalledWith(
      "sessionTokenId",
      expect.anything(),
    );
    expect(cableMocks.reset).toHaveBeenCalledTimes(1);
    expect(authTokenStore.getSnapshot().token).toBe("jwt");

    // Remount to ensure values are not restored from storage.
    view.unmount();
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
      expect(screen.getByTestId("token")).toHaveTextContent("none");
    });
  });

  it("logs out and clears in-memory auth state", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await act(async () => {
      await screen.getByText("logout").click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("sessionTokenId")).toBeNull();
    expect(authTokenStore.getSnapshot().token).toBeNull();
    expect(cableMocks.reset).toHaveBeenCalled();
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  it("uses remaining_seconds to drive countdown state", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("remaining")).toHaveTextContent("300");
    });
  });

  it("logs out immediately when remaining_seconds is <= 0", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: { remaining_seconds: 0 },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Legacy artifacts should be cleared on logout (defense-in-depth).
    localStorage.setItem("token", "legacy");
    localStorage.setItem("refreshToken", "legacy");
    localStorage.setItem("sessionTokenId", "legacy");
    localStorage.setItem("user", '{"id":1}');

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("none");
    });

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Your session expired, please log in again.",
      "error",
    );
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("sessionTokenId")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(authTokenStore.getSnapshot().token).toBeNull();
    expect(cableMocks.reset).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("logs out when polling receives 401", async () => {
    mockedClient.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("none");
    });

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Your session expired, please log in again.",
      "error",
    );
  });

  it("refreshes tokens when session remaining returns new token values", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: {
        remaining_seconds: 100,
        token: "next-jwt",
        refresh_token: "next-refresh",
        session_token_id: "next-sid",
        user: {
          id: 1,
          email: "user@example.com",
          name: "User",
          bidCredits: 0,
          is_admin: true,
        },
        is_admin: true,
        is_superuser: false,
      },
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("next-jwt");
      expect(authTokenStore.getSnapshot().token).toBe("next-jwt");
    });
    expect(cableMocks.reset).toHaveBeenCalledTimes(2);
  });

  it("logs out on app:unauthorized when refresh is unavailable", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("jwt"),
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );
  });

  it("handles repeated unauthorized events without looping or double-toasting", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("jwt"),
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );

    expect(toastMocks.showToast).toHaveBeenCalledTimes(1);
  });

  it("logs out on session_invalidated broadcast (once)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("jwt"),
    );

    const handler = cableMocks.create.mock.calls[0]?.[1] as
      | { received?: (payload: unknown) => void }
      | undefined;
    act(() => {
      handler?.received?.({ event: "session_invalidated" });
      handler?.received?.({ event: "session_invalidated" });
    });

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );
    expect(toastMocks.showToast).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
