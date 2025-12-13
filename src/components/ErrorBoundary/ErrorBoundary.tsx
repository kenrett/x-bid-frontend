import type { ErrorInfo, ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { logError } from "../../services/logger";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

const DefaultFallback = ({ onReset }: { onReset: () => void }) => {
  const handleReload = () => window.location.reload();

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
        We've been notified of the issue and are working to fix it. Please try
        again, or reload the page.
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={onReset}>Try Again</button>
        <button onClick={handleReload}>Reload Page</button>
      </div>
    </div>
  );
};

const ErrorBoundary = ({ children, fallback, onError }: Props) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={({ resetErrorBoundary }) =>
        fallback ? (
          <>{fallback}</>
        ) : (
          <DefaultFallback onReset={resetErrorBoundary} />
        )
      }
      onError={(error, info) => {
        const handler = onError ?? logError;
        handler(error, info as ErrorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
