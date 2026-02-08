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
import { ColorModeProvider } from "./theme/ColorModeProvider";
import {
  applyColorModeToDocument,
  readColorModePreference,
} from "./theme/colorMode";

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
applyColorModeToDocument(readColorModePreference());

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary onError={logError}>
      <ColorModeProvider>
        <AuthProvider>
          <FlowbiteInitializer />
          <App />
          <ToastContainer />
        </AuthProvider>
      </ColorModeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
