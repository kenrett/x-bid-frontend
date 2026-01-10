import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useAccountStatus } from "../features/account/hooks/useAccountStatus";

vi.mock("../features/auth/hooks/useAuth");
vi.mock("../features/account/hooks/useAccountStatus");

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

describe("marketplace storefront smoke", () => {
  beforeEach(() => {
    mockedUseAccountStatus.mockReturnValue({
      isLoading: false,
      error: null,
      emailVerified: true,
      emailVerifiedAt: null,
      refresh: vi.fn(),
    });
    mockedUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
      accessToken: null,
      isReady: true,
    } as unknown as ReturnType<typeof useAuth>);

    applyEnv({
      VITE_STOREFRONT_KEY: "marketplace",
      VITE_APP_MODE: "storefront",
    });
  });

  afterEach(() => {
    applyEnv({});
    vi.clearAllMocks();
  });

  it("renders browsing nav and no UGC actions", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("BidderSweet Artisan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /auctions/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sell/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/create listing/i)).not.toBeInTheDocument();
  });
});
