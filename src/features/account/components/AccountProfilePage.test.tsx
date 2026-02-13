import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AuthContext } from "@features/auth/contexts/authContext";
import type { AuthContextType } from "@features/auth/types/auth";
import { AccountProfilePage } from "./AccountProfilePage";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

const authValue = (overrides: Partial<AuthContextType> = {}): AuthContextType =>
  ({
    user: {
      id: 1,
      name: "Old Name",
      email: "test@example.com",
      bidCredits: 0,
      is_admin: false,
      is_superuser: false,
    },
    isReady: true,
    reconnecting: false,
    sessionRemainingSeconds: null,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    updateUserBalance: vi.fn(),
    ...overrides,
  }) as AuthContextType;

const renderPage = (value: AuthContextType) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <AccountProfilePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("AccountProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading state", () => {
    mockedClient.get.mockReturnValue(new Promise(() => {}));
    renderPage(authValue());
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it("renders a server error", async () => {
    mockedClient.get.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: "boom" } },
    });

    renderPage(authValue());

    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });

  it("updates name on happy path", async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();

    mockedClient.get.mockResolvedValue({
      data: { name: "Old Name", email: "test@example.com" },
    });
    mockedClient.patch.mockResolvedValue({
      data: { name: "New Name", email: "test@example.com" },
    });

    renderPage(authValue({ updateUser }));

    await user.clear(await screen.findByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), "New Name");
    await user.click(screen.getByRole("button", { name: /save name/i }));

    await waitFor(() => {
      expect(mockedClient.patch).toHaveBeenCalledWith("/api/v1/account", {
        account: { name: "New Name" },
      });
      expect(updateUser).toHaveBeenCalled();
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
    });
  });
});
