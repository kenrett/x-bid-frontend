import { describe, it, expect, vi, beforeEach } from "vitest";
import { showToast, subscribeToToasts } from "./toast";

describe("toast service", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  it("publishes toast messages with default variant", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToasts(listener);

    showToast("Hello");

    expect(listener).toHaveBeenCalledWith({
      id: expect.stringContaining("1000-") as unknown as string,
      message: "Hello",
      variant: "info",
    });
    unsubscribe();
  });

  it("unsubscribes listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToasts(listener);
    unsubscribe();

    showToast("Gone", "success");
    expect(listener).not.toHaveBeenCalled();
  });
});
