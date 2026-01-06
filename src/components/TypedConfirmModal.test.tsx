import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { TypedConfirmModal } from "./TypedConfirmModal";

const Harness = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <TypedConfirmModal
        open={open}
        title="Delete something?"
        phrase="DELETE"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
};

describe("TypedConfirmModal", () => {
  it("traps focus, requires typed phrase, and restores focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole("button", { name: /open/i });
    openButton.focus();

    await user.click(openButton);
    const dialog = screen.getByRole("dialog");

    const input = within(dialog).getByLabelText(/type delete to confirm/i);
    const cancel = within(dialog).getByRole("button", { name: /cancel/i });
    const confirm = within(dialog).getByRole("button", { name: /delete/i });
    expect(input).toHaveFocus();
    expect(confirm).toBeDisabled();

    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();

    await user.type(input, "DELETE");
    expect(confirm).toBeEnabled();

    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("confirms via enter when phrase matches", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /open/i }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText(/type delete to confirm/i);

    await user.type(input, "DELETE{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
