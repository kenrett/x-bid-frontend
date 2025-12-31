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

  it("falls back to legacy profile endpoint on 404", async () => {
    mockedClient.get
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 404,
          headers: { "content-type": "text/html" },
          data: "<html>Not Found</html>",
        },
      })
      .mockResolvedValueOnce({
        data: { user: { email_address: "user@example.com", name: "User" } },
      });

    const result = await accountApi.getProfile();

    expect(mockedClient.get).toHaveBeenNthCalledWith(1, "/api/v1/account");
    expect(mockedClient.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/account/profile",
    );
    expect(result.email).toBe("user@example.com");
  });
});
