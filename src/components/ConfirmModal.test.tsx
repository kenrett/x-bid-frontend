import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

const Harness = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <ConfirmModal
        open={open}
        title="Confirm action"
        description="This is destructive."
        confirmLabel="Do it"
        cancelLabel="Nope"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
};

describe("ConfirmModal", () => {
  it("traps focus, closes on escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole("button", { name: /open/i });
    openButton.focus();
    expect(openButton).toHaveFocus();

    await user.click(openButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Do it" });
    const cancel = screen.getByRole("button", { name: "Nope" });
    expect(confirm).toHaveFocus();

    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();

    await user.tab({ shift: true });
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });
});
