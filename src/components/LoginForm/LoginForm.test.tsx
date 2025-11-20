import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { useAuth } from "../../hooks/useAuth";
import client from "../../api/client";
import userEvent from "@testing-library/user-event";

// --- Mocks ---
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

vi.mock("../../hooks/useAuth");
vi.mock("../../api/client");

// --- Helpers to get typed mocked functions ---
const mockedUseAuth = vi.mocked(useAuth);
const mockedClient = vi.mocked(client, true);
const mockedNavigate = vi.mocked(useNavigate);
const mockedUseSearchParams = vi.mocked(useSearchParams);

// --- Test Data ---
const mockUser = { id: 1, name: "Test User" };
const mockToken = "fake-jwt-token";
const mockRefreshToken = "fake-refresh-token";
const mockSessionTokenId = "session-token-id";
const mockLogin = vi.fn();


const renderComponent = (searchParams = "") => {
  const route = searchParams ? `/login?${searchParams}` : "/login";
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginForm />
    </MemoryRouter>
  );
};

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ login: mockLogin } as any);
    // Suppress console.error for tests that intentionally cause errors
    vi.spyOn(console, "error").mockImplementation(() => {});
    // useSearchParams returns a tuple [params, setParams], so we mock both.
    const setSearchParams = vi.fn();
    mockedUseSearchParams.mockReturnValue([new URLSearchParams(), setSearchParams]);
    mockedNavigate.mockReturnValue(vi.fn()); // mock the returned navigate function
  });

  it("should render the form fields and submit button", () => {
    renderComponent();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("should allow user to type into email and password fields", async () => {
    renderComponent();
    const emailInput = screen.getByLabelText(/your email/i);
    const passwordInput = screen.getByLabelText(/your password/i);
    const user = userEvent.setup();


    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");


    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  describe("on successful login", () => {
    beforeEach(() => {
      mockedClient.post.mockResolvedValue({
        data: {
          token: mockToken,
          refresh_token: mockRefreshToken,
          session_token_id: mockSessionTokenId,
          user: mockUser,
        },
     });
    });

    it("should call login handler and navigate to /auctions by default", async () => {
      const navigateFn = vi.fn();
      mockedNavigate.mockReturnValue(navigateFn);
      const user = userEvent.setup();

      renderComponent();

      const emailInput = screen.getByLabelText(/your email/i);
      const passwordInput = screen.getByLabelText(/your password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockedClient.post).toHaveBeenCalledWith("/login", {
          email_address: "test@example.com",
          password: "password123",
        });
        expect(mockLogin).toHaveBeenCalledWith({
          token: mockToken,
          refreshToken: mockRefreshToken,
          sessionTokenId: mockSessionTokenId,
          user: mockUser,
        });
        expect(navigateFn).toHaveBeenCalledWith("/auctions");
      });
    });

    it("should navigate to the specified redirect URL if present", async () => {
      const user = userEvent.setup();
      const navigateFn = vi.fn();
      mockedNavigate.mockReturnValue(navigateFn);
      mockedUseSearchParams.mockReturnValue([
        new URLSearchParams("redirect=/my-special-page"),
        vi.fn(),
      ]);



      renderComponent();

      const email = screen.getByLabelText(/your email/i);
      await user.type(email, "test@example.com");
      const pw = screen.getByLabelText(/your password/i);
      await user.type(pw, "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(navigateFn).toHaveBeenCalledWith("/my-special-page");
      });
    });
  });

  describe("on failed login", () => {
    it("should display an error message and not call login or navigate", async () => {
      const testError = new Error("Invalid credentials");
      // Mock the implementation to return a rejected promise.
      // This is often more stable than `mockRejectedValue`.
      mockedClient.post.mockRejectedValue(testError);
      const navigateFn = vi.fn();
      mockedNavigate.mockReturnValue(navigateFn);
      const user = userEvent.setup();

      renderComponent();

      await user.type(screen.getByLabelText(/your email/i), "test@example.com");
      await user.type(
        screen.getByLabelText(/your password/i),
        "wrong-password"
      );
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      const errorMessage = await screen.findByText(
        "Invalid email or password. Please try again."
      );
      expect(errorMessage).toBeInTheDocument();

      expect(console.error).toHaveBeenCalledWith(testError);
      expect(mockLogin).not.toHaveBeenCalled();
      expect(navigateFn).not.toHaveBeenCalled();
    });
  });

  it("should show a loading state on the button while submitting", async () => {
    mockedClient.post.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByLabelText(/your email/i), "test@example.com");
    await user.type(screen.getByLabelText(/your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const submitButton = await screen.findByRole("button", {
      name: /signing in.../i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
