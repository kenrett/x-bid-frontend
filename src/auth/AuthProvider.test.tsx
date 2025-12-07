import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import type { LoginPayload } from "@/types/auth";
import type { User } from "@/types/user";

const cableMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  create: vi.fn(() => mockSubscription),
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
vi.mock("@/services/cable", () => ({
  cable: {
    connect: cableMocks.connect,
    disconnect: cableMocks.disconnect,
    subscriptions: { create: cableMocks.create, remove: vi.fn() },
  },
}));

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@hooks/useAuth";
import client from "@api/client";

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
  it("logs in, persists tokens, and restores from localStorage", async () => {
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
    expect(localStorage.getItem("token")).toBe("jwt");
    expect(localStorage.getItem("refreshToken")).toBe("refresh");
    expect(localStorage.getItem("sessionTokenId")).toBe("sid");

    // Remount to ensure values restore from storage
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

  it("logs out and clears storage", async () => {
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
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  it("handles session remaining responses and invalidation", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: { remaining_seconds: 0 },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await act(async () => {
      await screen.getByText("login").click();
    });

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    warnSpy.mockRestore();
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
      expect(localStorage.getItem("token")).toBe("next-jwt");
      expect(localStorage.getItem("refreshToken")).toBe("next-refresh");
      expect(localStorage.getItem("sessionTokenId")).toBe("next-sid");
    });
  });
});
