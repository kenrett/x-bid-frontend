import { ErrorInfo } from "react";
import { Sentry, SENTRY_ENABLED } from "@sentryClient";

/**
 * A stub for a remote error logging service.
 *
 * In a real-world application, this function would send the error and component
 * stack information to a service like Sentry, Datadog, or a custom API endpoint.
 *
 * @param error - The error that was thrown.
 * @param errorInfo - An object with a `componentStack` property containing
 *   information about which component threw the error.
 */
let sentryClient = Sentry;
let sentryEnabled = SENTRY_ENABLED;

export const __setSentryForTests = (
  client: typeof Sentry,
  enabled: boolean,
) => {
  sentryClient = client;
  sentryEnabled = enabled;
};

export const logError = (error: Error, errorInfo: ErrorInfo): void => {
  console.error("ErrorBoundary caught an error", error, errorInfo);

  if (sentryEnabled) {
    try {
      sentryClient.withScope((scope) => {
        scope.setExtras({ componentStack: errorInfo.componentStack });
        sentryClient.captureException(error);
      });
    } catch (loggingError) {
      // Guard: Ensure logging failures don't crash the app
      console.error("Failed to report error to Sentry:", loggingError);
    }
  }
};
