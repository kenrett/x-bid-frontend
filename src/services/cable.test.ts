import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { User } from "@features/auth/types/user";

const disconnectMock = vi.fn();
const createConsumerMock = vi.fn((url?: string) => ({
  disconnect: disconnectMock,
  url,
}));

vi.mock("@rails/actioncable", () => ({
  createConsumer: (url?: string) => createConsumerMock(url),
}));

describe("cable service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (import.meta as unknown as { env: Record<string, unknown> }).env = {
      VITE_API_URL: "http://localhost:3000",
      VITE_STOREFRONT_KEY: "main",
    };
    const { authSessionStore } = await import("@features/auth/tokenStore");
    authSessionStore.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates consumer with storefront query params", async () => {
    const { authSessionStore } = await import("@features/auth/tokenStore");
    const user: User = {
      id: 1,
      email: "user@example.com",
      name: "User",
      bidCredits: 0,
      is_admin: false,
      email_verified: true,
      email_verified_at: null,
    };
    authSessionStore.setUser(user);
    const { resetCable } = await import("./cable");

    resetCable();
    const firstCallUrl = createConsumerMock.mock.calls.at(0)?.[0];
    if (!firstCallUrl) throw new Error("createConsumer not called");
    expect(firstCallUrl).toBe("ws://localhost:3000/cable?storefront=main");

    resetCable();
    expect(disconnectMock).toHaveBeenCalled();
    const nextCallUrl = createConsumerMock.mock.calls.at(-1)?.[0];
    if (!nextCallUrl) throw new Error("reset call missing");
    expect(nextCallUrl).toBe("ws://localhost:3000/cable?storefront=main");
  });

  it("connects to the API host cable endpoint with storefront param", async () => {
    const { resetCable } = await import("./cable");
    resetCable();
    const firstCallUrl = createConsumerMock.mock.calls.at(0)?.[0];
    if (!firstCallUrl) throw new Error("createConsumer not called");
    expect(firstCallUrl).toBe("ws://localhost:3000/cable?storefront=main");
  });
});
