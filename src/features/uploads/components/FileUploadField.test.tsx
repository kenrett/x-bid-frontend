import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploadField } from "./FileUploadField";
import type { UploadAdapter } from "../types";

const constraints = {
  accept: ["image/png", "image/jpeg"],
  maxBytes: 1024 * 1024,
  guidance: "Test guidance",
};

const renderField = (adapter: UploadAdapter) =>
  render(
    <FileUploadField
      id="upload-input"
      label="Upload image"
      value=""
      onChange={vi.fn()}
      constraints={constraints}
      adapter={adapter}
    />,
  );

describe("FileUploadField", () => {
  it("shows a validation error for unsupported file types", async () => {
    const adapter: UploadAdapter = {
      upload: vi.fn().mockResolvedValue({ url: "https://example.com/file" }),
    };
    renderField(adapter);

    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const badFile = new File(["hello"], "note.txt", {
      type: "text/plain",
    });

    fireEvent.change(input, { target: { files: [badFile] } });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/unsupported file type/i);
    expect(adapter.upload).not.toHaveBeenCalled();
  });

  it("shows a validation error for large files", async () => {
    const adapter: UploadAdapter = {
      upload: vi.fn().mockResolvedValue({ url: "https://example.com/file" }),
    };
    renderField(adapter);

    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const bigBlob = new Uint8Array(2 * 1024 * 1024);
    const bigFile = new File([bigBlob], "big.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [bigFile] } });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/file is too large/i);
    expect(adapter.upload).not.toHaveBeenCalled();
  });

  it("surfaces upload failures and allows retry", async () => {
    const upload = vi
      .fn()
      .mockRejectedValueOnce({
        code: "network",
        message: "Network interruption detected.",
        retryable: true,
      })
      .mockResolvedValueOnce({ url: "https://example.com/file" });

    const adapter: UploadAdapter = { upload };
    renderField(adapter);
    const user = userEvent.setup();

    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const file = new File(["test"], "image.png", { type: "image/png" });

    await user.upload(input, file);

    expect(
      await screen.findByText(/network interruption detected/i),
    ).toBeInTheDocument();

    const retry = screen.getByRole("button", { name: /retry upload/i });
    await user.click(retry);

    expect(upload).toHaveBeenCalledTimes(2);
  });
});
