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

describe("accountApi.listSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts canonical sessions payload (snake_case + numeric id)", async () => {
    mockedClient.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "application/json" },
      data: {
        sessions: [
          {
            id: 35,
            created_at: "2025-01-01T00:00:00Z",
            last_seen_at: null,
            user_agent: "Safari",
            ip_address: "127.0.0.1",
            current: true,
          },
        ],
      },
    });

    const result = await accountApi.listSessions();

    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account/sessions");
    expect(result).toEqual([
      {
        id: "35",
        deviceLabel: "Safari",
        ip: "127.0.0.1",
        createdAt: "2025-01-01T00:00:00Z",
        lastSeenAt: undefined,
        isCurrent: true,
      },
    ]);
  });
});

describe("ACCOUNT_ENDPOINTS", () => {
  it("does not include legacy /api/v1/me/account paths", async () => {
    const { ACCOUNT_ENDPOINTS } = await import("./accountApi");
    expect(Object.values(ACCOUNT_ENDPOINTS).join("\n")).not.toMatch(
      /\/api\/v1\/me\/account/i,
    );
  });

  it("uses canonical email verification resend endpoint", async () => {
    const { ACCOUNT_ENDPOINTS } = await import("./accountApi");
    expect(Object.values(ACCOUNT_ENDPOINTS).join("\n")).toContain(
      "/api/v1/email_verifications/resend",
    );
    expect(Object.values(ACCOUNT_ENDPOINTS).join("\n")).not.toContain(
      "/api/v1/account/email/verification/resend",
    );
  });
});

describe("accountApi.getSecurity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats email_verified_at as verified when boolean is missing", async () => {
    mockedClient.get.mockResolvedValue({
      data: { email_verified_at: "2025-01-01T00:00:00Z" },
    });

    const result = await accountApi.getSecurity();

    expect(mockedClient.get).toHaveBeenCalledWith("/api/v1/account/security");
    expect(result.emailVerified).toBe(true);
  });
});
