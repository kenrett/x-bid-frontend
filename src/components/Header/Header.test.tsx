import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { useAuth } from "../../hooks/useAuth";

// --- Mocks ---
vi.mock("../../hooks/useAuth");
const mockedUseAuth = vi.mocked(useAuth);

// --- Test Data ---
const mockUser = { id: 1, email: "test@example.com" };
const mockLogout = vi.fn();

const renderComponent = (initialPath = "/") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Header />
    </MemoryRouter>
  );
};

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the logo and main navigation links", () => {
    mockedUseAuth.mockReturnValue({ user: null, logout: mockLogout } as any);
    renderComponent();

    // Check for logo linking to home
    const logoLink = screen.getByAltText("X-Bid Logo").closest("a");
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");

    // Check for main navigation items
    expect(screen.getByRole("link", { name: /auctions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy bids/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  describe("when user is not logged in", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ user: null, logout: mockLogout } as any);
    });

    it("should display a 'Sign In' link", () => {
      renderComponent();
      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
    });

    it("should not display the user's email or a 'Log Out' button", () => {
      renderComponent();
      expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
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
      mockedUseAuth.mockReturnValue({ user: mockUser, logout: mockLogout } as any);
    });

    it("should display the user's email and a 'Log Out' button", () => {
      renderComponent();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });

    it("should not display a 'Sign In' link", () => {
      renderComponent();
      expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    });

    it("should call the logout function when the 'Log Out' button is clicked", () => {
      renderComponent();
      const logoutButton = screen.getByRole("button", { name: /log out/i });
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it("should render the mobile menu button", () => {
    mockedUseAuth.mockReturnValue({ user: null, logout: mockLogout } as any);
    renderComponent();
    const mobileMenuButton = screen.getByRole("button", { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });
});