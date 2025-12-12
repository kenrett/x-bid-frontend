import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { FlowbiteInitializer } from "./components/FlowbiteInitializer";
import { ToastContainer } from "./components/Toast/ToastContainer";
import "./sentryClient";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { logError } from "./services/logger";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

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
