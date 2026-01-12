import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResetPassword } from "./ResetPassword";
import client from "@api/client";
import { useAuth } from "../../hooks/useAuth";

vi.mock("@api/client");
vi.mock("../../hooks/useAuth");

const mockedClient = vi.mocked(client, true);
const mockedUseAuth = vi.mocked(useAuth);

const renderWithToken = (token = "abc123") =>
  render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
      <ResetPassword />
    </MemoryRouter>,
  );

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      sessionRemainingSeconds: 0,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      isReady: true,
      updateUser: vi.fn(),
      updateUserBalance: vi.fn(),
    });
    mockedClient.post.mockResolvedValue({
      data: { message: "Password updated" },
    });
  });

  it("has accessible form controls and tab order", async () => {
    const user = userEvent.setup();
    renderWithToken();

    const tokenInput = screen.getByRole("textbox", { name: /reset token/i });
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.tab();
    expect(tokenInput).toHaveFocus();
    await user.tab();
    expect(newPasswordInput).toHaveFocus();
    await user.tab();
    expect(confirmPasswordInput).toHaveFocus();
  });

  it("submits reset with token and new password", async () => {
    const user = userEvent.setup();
    renderWithToken();

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith("/api/v1/password/reset", {
        password: {
          token: "abc123",
          password: "password123",
          password_confirmation: "password123",
        },
      });
    });

    expect(
      await screen.findByText(/password updated\. please sign in/i),
    ).toBeInTheDocument();
  });

  it("focuses the first invalid field and wires aria-describedby on submit failure", async () => {
    const user = userEvent.setup();
    renderWithToken();

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password1234");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    await waitFor(() => {
      expect(confirmPasswordInput).toHaveFocus();
      expect(confirmPasswordInput).toHaveAttribute("aria-invalid", "true");
      expect(confirmPasswordInput).toHaveAttribute(
        "aria-describedby",
        "reset-password-confirm-error",
      );
    });
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error for invalid token", async () => {
    mockedClient.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { error: "Invalid or expired token" } },
    });

    const user = userEvent.setup();
    renderWithToken();

    await user.type(screen.getByLabelText(/new password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText(/invalid or expired token/i),
    ).toBeInTheDocument();
  });
});
