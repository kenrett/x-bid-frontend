import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./features/auth/providers/AuthProvider";
import { FlowbiteInitializer } from "./components/FlowbiteInitializer";
import { ToastContainer } from "./components/Toast/ToastContainer";
import { initSentry, SENTRY_ENABLED } from "./sentryClient";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { logError } from "./services/logger";
import { getStorefrontKey } from "./storefront/getStorefrontKey";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

if (SENTRY_ENABLED) {
  const schedule =
    "requestIdleCallback" in window
      ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 5000 })
      : (cb: () => void) => window.setTimeout(cb, 2000);
  schedule(() => {
    void initSentry();
  });
}

document.documentElement.dataset.storefront = getStorefrontKey();

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary onError={logError}>
      <AuthProvider>
        <FlowbiteInitializer />
        <App />
        <ToastContainer />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
