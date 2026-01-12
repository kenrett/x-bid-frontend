import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import client from "@api/client";
import { AccountDeletePage } from "./AccountDeletePage";
import { useAuth } from "@features/auth/hooks/useAuth";

vi.mock("@api/client");
vi.mock("@features/auth/hooks/useAuth");

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));

const mockedClient = vi.mocked(client, true);
const mockedUseAuth = vi.mocked(useAuth);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/account/data/delete"]}>
      <Routes>
        <Route path="/account/data/delete" element={<AccountDeletePage />} />
        <Route path="/goodbye" element={<div>GOODBYE</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("AccountDeletePage", () => {
  let logoutMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    toastMocks.showToast.mockReset();
    logoutMock = vi.fn();
    mockedUseAuth.mockReturnValue({
      logout: logoutMock,
      user: null,
      accessToken: null,
      sessionRemainingSeconds: null,
      login: vi.fn(),
      updateUser: vi.fn(),
      updateUserBalance: vi.fn(),
      isReady: true,
    });
  });

  it("requires typed DELETE and logs out to goodbye on success", async () => {
    const user = userEvent.setup();
    mockedClient.delete.mockResolvedValueOnce({});

    renderPage();

    await user.type(screen.getByLabelText(/current password/i), "pw");
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: /delete account/i,
    });
    expect(confirmButton).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText(/type delete to confirm/i),
      "NO",
    );
    expect(confirmButton).toBeDisabled();

    await user.clear(within(dialog).getByLabelText(/type delete to confirm/i));
    await user.type(
      within(dialog).getByLabelText(/type delete to confirm/i),
      "DELETE",
    );
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedClient.delete).toHaveBeenCalledWith("/api/v1/account", {
        data: { current_password: "pw", confirmation: "DELETE" },
      });
    });

    expect(await screen.findByText("GOODBYE")).toBeInTheDocument();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("shows validation error when password is missing", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    expect(
      await screen.findByText(/check the highlighted fields/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toHaveFocus();
    expect(mockedClient.delete).not.toHaveBeenCalled();
  });
});
