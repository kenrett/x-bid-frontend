import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastContainer } from "./ToastContainer";
import { subscribeToToasts, type ToastListener } from "../../services/toast";

vi.mock("../../services/toast");

const mockSubscribe = vi.mocked(subscribeToToasts);
let capturedListener: ToastListener | undefined;

describe("ToastContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    capturedListener = undefined;
    mockSubscribe.mockImplementation((cb) => {
      capturedListener = cb;
      return () => true;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders toasts and removes them after the timeout", () => {
    render(<ToastContainer />);

    if (!capturedListener) throw new Error("Subscription callback not set");

    act(() => {
      capturedListener?.({ id: "1", message: "Hello", variant: "info" });
    });

    expect(screen.getByText("Hello")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });

  it("applies variant styling classes", () => {
    render(<ToastContainer />);
    if (!capturedListener) throw new Error("Subscription callback not set");

    act(() => {
      capturedListener?.({ id: "2", message: "Saved", variant: "success" });
    });

    const toast = screen.getByText("Saved");
    expect(toast).toHaveClass("bg-green-900/60");
  });
});
