import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const disconnectMock = vi.fn();
const socketCalls: Array<{
  url?: string;
  protocols?: string | string[];
  options?: unknown;
}> = [];

class MockWebSocket {
  static calls = socketCalls;
  constructor(
    public url?: string,
    public protocols?: string | string[],
    public options?: unknown,
  ) {
    socketCalls.push({ url, protocols, options });
  }
}

const createConsumerMock = vi.fn((url?: string) => ({
  disconnect: disconnectMock,
  url,
}));

vi.mock("@rails/actioncable", () => ({
  adapters: {
    WebSocket: MockWebSocket,
  },
  createConsumer: (url?: string) => createConsumerMock(url),
}));

describe("cable service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketCalls.length = 0;
    (import.meta as unknown as { env: Record<string, unknown> }).env = {};
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates consumer with token query param and sets Authorization header on WebSocket", async () => {
    const { authTokenStore } = await import("@features/auth/tokenStore");
    authTokenStore.setToken("abc");
    const { resetCable } = await import("./cable");

    const firstCallUrl = createConsumerMock.mock.calls.at(0)?.[0];
    if (!firstCallUrl) throw new Error("createConsumer not called");
    const url = new URL(firstCallUrl as string);
    expect(url.searchParams.get("token")).toBe("abc");
    expect(url.searchParams.get("session_token_id")).toBeNull();

    const module = await import("@rails/actioncable");
    const AuthorizedWebSocket = (
      module as unknown as { adapters: { WebSocket: typeof MockWebSocket } }
    ).adapters.WebSocket;
    expect(AuthorizedWebSocket).not.toBe(MockWebSocket);

    new AuthorizedWebSocket("ws://example.com/cable", ["actioncable-v1-json"]);
    const wsCall = MockWebSocket.calls.at(-1);
    expect(wsCall?.options).toMatchObject({
      headers: { Authorization: "Bearer abc" },
    });

    resetCable();
    expect(disconnectMock).toHaveBeenCalled();
    const nextCallUrl = createConsumerMock.mock.calls.at(-1)?.[0];
    if (!nextCallUrl) throw new Error("reset call missing");
    const nextUrl = new URL(nextCallUrl as string);
    expect(nextUrl.searchParams.get("token")).toBe("abc");
    expect(nextUrl.searchParams.get("session_token_id")).toBeNull();
  });

  it("appends token without clobbering existing query params and encodes token", async () => {
    const { authTokenStore } = await import("@features/auth/tokenStore");
    authTokenStore.setToken("a b");
    const { buildCableUrl } = await import("./cable");
    const built = buildCableUrl(undefined, "ws://example.com/cable?foo=bar");
    const url = new URL(built);

    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.searchParams.get("token")).toBe("a b");
    expect(built).toBe("ws://example.com/cable?foo=bar&token=a+b");
  });
});
