import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

let routeError: unknown = null;
let isRouteError = false;

vi.mock("../Header/Header", () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock("../Footer/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useRouteError: () => routeError,
    isRouteErrorResponse: () => isRouteError,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    routeError = null;
    isRouteError = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders a generic fallback for unexpected errors", () => {
    routeError = new Error("boom");

    render(<RouteErrorBoundary />);

    expect(
      screen.getByText("An Unexpected Error Occurred"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Something went wrong. Please try again later."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(console.error).toHaveBeenCalled();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders 404 copy for route 404 errors", () => {
    routeError = { status: 404, statusText: "Not Found" };
    isRouteError = true;

    render(<RouteErrorBoundary />);

    expect(screen.getByText("404 - Page Not Found")).toBeInTheDocument();
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();
  });

  it("renders status and message for other route errors", () => {
    routeError = {
      status: 500,
      statusText: "Server Error",
      data: { message: "Oops" },
    };
    isRouteError = true;

    render(<RouteErrorBoundary />);

    expect(screen.getByText("500 - Server Error")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
  });
});
