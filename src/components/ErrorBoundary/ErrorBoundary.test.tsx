import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ErrorBoundary from "./ErrorBoundary";
import { logError } from "../../services/logger";

// Mock the logger service
vi.mock("../../services/logger", () => ({
  logError: vi.fn(),
}));

// A component that will throw an error when rendered
const CrashingComponent = () => {
  throw new Error("Test crash!");
};

// A component that can be controlled to throw an error or render normally
const ControllableCrashingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Transient error");
  }
  return <div>Rendered successfully</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error output from React during tests
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Happy path content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Happy path content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should display a fallback UI and log the error when a child component crashes", () => {
    const testError = new Error("Test crash!");

    render(
      <ErrorBoundary>
        <CrashingComponent />
      </ErrorBoundary>
    );

    // Verify the fallback UI is shown
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    // Verify the logger was called
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("should display a custom fallback component if provided", () => {
    const CustomFallback = () => <div role="alert">A custom error occurred.</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <CrashingComponent />
      </ErrorBoundary>
    );

    // Verify the custom fallback is shown
    expect(screen.getByText("A custom error occurred.")).toBeInTheDocument();

    // Verify the default fallback is NOT shown
    expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
  });

  it('should attempt to re-render the children when "Try Again" is clicked', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ControllableCrashingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Ensure fallback is visible
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    // "Fix" the component so it won't throw on the next render
    rerender(
      <ErrorBoundary>
        <ControllableCrashingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    const user = userEvent.setup();
    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    await user.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText("Rendered successfully")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });
  });

  it('should call window.location.reload when "Reload Page" is clicked', async () => {
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { reload: reloadMock });

    render(
      <ErrorBoundary>
        <CrashingComponent />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    const user = userEvent.setup();
    await user.click(reloadButton);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});