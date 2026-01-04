import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPassword } from "./ForgotPassword";
import client from "@api/client";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPassword />
    </MemoryRouter>,
  );

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedClient.post.mockResolvedValue({ data: { status: "ok" } });
  });

  it("has accessible form controls and tab order", async () => {
    const user = userEvent.setup();
    renderComponent();

    const emailInput = screen.getByRole("textbox", { name: /email address/i });
    expect(emailInput).toBeInTheDocument();

    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toHaveFocus();
  });

  it("focuses the email field and connects the error on submit when empty", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    const emailInput = screen.getByRole("textbox", { name: /email address/i });
    await waitFor(() => {
      expect(emailInput).toHaveFocus();
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute(
        "aria-describedby",
        "forgot-email-error",
      );
    });
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(mockedClient.post).not.toHaveBeenCalled();
  });

  it("submits email and shows generic success", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith(
        "/api/v1/password/forgot",
        {
          password: { email_address: "test@example.com" },
        },
      );
    });

    expect(
      await screen.findByText(
        /if that account exists, we've emailed instructions/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders debug token when provided", async () => {
    mockedClient.post.mockResolvedValue({
      data: { status: "ok", debug_token: "abc123" },
    });
    const user = userEvent.setup();
    renderComponent();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/debug token:/i)).toHaveTextContent(
      "abc123",
    );
  });
});
