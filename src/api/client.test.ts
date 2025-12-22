import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AxiosError } from "axios";

const showToast = vi.fn();
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

// Import after mocks so interceptors use the mocked toast
import client from "./client";

const getRejectedInterceptor = () => {
  const handlers = (
    client.interceptors.response as unknown as {
      handlers: Array<{ rejected?: (error: unknown) => unknown }>;
    }
  ).handlers;
  const handler = handlers.find((h) => typeof h.rejected === "function");
  if (!handler?.rejected) {
    throw new Error("Response interceptor not registered");
  }
  return handler.rejected;
};

const setPath = (pathname: string) => {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      assign: vi.fn(),
    },
    writable: true,
  });
};

describe("api client response interceptor", () => {
  const rejected = getRejectedInterceptor();

  beforeEach(() => {
    localStorage.clear();
    showToast.mockClear();
    vi.restoreAllMocks();
  });

  it("handles 401/403 by dispatching unauthorized and toasting", async () => {
    localStorage.setItem("user", "user");
    localStorage.setItem("token", "token");
    localStorage.setItem("refreshToken", "refresh");
    localStorage.setItem("sessionTokenId", "session");
    setPath("/auctions");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const error = { response: { status: 401 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "app:unauthorized" }),
    );
    expect(localStorage.getItem("user")).toBe("user");
    expect(localStorage.getItem("token")).toBe("token");
    expect(showToast).toHaveBeenCalledWith(
      "Your session expired; please sign in again.",
      "error",
    );
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("keeps maintenance redirect behavior for 503", async () => {
    setPath("/auctions");
    const error = { response: { status: 503 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(window.location.assign).toHaveBeenCalledWith("/maintenance");
  });
});
