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
    localStorage.clear();
    socketCalls.length = 0;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates consumer without query auth and sets Authorization header on WebSocket", async () => {
    localStorage.setItem("token", "abc");
    const { resetCable } = await import("./cable");

    const firstCallUrl = createConsumerMock.mock.calls.at(0)?.[0];
    if (!firstCallUrl) throw new Error("createConsumer not called");
    const url = new URL(firstCallUrl as string);
    expect(url.searchParams.get("token")).toBeNull();
    expect(url.searchParams.get("session_token_id")).toBeNull();

    const AuthorizedWebSocket = (await import("@rails/actioncable")).adapters
      .WebSocket as typeof MockWebSocket;
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
    expect(nextUrl.searchParams.get("token")).toBeNull();
    expect(nextUrl.searchParams.get("session_token_id")).toBeNull();
  });
});
