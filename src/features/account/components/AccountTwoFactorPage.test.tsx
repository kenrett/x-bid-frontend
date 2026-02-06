import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { AccountTwoFactorPage } from "./AccountTwoFactorPage";
import { twoFactorApi } from "../api/twoFactorApi";

vi.mock("../api/twoFactorApi");

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]) => toastMocks.showToast(...args),
}));

const mockedTwoFactorApi = vi.mocked(twoFactorApi, true);

describe("AccountTwoFactorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTwoFactorApi.getStatus.mockResolvedValue({ enabled: false });
  });

  it("starts setup and shows recovery codes after verification", async () => {
    const user = userEvent.setup();
    mockedTwoFactorApi.startSetup.mockResolvedValue({
      secret: "SECRET123",
      otpauthUrl: "otpauth://totp/demo",
      issuer: "X Bid",
      accountName: "user@example.com",
    });
    mockedTwoFactorApi.verifySetup.mockResolvedValue({
      recoveryCodes: ["CODE-1", "CODE-2"],
    });

    render(<AccountTwoFactorPage />);

    expect(
      await screen.findByText(/two-factor authentication/i),
    ).toBeInTheDocument();
    expect(mockedTwoFactorApi.getStatus).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

    expect(
      await screen.findByRole("heading", { name: /scan the qr code/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("SECRET123")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/enter the 6-digit code/i), "123456");
    await user.click(
      screen.getByRole("button", { name: /verify and enable/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/recovery codes/i)).toBeInTheDocument();
      expect(screen.getByText("CODE-1")).toBeInTheDocument();
      expect(screen.getByText("CODE-2")).toBeInTheDocument();
    });
  });
});
