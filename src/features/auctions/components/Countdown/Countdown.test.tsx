import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Countdown } from "./Countdown";

describe("Countdown Component", () => {
  const onEndMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onEndMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should display the initial time remaining correctly (under an hour)", () => {
    const now = Date.now();
    const endTime = new Date(now + 30 * 60 * 1000).toISOString(); // 30 minutes
    render(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);
    expect(screen.getByText("30:00")).toBeInTheDocument();
  });

  it("should display the initial time remaining correctly (over an hour)", () => {
    const now = Date.now();
    const endTime = new Date(now + 90 * 60 * 1000).toISOString(); // 1 hour 30 minutes
    render(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);
    expect(screen.getByText("01:30:00")).toBeInTheDocument();
  });

  it("should tick down every second", () => {
    const now = Date.now();
    const endTime = new Date(now + 5 * 1000).toISOString(); // 5 seconds
    render(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);

    expect(screen.getByText("00:05")).toBeInTheDocument();

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:04")).toBeInTheDocument();

    // Advance time by another 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("00:02")).toBeInTheDocument();
  });

  it("should call onEnd and display 00:00 when the timer finishes", () => {
    const now = Date.now();
    const endTime = new Date(now + 2 * 1000).toISOString(); // 2 seconds
    render(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);

    expect(screen.getByText("00:02")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000); // Advance past the end time
    });

    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(onEndMock).toHaveBeenCalledTimes(1);
  });

  it('should display "Auction Ended" if status is "complete"', () => {
    const endTime = new Date().toISOString();
    render(<Countdown endTime={endTime} status="complete" onEnd={onEndMock} />);
    expect(screen.getByText("Auction Ended")).toBeInTheDocument();
    expect(onEndMock).not.toHaveBeenCalled();
  });

  it('should display "00:00" and not start the timer if status is not "active" or "complete"', () => {
    const endTime = new Date(Date.now() + 10000).toISOString();
    render(
      <Countdown endTime={endTime} status="scheduled" onEnd={onEndMock} />,
    );
    expect(screen.getByText("00:00")).toBeInTheDocument();

    // Advance time and ensure nothing changes and onEnd is not called
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(onEndMock).not.toHaveBeenCalled();
  });

  it("should clear the interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const endTime = new Date(Date.now() + 10000).toISOString();
    const { unmount } = render(
      <Countdown endTime={endTime} status="active" onEnd={onEndMock} />,
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle negative start time by displaying 00:00", () => {
    const endTime = new Date(Date.now() - 10000).toISOString(); // 10 seconds in the past
    render(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("should only call onEnd once even if re-rendered with the same expired endTime", () => {
    const endTime = new Date(Date.now() - 1000).toISOString();
    const { rerender } = render(
      <Countdown endTime={endTime} status="active" onEnd={onEndMock} />,
    );

    expect(onEndMock).toHaveBeenCalledTimes(1);

    rerender(<Countdown endTime={endTime} status="active" onEnd={onEndMock} />);

    expect(onEndMock).toHaveBeenCalledTimes(1);
  });
});
