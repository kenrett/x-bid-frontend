import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import client from "@api/client";
import { LoginForm } from "./LoginForm";
import { AuthProvider } from "@features/auth/providers/AuthProvider";

vi.mock("@api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock("@services/cable", () => ({
  cable: { subscriptions: { create: vi.fn(() => ({ unsubscribe: vi.fn() })) } },
  resetCable: vi.fn(),
}));

vi.mock("@sentryClient", () => ({ setSentryUser: vi.fn() }));
vi.mock("@services/toast", () => ({ showToast: vi.fn() }));

const mockedClient = vi.mocked(client, true);

const renderLogin = (initialEntry = "/login") =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auctions" element={<div>AUCTIONS</div>} />
          <Route path="/my-special-page" element={<div>SPECIAL</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockedClient.get.mockResolvedValue({ data: { remaining_seconds: 300 } });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the form fields and submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("has accessible form controls and tab order", async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.tab();
    expect(emailInput).toHaveFocus();
    await user.tab();
    expect(passwordInput).toHaveFocus();
    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it("sets user and navigates to /auctions", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          bidCredits: 0,
          is_admin: false,
          is_superuser: false,
        },
      },
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("AUCTIONS")).toBeInTheDocument();

    const persisted = localStorage.getItem("auth.session.v1");
    expect(persisted).toBeNull();
  });

  it("prompts for OTP when backend requires 2FA and retries login with otp", async () => {
    mockedClient.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            error: {
              code: "two_factor_required",
              message: "Two-factor authentication required",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            bidCredits: 0,
            is_admin: false,
            is_superuser: false,
          },
        },
      });

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(
      await screen.findByText(/two-factor authentication required/i),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/authenticator code/i), "123456");
    await user.click(
      screen.getByRole("button", { name: /verify and sign in/i }),
    );

    expect(await screen.findByText("AUCTIONS")).toBeInTheDocument();
    expect(mockedClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/login",
      {
        email_address: "test@example.com",
        password: "password123",
        otp: "123456",
      },
      { __debugLogin: true },
    );
  });

  it("allows recovery code mode and submits recovery_code", async () => {
    mockedClient.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            error: {
              code: "two_factor_required",
              message: "Two-factor authentication required",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            bidCredits: 0,
            is_admin: false,
            is_superuser: false,
          },
        },
      });

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await user.click(
      screen.getByRole("button", { name: /use recovery code/i }),
    );
    await user.type(screen.getByLabelText(/recovery code/i), "ABCD-1234");
    await user.click(
      screen.getByRole("button", { name: /verify and sign in/i }),
    );

    expect(mockedClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/login",
      {
        email_address: "test@example.com",
        password: "password123",
        recovery_code: "ABCD-1234",
      },
      { __debugLogin: true },
    );
  });

  it("navigates to redirect URL when present", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          bidCredits: 0,
          is_admin: false,
          is_superuser: false,
        },
      },
    });

    const user = userEvent.setup();
    renderLogin("/login?redirect=/my-special-page");

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("SPECIAL")).toBeInTheDocument();
  });

  it("shows a friendly error when the server returns an unexpected auth payload", async () => {
    mockedClient.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/unexpected server response/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("auth.session.v1")).toBeNull();
    });
  });

  it("links validation errors via aria-describedby and focuses the first invalid field", async () => {
    mockedClient.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          details: {
            field_errors: {
              email_address: ["Email is invalid."],
            },
          },
        },
      },
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "nope@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/check the highlighted fields/i),
    ).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveFocus();
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(emailInput).toHaveAttribute("aria-describedby", "login-email-error");
    expect(screen.getByText("Email is invalid.")).toBeInTheDocument();
  });
});
