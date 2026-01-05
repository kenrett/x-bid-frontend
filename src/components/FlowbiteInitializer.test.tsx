import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { FlowbiteInitializer } from "./FlowbiteInitializer";

const initFlowbite = vi.fn();
vi.mock("flowbite", () => ({
  initFlowbite: (...args: unknown[]) => initFlowbite(...args),
}));

describe("FlowbiteInitializer", () => {
  it("calls initFlowbite on mount and renders nothing", async () => {
    const { container } = render(<FlowbiteInitializer />);

    await waitFor(() => expect(initFlowbite).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
  });
});
