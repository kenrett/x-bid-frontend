import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const disconnectMock = vi.fn();
const createConsumerMock = vi.fn((url?: string) => ({
  disconnect: disconnectMock,
  url,
}));

vi.mock("@rails/actioncable", () => ({
  createConsumer: (url?: string) => createConsumerMock(url),
}));

describe("cable service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates consumer with tokens in URL", async () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("sessionTokenId", "xyz");
    const { resetCable } = await import("./cable");

    const firstCallUrl = createConsumerMock.mock.calls.at(0)?.[0];
    if (!firstCallUrl) throw new Error("createConsumer not called");
    const url = new URL(firstCallUrl as string);
    expect(url.searchParams.get("token")).toBe("abc");
    expect(url.searchParams.get("session_token_id")).toBe("xyz");

    resetCable();
    expect(disconnectMock).toHaveBeenCalled();
    const nextCallUrl = createConsumerMock.mock.calls.at(-1)?.[0];
    if (!nextCallUrl) throw new Error("reset call missing");
    const nextUrl = new URL(nextCallUrl as string);
    expect(nextUrl.searchParams.get("token")).toBe("abc");
    expect(nextUrl.searchParams.get("session_token_id")).toBe("xyz");
  });
});
