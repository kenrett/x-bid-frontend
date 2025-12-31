import { describe, expect, it, vi, beforeEach } from "vitest";
import client from "@api/client";
import { accountApi } from "./accountApi";

vi.mock("@api/client");

const mockedClient = vi.mocked(client, true);

describe("accountApi.getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses /api/v1/account", async () => {
    mockedClient.get.mockResolvedValue({
      data: { user: { email_address: "user@example.com", name: "User" } },
    });

    const result = await accountApi.getProfile();

    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account");
    expect(result.email).toBe("user@example.com");
  });
});

describe("ACCOUNT_ENDPOINTS", () => {
  it("does not include legacy /api/v1/me/account paths", async () => {
    const { ACCOUNT_ENDPOINTS } = await import("./accountApi");
    expect(Object.values(ACCOUNT_ENDPOINTS).join("\n")).not.toMatch(
      /\/api\/v1\/me\/account/i,
    );
  });
});
