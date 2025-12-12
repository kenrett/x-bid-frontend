import { describe, it, expect, vi, beforeEach } from "vitest";
import { logError, __setSentryForTests } from "./logger";

let mockCaptureException: ReturnType<typeof vi.fn>;
let mockWithScope: ReturnType<typeof vi.fn>;

describe("logError", () => {
  const error = new Error("boom");
  const errorInfo = { componentStack: "Stack trace" } as const;

  beforeEach(async () => {
    mockCaptureException = vi.fn();
    mockWithScope = vi.fn(
      (cb: (scope: { setExtras: ReturnType<typeof vi.fn> }) => void) => {
        cb({ setExtras: vi.fn() });
      },
    );

    __setSentryForTests(
      {
        captureException: mockCaptureException,
        withScope: mockWithScope,
      } as unknown as typeof import("@sentryClient").Sentry,
      true,
    );

    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports to Sentry when enabled", () => {
    logError(error, errorInfo as unknown as React.ErrorInfo);

    expect(mockWithScope).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  it("does not throw if Sentry reporting fails", () => {
    mockWithScope.mockImplementationOnce(() => {
      throw new Error("sentry down");
    });

    expect(() =>
      logError(error, errorInfo as unknown as React.ErrorInfo),
    ).not.toThrow();
  });
});
