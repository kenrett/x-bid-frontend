import { describe, it, expect, vi, beforeEach } from "vitest";
const withScope = vi.hoisted(() =>
  vi.fn(
    (
      cb: (scope: {
        setTag: ReturnType<typeof vi.fn>;
        setExtra: ReturnType<typeof vi.fn>;
      }) => void,
    ) => {
      cb({
        setTag: vi.fn(),
        setExtra: vi.fn(),
      });
    },
  ),
);
const captureException = vi.hoisted(() => vi.fn());

vi.mock("@sentryClient", () => ({
  Sentry: {
    withScope,
    captureException,
  },
}));

const showToast = vi.hoisted(() => vi.fn());
vi.mock("./toast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

import {
  reportUnexpectedResponse,
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "./unexpectedResponse";

describe("reportUnexpectedResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an UnexpectedResponseError, reports to Sentry, and surfaces a toast", () => {
    const payload = { bad: "shape" };
    const error = reportUnexpectedResponse("auctions", payload);

    expect(error).toBeInstanceOf(UnexpectedResponseError);
    expect(error.message).toContain("Unexpected response shape for auctions");
    expect(withScope).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(showToast).toHaveBeenCalledWith(
      UNEXPECTED_RESPONSE_MESSAGE,
      "error",
    );
  });
});
