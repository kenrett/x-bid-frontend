import React, { Component, ErrorInfo, ReactNode } from "react";
import { logError } from "../services/logger";

interface Props {
  /** The content to render when there is no error. */
  children: ReactNode;
  /** An optional custom fallback component to render on error. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * A top-level error boundary to catch and handle rendering errors in its child component tree.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  /**
   * Updates state so the next render will show the fallback UI.
   * This is a static method that is called during the "render" phase, so side-effects are not permitted.
   * @param _ - The error that was thrown.
   * @returns An object to update the state.
   */
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  /**
   * This lifecycle method is called after an error has been thrown by a descendant component.
   * It receives the error that was thrown as a parameter and is a good place for side effects like logging.
   * @param error - The error that was thrown.
   * @param errorInfo - An object with a `componentStack` property.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo);
  }

  /**
   * Resets the error boundary state, attempting to re-render the children.
   */
  private handleReset = () => {
    this.setState({ hasError: false });
  };

  /**
   * Forces a full page reload.
   */
  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            fontFamily: "sans-serif",
            padding: "1rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", color: "#c0392b" }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#555", maxWidth: "600px" }}>
            We've been notified of the issue and are working to fix it. Please
            try again, or reload the page.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button onClick={this.handleReset}>Try Again</button>
            <button onClick={this.handleReload}>Reload Page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;