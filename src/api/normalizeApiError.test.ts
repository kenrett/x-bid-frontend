import { describe, it, expect } from "vitest";
import { normalizeApiError } from "./normalizeApiError";

const makeAxiosError = ({
  status,
  data,
  headers,
}: {
  status?: number;
  data?: unknown;
  headers?: Record<string, unknown>;
}) =>
  Object.assign(new Error("axios"), {
    isAxiosError: true,
    response: status ? { status, data, headers } : undefined,
  });

describe("normalizeApiError", () => {
  it("normalizes legacy { error: string } shape", () => {
    expect(
      normalizeApiError(
        makeAxiosError({ status: 400, data: { error: "Bad" } }),
      ),
    ).toMatchObject({
      code: "http_400",
      message: "Bad",
      status: 400,
    });
  });

  it("normalizes envelope { error_code, message }", () => {
    expect(
      normalizeApiError(
        makeAxiosError({
          status: 401,
          data: { error_code: "invalid_credentials", message: "Nope" },
        }),
      ),
    ).toEqual({
      code: "invalid_credentials",
      message: "Nope",
      fieldErrors: undefined,
      status: 401,
    });
  });

  it("extracts nested error objects", () => {
    expect(
      normalizeApiError(
        makeAxiosError({
          status: 422,
          data: { error: { code: "throttled", message: "Slow down" } },
        }),
      ),
    ).toMatchObject({
      code: "throttled",
      message: "Slow down",
      status: 422,
    });
  });

  it("extracts field errors from { errors: { field: [...] } } and picks first message", () => {
    const normalized = normalizeApiError(
      makeAxiosError({
        status: 422,
        data: { errors: { email_address: ["is invalid"] } },
      }),
    );
    expect(normalized).toMatchObject({
      code: "http_422",
      message: "is invalid",
      status: 422,
      fieldErrors: { email_address: ["is invalid"] },
    });
  });

  it("appends support id for 5xx when available", () => {
    const normalized = normalizeApiError(
      makeAxiosError({
        status: 503,
        data: { error: "Down" },
        headers: { "x-request-id": "req_123" },
      }),
    );
    expect(normalized.message).toContain("Down");
    expect(normalized.message).toContain("support id: req_123");
  });

  it("falls back for non-Axios errors", () => {
    expect(normalizeApiError(new Error("oops"))).toEqual({
      code: "unknown_error",
      message: "oops",
    });
  });

  it("can suppress raw Error messages for non-Axios errors", () => {
    expect(
      normalizeApiError(new Error("boom"), {
        useRawErrorMessage: false,
        fallbackMessage: "An unexpected error occurred.",
      }),
    ).toEqual({
      code: "unknown_error",
      message: "An unexpected error occurred.",
    });
  });
});
