import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountSecurityPage } from "./AccountSecurityPage";
import { useAuth } from "@features/auth/hooks/useAuth";

vi.mock("@api/client");
vi.mock("@features/auth/hooks/useAuth");

const mockedClient = vi.mocked(client, true);
const mockedUseAuth = vi.mocked(useAuth);

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountSecurityPage />
    </MemoryRouter>,
  );

describe("AccountSecurityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: null,
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renders a loading state", () => {
    mockedClient.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading security/i)).toBeInTheDocument();
  });

  it("renders server error if status fetch fails", async () => {
    mockedClient.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "boom" } },
    });

    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("submits password change on happy path", async () => {
    const user = userEvent.setup();
    mockedClient.get.mockResolvedValue({
      data: { email_verified: false, email_verified_at: null },
    });
    mockedClient.post.mockResolvedValue({});

    renderPage();

    await user.type(
      await screen.findByLabelText(/current password/i),
      "old-password",
    );
    await user.type(
      screen.getByLabelText(/^new password/i),
      "new-password-1234",
    );
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "new-password-1234",
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith(
        "/api/v1/account/password",
        {
          current_password: "old-password",
          new_password: "new-password-1234",
        },
      );
      expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    });
  });

  it("posts email verification resend to the canonical endpoint", async () => {
    const user = userEvent.setup();
    mockedClient.get.mockResolvedValue({
      data: { email_verified: false, email_verified_at: null },
    });
    mockedClient.post.mockResolvedValue({});

    renderPage();

    await user.click(
      await screen.findByRole("button", { name: /resend verification email/i }),
    );

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith(
        "/api/v1/email_verifications/resend",
        {},
      );
      expect(mockedClient.post).not.toHaveBeenCalledWith(
        "/api/v1/account/email/verification/resend",
        expect.anything(),
      );
    });
  });

  it("focuses the first invalid password field after submit", async () => {
    const user = userEvent.setup();
    mockedClient.get.mockResolvedValue({
      data: { email_verified: false, email_verified_at: null },
    });

    renderPage();

    await user.type(
      await screen.findByLabelText(/current password/i),
      "old-password",
    );
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    await user.type(newPasswordInput, "short");
    await user.type(screen.getByLabelText(/confirm new password/i), "short");

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at least 12 characters/i,
    );
    await waitFor(() => {
      expect(newPasswordInput).toHaveAttribute("aria-invalid", "true");
      expect(newPasswordInput).toHaveFocus();
    });
  });
});
