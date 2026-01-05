import { Sentry } from "@sentryClient";
import { showToast } from "./toast";

export const UNEXPECTED_RESPONSE_MESSAGE = "Something's off on our end.";

type SentryScope = {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
};

export class UnexpectedResponseError extends Error {
  constructor(context: string) {
    super(`Unexpected response shape for ${context}`);
    this.name = "UnexpectedResponseError";
  }
}

export const reportUnexpectedResponse = (
  context: string,
  payload: unknown,
): UnexpectedResponseError => {
  const error = new UnexpectedResponseError(context);

  try {
    if (typeof Sentry.withScope === "function") {
      Sentry.withScope((scope) => {
        const typedScope = scope as SentryScope;
        typedScope.setTag("response_context", context);
        try {
          typedScope.setExtra("payload", payload);
        } catch {
          typedScope.setExtra("payload", "[unserializable]");
        }
        Sentry.captureException(error);
      });
    }
  } catch (captureError) {
    console.error("Failed to report unexpected response", captureError);
  }

  showToast(UNEXPECTED_RESPONSE_MESSAGE, "error");
  return error;
};
