import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider } from "../features/auth/providers/AuthProvider";
import { Layout } from "./Layout";
import { useStorefront } from "../storefront/useStorefront";
import { STOREFRONT_CONFIGS } from "../storefront/storefront";
import { ColorModeProvider } from "../theme/ColorModeProvider";

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));
vi.mock("../storefront/useStorefront");

const mockedUseStorefront = vi.mocked(useStorefront);

const renderWithContent = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ColorModeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<div>body content</div>} />
              <Route path="/account/verify-email" element={<div>VERIFY</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ColorModeProvider>
    </MemoryRouter>,
  );

describe("Layout", () => {
  beforeEach(() => {
    mockedUseStorefront.mockReturnValue({
      key: "main",
      config: STOREFRONT_CONFIGS.main,
    });
  });

  it("renders header, footer, and outlet content", () => {
    renderWithContent();
    expect(screen.getByText(/body content/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("redirects to verify-email when email is unverified", () => {
    renderWithContent();
    act(() => {
      window.dispatchEvent(
        new CustomEvent("app:email_unverified", { detail: { status: 403 } }),
      );
    });
    expect(screen.getByText("VERIFY")).toBeInTheDocument();
    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Verify your email to continue.",
      "error",
    );
  });

  it("applies storefront theme tokens as CSS vars", () => {
    mockedUseStorefront.mockReturnValue({
      key: "marketplace",
      config: STOREFRONT_CONFIGS.marketplace,
    });
    const { container } = renderWithContent();
    const root = container.firstElementChild as HTMLElement | null;
    if (!root) throw new Error("missing layout root");
    expect(root.style.getPropertyValue("--sf-primary")).toBe(
      STOREFRONT_CONFIGS.marketplace.themeTokensByMode.light.primary,
    );
    expect(root.style.getPropertyValue("--sf-background")).toBe(
      STOREFRONT_CONFIGS.marketplace.themeTokensByMode.light.background,
    );
  });
});
