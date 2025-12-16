import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminPlaceholder } from "./AdminPlaceholder";

describe("AdminPlaceholder", () => {
  it("renders provided title and description", () => {
    render(
      <AdminPlaceholder
        title="Placeholder Title"
        description="Custom description"
      />,
    );

    expect(screen.getByText("Placeholder Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
  });

  it("renders default description when none is provided", () => {
    render(<AdminPlaceholder title="No Description" />);

    expect(
      screen.getByText("This section is coming soon."),
    ).toBeInTheDocument();
  });
});
