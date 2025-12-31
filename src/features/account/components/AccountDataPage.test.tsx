import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountDataPage } from "./AccountDataPage";
import { AuthContext } from "@features/auth/contexts/authContext";
import type { AuthContextType } from "@features/auth/types/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

const authValue = (overrides: Partial<AuthContextType> = {}): AuthContextType =>
  ({
    user: {
      id: 1,
      name: "Test",
      email: "test@example.com",
      bidCredits: 0,
      is_admin: false,
      is_superuser: false,
    },
    isReady: true,
    token: "t",
    refreshToken: "r",
    sessionTokenId: "s",
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
        <AccountDataPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("AccountDataPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedClient.get.mockResolvedValue({ data: { status: "not_requested" } });
  });

  it("renders a loading state", () => {
    mockedClient.get.mockReturnValue(new Promise(() => {}));
    renderPage(authValue());
    expect(screen.getByText(/loading data tools/i)).toBeInTheDocument();
  });

  it("requests an export", async () => {
    const user = userEvent.setup();
    mockedClient.post.mockResolvedValue({ data: { status: "pending" } });
    renderPage(authValue());

    await user.click(
      await screen.findByRole("button", { name: /request export/i }),
    );

    await waitFor(() => {
      expect(mockedClient.post).toHaveBeenCalledWith(
        "/api/v1/account/data/export",
        {},
      );
    });
  });

  it("deletes account and logs out", async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    mockedClient.delete.mockResolvedValue({});

    renderPage(authValue({ logout }));

    await user.type(
      await screen.findByLabelText(/type delete to confirm/i),
      "DELETE",
    );
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith("/api/v1/account", {
        data: { confirmation: "DELETE" },
      });
      expect(logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
