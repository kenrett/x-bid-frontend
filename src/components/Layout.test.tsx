import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../features/auth/providers/AuthProvider";
import { Layout } from "./Layout";

const renderWithContent = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>body content</div>} />
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
});
