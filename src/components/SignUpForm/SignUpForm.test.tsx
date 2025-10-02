import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { SignUpForm } from "./SignUpForm";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../../hooks/useAuth";
import client from "../../api/client";

// --- Mocks ---
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
vi.mock("../../api/client");

const mockedUseAuth = vi.mocked(useAuth);
const mockedClient = vi.mocked(client, true);

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <SignUpForm />
    </MemoryRouter>
  );

describe("SignUpForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ login: mockLogin } as any);
  });

  it("renders all form fields", () => {
    renderComponent();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("displays an error if passwords do not match", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Fill required fields to allow form submission
    await user.type(screen.getByLabelText(/your name/i), "Test User");
    await user.type(screen.getByLabelText(/your email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^your password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password456");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match."
    );

    expect(mockedClient.post).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("submits successfully and navigates to /auctions", async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, name: "Test User" };
    const mockToken = "fake-token";

    mockedClient.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser },
    });

    renderComponent();

    await user.type(screen.getByLabelText(/your name/i), "Test User");
    await user.type(screen.getByLabelText(/your email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^your password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith("/signup", {
        name: "Test User",
        email_address: "test@example.com",
        password: "password123",
      });
      expect(mockLogin).toHaveBeenCalledWith(mockToken, mockUser);
      expect(mockNavigate).toHaveBeenCalledWith("/auctions");
    });
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    mockedClient.post.mockReturnValue(new Promise(() => {})); // never resolves
    renderComponent();

    // Fill required fields to allow form submission
    await user.type(screen.getByLabelText(/your name/i), "Test User");
    await user.type(screen.getByLabelText(/your email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^your password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    const loadingButton = await screen.findByRole("button", {
      name: /creating account.../i,
    });
    expect(loadingButton).toBeDisabled();
  });
});
