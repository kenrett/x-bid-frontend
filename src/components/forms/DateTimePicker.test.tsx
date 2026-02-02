import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateTimePicker } from "./DateTimePicker";

describe("DateTimePicker", () => {
  it("selecting date + time emits a non-null ISO string", async () => {
    const user = userEvent.setup();
    const onChangeISO = vi.fn();

    render(<DateTimePicker label="Start" onChangeISO={onChangeISO} />);

    const dateInput = screen.getByLabelText(/date/i);
    const timeSelect = screen.getByLabelText(/time/i);

    fireEvent.change(dateInput, { target: { value: "2026-02-02" } });
    await user.selectOptions(timeSelect, "14:30");

    const lastCall = onChangeISO.mock.calls.at(-1)?.[0];
    expect(lastCall).not.toBeNull();
    expect(lastCall).toMatch(/2026-02-02T14:30:00/);
  });

  it("clearing emits null", async () => {
    const user = userEvent.setup();
    const onChangeISO = vi.fn();

    render(
      <DateTimePicker
        label="Start"
        valueISO="2026-02-02T14:30:00"
        onChangeISO={onChangeISO}
      />,
    );

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(onChangeISO).toHaveBeenLastCalledWith(null);
    expect(screen.getByLabelText(/date/i)).toHaveValue("");
    expect(screen.getByLabelText(/time/i)).toHaveValue("");
  });

  it("renders error text when provided", () => {
    render(
      <DateTimePicker
        label="Start"
        onChangeISO={() => undefined}
        error="Something went wrong"
      />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
