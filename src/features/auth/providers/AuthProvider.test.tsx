import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  const del = vi.fn();
  return {
    default: {
      get,
      delete: del,
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
    email_verified: true,
    email_verified_at: null,
  };
  return (
    <div>
      <div data-testid="user">{auth.user?.email ?? "none"}</div>
      <div data-testid="remaining">
        {auth.sessionRemainingSeconds ?? "none"}
      </div>
      <div data-testid="ready">{auth.isReady ? "ready" : "pending"}</div>
      <button onClick={() => auth.logout()}>logout</button>
      <button
        onClick={() =>
          auth.login({
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

const waitForReady = async () => {
  await waitFor(() =>
    expect(screen.getByTestId("ready")).toHaveTextContent("ready"),
  );
};

const mockedClient = vi.mocked(client, true);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authSessionStore.clear();
  delete (window as { __lastRedirect?: string }).__lastRedirect;
  toastMocks.showToast.mockReset();
  mockedClient.get.mockReset();
  mockedClient.delete.mockReset();
  mockedClient.get.mockImplementation((url?: string) => {
    if (typeof url === "string" && url.includes("/api/v1/logged_in")) {
      return Promise.resolve({ data: { logged_in: false } });
    }
    if (typeof url === "string" && url.includes("/api/v1/session/remaining")) {
      return Promise.resolve({ data: { remaining_seconds: 300 } });
    }
    return Promise.resolve({ data: {} });
  });
  cableMocks.subscription.unsubscribe.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("hydrates from /api/v1/logged_in when storage is empty", async () => {
    mockedClient.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          logged_in: true,
          user: {
            id: 1,
            email: "user@example.com",
            name: "User",
            bidCredits: 0,
            is_admin: false,
            email_verified: true,
            email_verified_at: null,
          },
        },
      }),
    );

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user@example.com");
    });
    expect(localStorage.getItem("auth.session.v1")).toBeNull();
  });

  it("shows logged-out state when /api/v1/logged_in returns logged_in false", async () => {
    mockedClient.get.mockImplementationOnce(() =>
      Promise.resolve({ data: { logged_in: false } }),
    );

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
    );
    expect(authSessionStore.getSnapshot().user).toBeNull();
  });

  it("logs out and clears in-memory auth state", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      screen.getByText("logout").click();
    });

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith("/api/v1/logout");
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
    expect(localStorage.getItem("auth.session.v1")).toBeNull();
    expect(authSessionStore.getSnapshot().user).toBeNull();
    expect(cableMocks.reset).toHaveBeenCalled();
    expect(cableMocks.subscription.unsubscribe).toHaveBeenCalled();
  });

  it("uses remaining_seconds to drive countdown state", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("remaining")).toHaveTextContent("300");
    });
  });

  it("logs out immediately when remaining_seconds is <= 0", async () => {
    mockedClient.get.mockImplementation((url?: string) => {
      if (typeof url === "string" && url.includes("/api/v1/logged_in")) {
        return Promise.resolve({ data: { logged_in: false } });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/v1/session/remaining")
      ) {
        return Promise.resolve({ data: { remaining_seconds: 0 } });
      }
      return Promise.resolve({ data: {} });
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

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
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
    expect(authSessionStore.getSnapshot().user).toBeNull();
    expect(cableMocks.reset).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("logs out when polling receives 401", async () => {
    mockedClient.get.mockImplementation((url?: string) => {
      if (typeof url === "string" && url.includes("/api/v1/logged_in")) {
        return Promise.resolve({ data: { logged_in: false } });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/v1/session/remaining")
      ) {
        return Promise.reject({
          isAxiosError: true,
          response: { status: 401 },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Your session expired, please log in again.",
      "error",
    );
  });

  it("merges refreshed user data when session remaining returns user updates", async () => {
    const baseResetCalls = cableMocks.reset.mock.calls.length;
    mockedClient.get.mockImplementation((url?: string) => {
      if (typeof url === "string" && url.includes("/api/v1/logged_in")) {
        return Promise.resolve({ data: { logged_in: false } });
      }
      if (
        typeof url === "string" &&
        url.includes("/api/v1/session/remaining")
      ) {
        return Promise.resolve({
          data: {
            remaining_seconds: 100,
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
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(authSessionStore.getSnapshot().user?.is_admin).toBe(true);
    });
    expect(cableMocks.reset.mock.calls.length).toBeGreaterThanOrEqual(
      baseResetCalls + 1,
    );
  });

  it("logs out on app:unauthorized when refresh is unavailable", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("user@example.com"),
    );

    await waitFor(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
    );
  });

  it("redirects to /login and shows session-expired toast on unauthorized", async () => {
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        pathname: "/auctions",
        search: "?from=test",
      },
      writable: true,
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
    );

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Your session expired, please log in again.",
      "error",
    );
    expect((window as { __lastRedirect?: string }).__lastRedirect).toBe(
      `/login?next=${encodeURIComponent("/auctions?from=test")}&redirect=${encodeURIComponent("/auctions?from=test")}&reason=session_expired`,
    );
  });

  it("does not redirect on missing-credential unauthorized probe events", async () => {
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        pathname: "/auctions",
        search: "?from=test",
      },
      writable: true,
    });

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", {
          detail: {
            status: 401,
            code: "invalid_token",
            reason: "missing_authorization_header",
            requestPath: "/api/v1/logged_in",
          },
        }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
    );
    expect(toastMocks.showToast).not.toHaveBeenCalled();
    expect(
      (window as { __lastRedirect?: string }).__lastRedirect,
    ).toBeUndefined();
  });

  it("handles repeated unauthorized events without looping or double-toasting", async () => {
    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("user@example.com"),
    );

    await waitFor(() => {
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
      window.dispatchEvent(
        new CustomEvent("app:unauthorized", { detail: { status: 401 } }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
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

    await waitForReady();
    await waitFor(() => {
      screen.getByText("login").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("user@example.com"),
    );

    const handler = cableMocks.create.mock.calls[0]?.[1] as
      | { received?: (payload: unknown) => void }
      | undefined;
    await waitFor(() => {
      handler?.received?.({ event: "session_invalidated" });
      handler?.received?.({ event: "session_invalidated" });
    });

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("none"),
    );
    expect(toastMocks.showToast).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
