import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import client, { handleResponseError } from "./client";
import { authSessionStore } from "@features/auth/tokenStore";
import type { AxiosError } from "axios";

const makeAxiosError = ({
  status,
  code,
}: {
  status: number;
  code: string;
}): AxiosError =>
  ({
    isAxiosError: true,
    config: {},
    response: {
      status,
      data: { error_code: code },
      headers: {},
    },
  }) as unknown as AxiosError;

describe("handleResponseError", () => {
  beforeEach(() => {
    vi.spyOn(authSessionStore, "clear").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches app:forbidden and does not clear auth on a generic 403", async () => {
    const forbiddenSpy = vi.fn();
    window.addEventListener("app:forbidden", forbiddenSpy);

    const error = makeAxiosError({ status: 403, code: "forbidden" });

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(authSessionStore.clear).not.toHaveBeenCalled();
    expect(forbiddenSpy).toHaveBeenCalledTimes(1);
    const forbiddenEvent = forbiddenSpy.mock.calls[0]?.[0] as CustomEvent<{
      status: number;
      code: string;
    }>;
    expect(forbiddenEvent.detail).toEqual({
      status: 403,
      code: "forbidden",
    });

    window.removeEventListener("app:forbidden", forbiddenSpy);
  });

  it("clears auth and dispatches app:unauthorized for 403 invalid_session", async () => {
    const unauthorizedSpy = vi.fn();
    window.addEventListener("app:unauthorized", unauthorizedSpy);

    const error = makeAxiosError({ status: 403, code: "invalid_session" });

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(authSessionStore.clear).toHaveBeenCalled();
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
    const unauthorizedEvent = unauthorizedSpy.mock
      .calls[0]?.[0] as CustomEvent<{ status: number; code: string }>;
    expect(unauthorizedEvent.detail).toEqual({
      status: 403,
      code: "invalid_session",
    });

    window.removeEventListener("app:unauthorized", unauthorizedSpy);
  });
});

describe("api client defaults", () => {
  it("always includes credentials", () => {
    expect(client.defaults.withCredentials).toBe(true);
  });
});
