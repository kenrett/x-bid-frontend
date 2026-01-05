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

const cableMocks = vi.hoisted(() => {
  const subscription = { unsubscribe: vi.fn() };
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscription,
    create: vi.fn((...args: unknown[]) => {
      void args;
      return subscription;
    }),
    reset: vi.fn(),
  };
});

vi.mock("@api/client", () => {
  const get = vi.fn();
  return {
    default: {
      get,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

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
import { authSessionStore } from "../tokenStore";

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
      <div data-testid="token">{auth.accessToken ?? "none"}</div>
      <div data-testid="remaining">
        {auth.sessionRemainingSeconds ?? "none"}
      </div>
      <button onClick={() => auth.logout()}>logout</button>
      <button
        onClick={() =>
          auth.login({
            accessToken: "jwt",
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
  authSessionStore.clear();
  toastMocks.showToast.mockReset();
  mockedClient.get.mockReset();
  mockedClient.get.mockResolvedValue({
    data: { remaining_seconds: 300 },
  });
  cableMocks.subscription.unsubscribe.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("persists a complete session and hydrates it on remount", async () => {
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
    expect(localStorage.getItem("token")).toBeNull(); // legacy key should not be used
    const persisted = localStorage.getItem("auth.session.v1");
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted as string)).toMatchObject({
      access_token: "jwt",
      refresh_token: "refresh",
      session_token_id: "sid",
      user: expect.any(Object),
    });
    expect(setItemSpy).toHaveBeenCalledWith(
      "auth.session.v1",
      expect.any(String),
    );
    expect(cableMocks.reset).toHaveBeenCalledTimes(1);
    expect(authSessionStore.getSnapshot().accessToken).toBe("jwt");

    // Remount to ensure values are restored from storage.
    view.unmount();
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user@example.com");
      expect(screen.getByTestId("token")).toHaveTextContent("jwt");
    });
  });

  it("clears invalid persisted auth and redirects to /login", async () => {
    localStorage.setItem(
      "auth.session.v1",
      JSON.stringify({
        access_token: "jwt",
        // refresh_token intentionally missing
        session_token_id: "sid",
        user: {
          id: 1,
          email: "user@example.com",
          name: "User",
          bidCredits: 0,
          is_admin: false,
          is_superuser: false,
        },
      }),
    );

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => {
      expect((window as { __lastRedirect?: string }).__lastRedirect).toMatch(
        /^\/login\?redirect=/,
      );
    });
    expect(localStorage.getItem("auth.session.v1")).toBeNull();
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
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
    expect(localStorage.getItem("auth.session.v1")).toBeNull();
    expect(authSessionStore.getSnapshot().accessToken).toBeNull();
    expect(cableMocks.reset).toHaveBeenCalled();
    expect(cableMocks.subscription.unsubscribe).toHaveBeenCalled();
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
    expect(localStorage.getItem("auth.session.v1")).toBeNull();
    expect(authSessionStore.getSnapshot().accessToken).toBeNull();
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
        access_token: "next-jwt",
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
      expect(authSessionStore.getSnapshot().accessToken).toBe("next-jwt");
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
