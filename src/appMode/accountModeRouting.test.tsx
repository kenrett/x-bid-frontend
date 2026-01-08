import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@components/Layout";
import { AccountRoute } from "@features/account/components/AccountRoute";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useAccountStatus } from "@features/account/hooks/useAccountStatus";

vi.mock("@features/auth/hooks/useAuth");
vi.mock("@features/account/hooks/useAccountStatus");
vi.mock("@features/account/providers/AccountStatusProvider", () => ({
  AccountStatusProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
vi.mock("../components/AccountCompletionBanner", () => ({
  AccountCompletionBanner: () => null,
}));
vi.mock("../components/Header/Header", () => ({
  Header: () => <div>HEADER</div>,
}));
vi.mock("../components/Footer/Footer", () => ({
  Footer: () => <div>FOOTER</div>,
}));
vi.mock("@services/toast", () => ({
  showToast: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseAccountStatus = vi.mocked(useAccountStatus);

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

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/signup" element={<div>SIGNUP</div>} />
          <Route path="/auctions" element={<div>AUCTIONS</div>} />
          <Route path="/account" element={<AccountRoute />}>
            <Route path="wallet" element={<div>WALLET</div>} />
            <Route path="profile" element={<div>PROFILE</div>} />
            <Route path="purchases" element={<div>PURCHASES</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("account mode routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAccountStatus.mockReturnValue({
      isLoading: false,
      error: null,
      emailVerified: true,
      emailVerifiedAt: null,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    applyEnv({});
  });

  it("redirects disallowed routes to /login when logged out (account mode)", () => {
    applyEnv({ VITE_APP_MODE: "account" });
    mockedUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isReady: true,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    renderAt("/auctions");
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("redirects disallowed routes to /account/wallet when logged in (account mode)", () => {
    applyEnv({ VITE_APP_MODE: "account" });
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      accessToken: "token",
      isReady: true,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    renderAt("/auctions");
    expect(screen.getByText("WALLET")).toBeInTheDocument();
  });

  it("allows wallet and profile routes in account mode", () => {
    applyEnv({ VITE_APP_MODE: "account" });
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      accessToken: "token",
      isReady: true,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    renderAt("/account/profile");
    expect(screen.getByText("PROFILE")).toBeInTheDocument();
  });

  it("redirects other /account/* routes to wallet in account mode", () => {
    applyEnv({ VITE_APP_MODE: "account" });
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      accessToken: "token",
      isReady: true,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    renderAt("/account/purchases");
    expect(screen.getByText("WALLET")).toBeInTheDocument();
  });

  it("does not redirect in storefront mode", () => {
    applyEnv({ VITE_APP_MODE: "storefront" });
    mockedUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isReady: true,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    renderAt("/auctions");
    expect(screen.getByText("AUCTIONS")).toBeInTheDocument();
  });
});
