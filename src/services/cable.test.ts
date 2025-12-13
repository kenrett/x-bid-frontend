import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const disconnectMock = vi.fn();
const createConsumerMock = vi.fn(() => ({ disconnect: disconnectMock }));

vi.mock("@rails/actioncable", () => ({
  createConsumer: (...args: unknown[]) => createConsumerMock(...args),
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

    const url = new URL(createConsumerMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("token")).toBe("abc");
    expect(url.searchParams.get("session_token_id")).toBe("xyz");

    resetCable();
    expect(disconnectMock).toHaveBeenCalled();
    const nextUrl = new URL(
      createConsumerMock.mock.calls[
        createConsumerMock.mock.calls.length - 1
      ][0] as string,
    );
    expect(nextUrl.searchParams.get("token")).toBe("abc");
    expect(nextUrl.searchParams.get("session_token_id")).toBe("xyz");
  });
});
