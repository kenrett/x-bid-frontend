import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useAccountStatus } from "@features/account/hooks/useAccountStatus";
import { useStorefront } from "../../storefront/useStorefront";
import { STOREFRONT_CONFIGS } from "../../storefront/storefront";
import { ColorModeProvider } from "../../theme/ColorModeProvider";

vi.mock("../../features/auth/hooks/useAuth");
vi.mock("@features/account/hooks/useAccountStatus");
vi.mock("../../storefront/useStorefront");
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseAccountStatus = vi.mocked(useAccountStatus);
const mockedUseStorefront = vi.mocked(useStorefront);

const mockUser = { id: 1, email: "test@example.com", bidCredits: 100 };
const mockAdmin = { ...mockUser, is_admin: true };
const mockSuper = { ...mockUser, is_superuser: true };
const mockLogout = vi.fn();

const renderComponent = (initialPath = "/") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ColorModeProvider>
        <Header />
      </ColorModeProvider>
    </MemoryRouter>,
  );
};

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.removeItem("xbid-color-mode");
    document.documentElement.dataset.colorMode = "";
    document.documentElement.dataset.colorModePreference = "";
    mockedUseAccountStatus.mockReturnValue({
      isLoading: false,
      error: null,
      emailVerified: true,
      emailVerifiedAt: null,
      refresh: vi.fn(),
    });
    mockedUseStorefront.mockReturnValue({
      key: "main",
      config: STOREFRONT_CONFIGS.main,
    });
  });

  it("should render the logo and main navigation links", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      isReady: true,
    } as unknown as ReturnType<typeof useAuth>);
    renderComponent();

    const logoLink = screen.getByAltText("BidderSweet").closest("a");
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");

    expect(screen.getByRole("link", { name: /auctions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy bids/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /how it works/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  it("renders the correct logo per storefront", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      isReady: true,
    } as unknown as ReturnType<typeof useAuth>);

    const storefronts = [
      STOREFRONT_CONFIGS.main,
      STOREFRONT_CONFIGS.afterdark,
      STOREFRONT_CONFIGS.marketplace,
    ] as const;

    for (const config of storefronts) {
      mockedUseStorefront.mockReturnValue({ key: config.key, config });
      const { unmount } = renderComponent();
      expect(screen.getByAltText(config.shortName)).toBeInTheDocument();
      unmount();
    }
  });

  describe("when user is not logged in", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
    });

    it("should display a 'Sign In' link", () => {
      renderComponent();
      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
    });

    it("should not display the user's email or a 'Log Out' button", () => {
      renderComponent();
      expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /log out/i }),
      ).not.toBeInTheDocument();
    });

    it("should format the 'Sign In' link with a correct redirect path", () => {
      const currentPath = "/auctions/123";
      renderComponent(currentPath);
      const signInLink = screen.getByRole("link", { name: /sign in/i });
      const expectedHref = `/login?redirect=${encodeURIComponent(currentPath)}`;
      expect(signInLink).toHaveAttribute("href", expectedHref);
    });
  });

  describe("when user is logged in", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
    });

    it("should display the user's email and a 'Log Out' button", () => {
      renderComponent();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log out/i }),
      ).toBeInTheDocument();
    });

    it("should not display a 'Sign In' link", () => {
      renderComponent();
      expect(
        screen.queryByRole("link", { name: /sign in/i }),
      ).not.toBeInTheDocument();
    });

    it("should call the logout function when the 'Log Out' button is clicked", () => {
      renderComponent();
      const logoutButton = screen.getByRole("button", { name: /log out/i });
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("mobile menu accessibility state", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
    });

    it("renders menu button with correct aria controls", () => {
      renderComponent();
      const mobileMenuButton = screen.getByRole("button", {
        name: /open main menu/i,
      });

      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute(
        "aria-controls",
        "navbar-default",
      );
      expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles panel visibility and aria-expanded on click", async () => {
      const user = userEvent.setup();
      renderComponent();

      const mobileMenuButton = screen.getByRole("button", {
        name: /open main menu/i,
      });
      const mobileMenuPanel = document.getElementById("navbar-default");
      expect(mobileMenuPanel).toHaveClass("hidden");

      await user.click(mobileMenuButton);

      expect(mobileMenuButton).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("button", { name: /close main menu/i }),
      ).toBeInTheDocument();
      expect(mobileMenuPanel).toHaveClass("block");
      expect(screen.getByRole("link", { name: /auctions/i })).toHaveFocus();

      await user.click(
        screen.getByRole("button", { name: /close main menu/i }),
      );

      expect(
        screen.getByRole("button", { name: /open main menu/i }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(mobileMenuPanel).toHaveClass("hidden");
    });

    it("supports Enter and Space to toggle, and Escape to dismiss", async () => {
      const user = userEvent.setup();
      renderComponent();

      const menuButton = screen.getByRole("button", {
        name: /open main menu/i,
      });
      menuButton.focus();
      await user.keyboard("{Enter}");

      expect(
        screen.getByRole("button", { name: /close main menu/i }),
      ).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Escape}");

      const reopenedMenuButton = screen.getByRole("button", {
        name: /open main menu/i,
      });
      expect(reopenedMenuButton).toHaveAttribute("aria-expanded", "false");
      expect(reopenedMenuButton).toHaveFocus();

      reopenedMenuButton.focus();
      await user.keyboard(" ");

      expect(
        screen.getByRole("button", { name: /close main menu/i }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it("cycles global color mode and updates root attributes", async () => {
      const user = userEvent.setup();
      renderComponent();

      const modeButton = screen.getByRole("button", {
        name: /color mode system/i,
      });
      expect(document.documentElement.dataset.colorModePreference).toBe(
        "system",
      );
      expect(document.documentElement.dataset.colorMode).toBe("light");

      await user.click(modeButton);
      expect(document.documentElement.dataset.colorModePreference).toBe(
        "light",
      );
      expect(document.documentElement.dataset.colorMode).toBe("light");
      expect(window.localStorage.getItem("xbid-color-mode")).toBe("light");

      await user.click(modeButton);
      expect(document.documentElement.dataset.colorModePreference).toBe("dark");
      expect(document.documentElement.dataset.colorMode).toBe("dark");
      expect(window.localStorage.getItem("xbid-color-mode")).toBe("dark");
    });
  });

  describe("admin vs superadmin badges and banner", () => {
    it("shows admin banner and badge for admin", () => {
      mockedUseAuth.mockReturnValue({
        user: mockAdmin,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
      renderComponent();

      expect(screen.getByText(/admin mode active/i)).toBeInTheDocument();
      const adminBadges = screen.getAllByText("Admin");
      expect(adminBadges.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText("Superadmin")).not.toBeInTheDocument();
    });

    it("shows superadmin banner and badge for superuser", () => {
      mockedUseAuth.mockReturnValue({
        user: mockSuper,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
      renderComponent();

      expect(
        screen.getByText(/superadmin privileges active/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Superadmin")).toBeInTheDocument();
      expect(screen.queryAllByText("Admin").length).toBeGreaterThan(0);
    });

    it("shows no admin banner for regular user", () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser,
        logout: mockLogout,
        isReady: true,
      } as unknown as ReturnType<typeof useAuth>);
      renderComponent();

      expect(screen.queryByText(/admin mode active/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/superadmin privileges/i),
      ).not.toBeInTheDocument();
    });
  });
});
