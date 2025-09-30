import { ErrorInfo } from "react";

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
export const logError = (error: Error, errorInfo: ErrorInfo): void => {
  // Example:
  // Sentry.withScope((scope) => {
  //   scope.setExtras(errorInfo);
  //   Sentry.captureException(error);
  // });
  //
  // Or a custom API call:
  // fetch('/api/log-error', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     error: {
  //       message: error.message,
  //       stack: error.stack,
  //     },
  //     errorInfo,
  //   }),
  // });

  console.error("ErrorBoundary caught an error", error, errorInfo);
};