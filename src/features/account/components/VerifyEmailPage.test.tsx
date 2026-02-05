import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { accountApi } from "@features/account/api/accountApi";

vi.mock("@features/account/api/accountApi", () => ({
  accountApi: {
    verifyEmail: vi.fn(),
    resendEmailVerification: vi.fn(),
  },
}));

const mockedAccountApi = vi.mocked(accountApi, true);

const renderPage = (initialEntry = "/verify-email?token=token123") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading then success", async () => {
    mockedAccountApi.verifyEmail.mockResolvedValue({ status: "verified" });

    renderPage();
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /email verified/i }),
    ).toBeInTheDocument();
  });

  it("renders an error message when verification fails", async () => {
    mockedAccountApi.verifyEmail.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { error: { code: "invalid_token", message: "Invalid token" } },
      },
    });

    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /verification link is invalid or has already been used/i,
    );
  });

  it("renders missing token state without calling the API", async () => {
    renderPage("/verify-email");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/token is missing/i);

    await waitFor(() => {
      expect(mockedAccountApi.verifyEmail).not.toHaveBeenCalled();
    });
  });
});
