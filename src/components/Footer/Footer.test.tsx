import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("uses a high-contrast copyright text color", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const copyright = screen.getByText(/all rights reserved\./i);
    expect(copyright).toHaveClass("text-[color:var(--sf-mutedText)]");
  });
});
