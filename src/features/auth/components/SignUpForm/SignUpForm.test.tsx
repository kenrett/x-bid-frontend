import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import client from "@api/client";
import { SignUpForm } from "./SignUpForm";
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

const renderSignup = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/auctions" element={<div>AUCTIONS</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockedClient.get.mockResolvedValue({ data: { remaining_seconds: 300 } });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders all form fields", () => {
    renderSignup();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("stores tokens + user and navigates to /auctions", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        access_token: "access",
        refresh_token: "refresh",
        session_token_id: "sid",
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
    renderSignup();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("AUCTIONS")).toBeInTheDocument();

    const persisted = localStorage.getItem("auth.session.v1");
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted as string)).toMatchObject({
      access_token: "access",
      refresh_token: "refresh",
      session_token_id: "sid",
      user: { email: "test@example.com" },
    });
  });

  it("shows an unexpected server response error when auth fields are missing", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        access_token: "access",
        // refresh_token intentionally missing
        session_token_id: "sid",
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
    renderSignup();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/unexpected server response/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("auth.session.v1")).toBeNull();
    });
  });

  it("links local validation errors via aria-describedby and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "nope");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    expect(confirmPasswordInput).toHaveFocus();
    expect(confirmPasswordInput).toHaveAttribute("aria-invalid", "true");
    expect(confirmPasswordInput).toHaveAttribute(
      "aria-describedby",
      "signup-confirm-password-error",
    );
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockedClient.post).not.toHaveBeenCalled();
  });
});
