import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AccountDataPage } from "./AccountDataPage";

describe("AccountDataPage", () => {
  it("links to export and delete screens", () => {
    render(
      <MemoryRouter>
        <AccountDataPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /export your data/i }),
    ).toHaveAttribute("href", "/account/data/export");
    expect(
      screen.getByRole("link", { name: /delete account/i }),
    ).toHaveAttribute("href", "/account/data/delete");
  });
});
