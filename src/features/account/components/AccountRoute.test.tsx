import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "@features/auth/contexts/authContext";
import { AccountRoute } from "./AccountRoute";
import type { AuthContextType } from "@features/auth/types/auth";

const renderWithAuth = (value: Partial<AuthContextType>, initialPath: string) =>
  render(
    <AuthContext.Provider value={value as AuthContextType}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/account" element={<AccountRoute />}>
            <Route path="security" element={<div>SECURITY</div>} />
          </Route>
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("AccountRoute", () => {
  it("redirects to /login when logged out", async () => {
    renderWithAuth(
      {
        user: null,
        isReady: true,
        reconnecting: false,
        sessionRemainingSeconds: null,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        updateUserBalance: vi.fn(),
      },
      "/account/security",
    );

    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });

  it("renders children when logged in", async () => {
    renderWithAuth(
      {
        user: {
          id: 1,
          name: "Test",
          email: "test@example.com",
          bidCredits: 0,
          is_admin: false,
          is_superuser: false,
          email_verified: true,
          email_verified_at: null,
        },
        isReady: true,
        reconnecting: false,
        sessionRemainingSeconds: null,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        updateUserBalance: vi.fn(),
      },
      "/account/security",
    );

    expect(await screen.findByText("SECURITY")).toBeInTheDocument();
  });
});
