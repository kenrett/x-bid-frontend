import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "./SignUpForm";
import { useAuth } from "../../hooks/useAuth";
import client from "@api/client";
import type { LoginPayload } from "@types/auth";
import type { User } from "@types/user";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../hooks/useAuth");
vi.mock("@api/client");

const mockedUseAuth = vi.mocked(useAuth);
const mockedClient = vi.mocked(client, true);

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <SignUpForm />
    </MemoryRouter>,
  );

describe("SignUpForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renders all form fields", () => {
    renderComponent();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("displays an error if passwords do not match", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password456");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );

    expect(mockedClient.post).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("submits successfully and navigates to /auctions", async () => {
    const user = userEvent.setup();
    const mockUser: User = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      bidCredits: 0,
      is_admin: false,
    };
    const mockToken = "fake-token";
    const mockRefreshToken = "refresh-token";
    const mockSessionTokenId = "session-token";

    mockedClient.post.mockResolvedValue({
      data: {
        token: mockToken,
        refresh_token: mockRefreshToken,
        session_token_id: mockSessionTokenId,
        user: mockUser,
      },
    });

    renderComponent();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith("/api/v1/signup", {
        name: "Test User",
        email_address: "test@example.com",
        password: "password123",
      });
      expect(mockLogin).toHaveBeenCalledWith({
        token: mockToken,
        refreshToken: mockRefreshToken,
        sessionTokenId: mockSessionTokenId,
        user: mockUser,
      } satisfies LoginPayload);
      expect(mockNavigate).toHaveBeenCalledWith("/auctions");
    });
  });

  it("shows an error and re-enables the button on failed submit", async () => {
    const user = userEvent.setup();
    const testError = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedClient.post.mockRejectedValue(testError);

    renderComponent();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeEnabled();

    consoleSpy.mockRestore();
  });

  it("prevents double submit while a request is in flight", async () => {
    const user = userEvent.setup();
    mockedClient.post.mockReturnValue(new Promise(() => {})); // never resolves

    renderComponent();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });
    await user.click(submitButton);
    await user.click(submitButton);

    expect(mockedClient.post).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    mockedClient.post.mockReturnValue(new Promise(() => {})); // never resolves
    renderComponent();

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    const loadingButton = await screen.findByRole("button", {
      name: /creating account.../i,
    });
    expect(loadingButton).toBeDisabled();
  });
});
