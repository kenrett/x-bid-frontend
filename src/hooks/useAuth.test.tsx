import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { AuthContext } from "../contexts/authContext";
import type { AuthContextType } from "../types/auth";

const TestComponent = () => {
  const auth = useAuth();
  return <div>{auth.user?.email ?? "none"}</div>;
};

describe("useAuth", () => {
  it("returns context when provided", () => {
    const value: AuthContextType = {
      user: { id: 1, email: "test@example.com", name: "Test" },
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "session",
      sessionRemainingSeconds: 100,
      isReady: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUserBalance: vi.fn(),
    };

    render(
      <AuthContext.Provider value={value}>
        <TestComponent />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("throws when used outside provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // suppress React error boundary logs
    expect(() => render(<TestComponent />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});
