import { describe, expect, it } from "vitest";
import { normalizeUploadError } from "./uploadErrors";

const makeAxiosError = ({
  status,
  data,
}: {
  status?: number;
  data?: unknown;
}) =>
  Object.assign(new Error("axios"), {
    isAxiosError: true,
    response: status ? { status, data } : undefined,
  });

describe("normalizeUploadError", () => {
  it("maps request_too_large responses to payload_too_large", () => {
    const normalized = normalizeUploadError(
      makeAxiosError({
        status: 413,
        data: {
          error: {
            code: "request_too_large",
            message: "Request entity too large",
          },
        },
      }),
    );

    expect(normalized).toMatchObject({
      code: "payload_too_large",
      message: "Upload is too large. Please choose a file under 1 MB.",
      retryable: false,
      status: 413,
    });
  });

  it("maps 401 responses to auth_required", () => {
    const normalized = normalizeUploadError(makeAxiosError({ status: 401 }));

    expect(normalized).toMatchObject({
      code: "auth_required",
      retryable: false,
      status: 401,
    });
  });
});
