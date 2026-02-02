import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploadField } from "./FileUploadField";
import type { UploadAdapter } from "../types";
import { useAuth } from "@features/auth/hooks/useAuth";

vi.mock("@services/toast", () => ({ showToast: vi.fn() }));
vi.mock("@features/auth/hooks/useAuth");

const mockedUseAuth = vi.mocked(useAuth);

const constraints = {
  accept: ["image/png", "image/jpeg"],
  maxBytes: 1024 * 1024,
  guidance: "Test guidance",
};

const createAuthReturn = (user: Record<string, unknown> | null = {}) =>
  ({
    user,
    isReady: true,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    updateUserBalance: vi.fn(),
    sessionRemainingSeconds: null,
  }) as unknown as ReturnType<typeof useAuth>;

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
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(createAuthReturn({ id: 1 }));
  });

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
      .fn<UploadAdapter["upload"]>()
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

    const retry = screen.getByRole("button", { name: /try again/i });
    await user.click(retry);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
  });

  it("clears the error after a successful retry", async () => {
    const upload = vi
      .fn<UploadAdapter["upload"]>()
      .mockRejectedValueOnce({
        code: "server",
        message: "Server error.",
        retryable: true,
      })
      .mockResolvedValueOnce({ url: "https://example.com/file" });

    const adapter: UploadAdapter = { upload };
    renderField(adapter);
    const user = userEvent.setup();

    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const file = new File(["test"], "image.png", { type: "image/png" });

    await user.upload(input, file);
    expect(await screen.findByRole("alert")).toHaveTextContent(/server error/i);

    const retry = screen.getByRole("button", { name: /try again/i });
    await user.click(retry);

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });

  it("allows cancelling and removing a pending upload", async () => {
    const upload = vi.fn<UploadAdapter["upload"]>(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            reject({
              code: "cancelled",
              message: "Upload cancelled.",
              retryable: true,
            });
          });
        }),
    );

    const adapter: UploadAdapter = { upload };
    renderField(adapter);
    const user = userEvent.setup();

    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const file = new File(["test"], "image.png", { type: "image/png" });

    void user.upload(input, file);
    const cancel = await screen.findByRole("button", {
      name: /cancel upload/i,
    });
    await user.click(cancel);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /upload cancelled/i,
    );

    const remove = screen.getByRole("button", { name: /remove file/i });
    await user.click(remove);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks uploads when logged out", async () => {
    mockedUseAuth.mockReturnValue(createAuthReturn(null));
    const adapter: UploadAdapter = {
      upload: vi.fn().mockResolvedValue({ url: "https://example.com/file" }),
    };

    renderField(adapter);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Upload image") as HTMLInputElement;
    const file = new File(["test"], "image.png", { type: "image/png" });

    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /please log in to upload/i,
    );
    expect(adapter.upload).not.toHaveBeenCalled();
  });
});
