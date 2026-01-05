import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider } from "../features/auth/providers/AuthProvider";
import { Layout } from "./Layout";

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));

const renderWithContent = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>body content</div>} />
            <Route path="/account/verify-email" element={<div>VERIFY</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("Layout", () => {
  it("renders header, footer, and outlet content", () => {
    renderWithContent();
    expect(screen.getByText(/body content/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("redirects to verify-email when email is unverified", () => {
    renderWithContent();
    act(() => {
      window.dispatchEvent(
        new CustomEvent("app:email_unverified", { detail: { status: 403 } }),
      );
    });
    expect(screen.getByText("VERIFY")).toBeInTheDocument();
    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Verify your email to continue.",
      "error",
    );
  });
});
