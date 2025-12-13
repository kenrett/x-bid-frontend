import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FlowbiteInitializer } from "./FlowbiteInitializer";

const initFlowbite = vi.fn();
vi.mock("flowbite", () => ({
  initFlowbite: (...args: unknown[]) => initFlowbite(...args),
}));

describe("FlowbiteInitializer", () => {
  it("calls initFlowbite on mount and renders nothing", () => {
    const { container } = render(<FlowbiteInitializer />);

    expect(initFlowbite).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });
});
