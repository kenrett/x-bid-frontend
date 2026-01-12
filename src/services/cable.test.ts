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
    (import.meta as unknown as { env: Record<string, unknown> }).env = {};
    const { authSessionStore } = await import("@features/auth/tokenStore");
    authSessionStore.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates consumer without token query param", async () => {
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
    expect(firstCallUrl).toBe("/cable");

    resetCable();
    expect(disconnectMock).toHaveBeenCalled();
    const nextCallUrl = createConsumerMock.mock.calls.at(-1)?.[0];
    if (!nextCallUrl) throw new Error("reset call missing");
    expect(nextCallUrl).toBe("/cable");
  });

  it("passes through the base cable URL without appending tokens", async () => {
    const { buildCableUrl } = await import("./cable");
    const built = buildCableUrl("ws://example.com/cable?foo=bar");
    expect(built).toBe("ws://example.com/cable?foo=bar");
  });
});
