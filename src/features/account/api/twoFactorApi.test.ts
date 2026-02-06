import { beforeEach, describe, expect, it, vi } from "vitest";
import client from "@api/client";
import { TWO_FACTOR_ENDPOINTS, twoFactorApi } from "./twoFactorApi";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

describe("twoFactorApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses canonical /api/v1/account/2fa endpoint constants", () => {
    expect(TWO_FACTOR_ENDPOINTS.status).toBe("/api/v1/account/2fa");
    expect(TWO_FACTOR_ENDPOINTS.setup).toBe("/api/v1/account/2fa/setup");
    expect(TWO_FACTOR_ENDPOINTS.verify).toBe("/api/v1/account/2fa/verify");
    expect(Object.values(TWO_FACTOR_ENDPOINTS).join("\n")).not.toContain(
      "/api/v1/account/two_factor",
    );
  });

  it("fetches status from /api/v1/account/2fa", async () => {
    mockedClient.get.mockResolvedValue({
      data: { enabled: true, enabled_at: "2026-02-05T11:22:33Z" },
    });

    const result = await twoFactorApi.getStatus();

    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account/2fa");
    expect(result).toEqual({
      enabled: true,
      enabledAt: "2026-02-05T11:22:33Z",
    });
  });

  it("starts setup via /api/v1/account/2fa/setup", async () => {
    mockedClient.post.mockResolvedValue({
      data: { secret: "SECRET123", otpauth_uri: "otpauth://totp/demo" },
    });

    const result = await twoFactorApi.startSetup();

    expect(mockedClient.post).toHaveBeenCalledWith(
      "/api/v1/account/2fa/setup",
      {},
    );
    expect(result.secret).toBe("SECRET123");
    expect(result.otpauthUrl).toBe("otpauth://totp/demo");
  });

  it("verifies setup via /api/v1/account/2fa/verify", async () => {
    mockedClient.post.mockResolvedValue({
      data: { status: "enabled", recovery_codes: ["CODE-1", "CODE-2"] },
    });

    const result = await twoFactorApi.verifySetup("123456");

    expect(mockedClient.post).toHaveBeenCalledWith(
      "/api/v1/account/2fa/verify",
      { code: "123456" },
    );
    expect(result).toEqual({ recoveryCodes: ["CODE-1", "CODE-2"] });
  });
});
