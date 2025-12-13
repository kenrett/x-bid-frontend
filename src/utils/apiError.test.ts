import { describe, it, expect } from "vitest";
import { parseApiError } from "./apiError";

const makeAxiosError = (status?: number, message?: string) =>
  Object.assign(new Error("axios"), {
    isAxiosError: true,
    response: status
      ? { status, data: message ? { error: message } : {} }
      : undefined,
  });

describe("parseApiError", () => {
  it("categorizes axios errors by status", () => {
    expect(parseApiError(makeAxiosError(401, "unauth"))).toEqual({
      type: "unauthorized",
      message: "unauth",
      code: 401,
    });
    expect(parseApiError(makeAxiosError(403))).toMatchObject({
      type: "forbidden",
      code: 403,
    });
    expect(parseApiError(makeAxiosError(404))).toMatchObject({
      type: "not_found",
      code: 404,
    });
    expect(parseApiError(makeAxiosError(422, "invalid"))).toEqual({
      type: "validation",
      message: "invalid",
      code: 422,
    });
    expect(parseApiError(makeAxiosError(503))).toMatchObject({
      type: "server",
      code: 503,
    });
  });

  it("falls back to network when no status is present", () => {
    const err = Object.assign(new Error("network-ish"), {
      isAxiosError: true,
    });
    expect(parseApiError(err).type).toBe("network");
  });

  it("handles generic Error and unknown objects", () => {
    expect(parseApiError(new Error("oops"))).toEqual({
      type: "unknown",
      message: "oops",
    });
    expect(parseApiError("something else")).toEqual({
      type: "unknown",
      message: "Something went wrong. Please try again.",
    });
  });
});
