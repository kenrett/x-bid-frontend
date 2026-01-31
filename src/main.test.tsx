import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

const renderMock = vi.fn();

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({ render: renderMock })),
}));

vi.mock("./App", () => ({
  default: () => null,
}));

vi.mock("./features/auth/providers/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("./components/FlowbiteInitializer", () => ({
  FlowbiteInitializer: () => null,
}));

vi.mock("./components/Toast/ToastContainer", () => ({
  ToastContainer: () => null,
}));

vi.mock("./components/ErrorBoundary/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./services/logger", () => ({
  logError: vi.fn(),
}));

const originalEnv = { ...import.meta.env };

const applyEnv = (overrides: Record<string, unknown>) => {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(originalEnv),
    ...Object.keys(overrides),
  ]);
  for (const key of keys) {
    env[key] =
      key in overrides
        ? overrides[key]
        : (originalEnv as Record<string, unknown>)[key];
  }
};

const setHostname = (hostname: string) => {
  Object.defineProperty(window, "location", {
    value: { ...window.location, hostname },
    writable: true,
  });
};

describe("main bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    document.documentElement.dataset.storefront = "";
    renderMock.mockClear();
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("afterdark.biddersweet.app");
  });

  afterEach(() => {
    applyEnv({});
  });

  it("sets data-storefront on the html element", async () => {
    vi.resetModules();
    await import("./main");
    expect(document.documentElement.dataset.storefront).toBe("afterdark");
  });
});
