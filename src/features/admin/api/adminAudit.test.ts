import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "@api/client";
import { logAdminAction } from "./adminAudit";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { post: vi.fn() },
}));

const mockedPost = vi.mocked(client.post);

describe("logAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends audit payload", async () => {
    mockedPost.mockResolvedValue({} as never);

    logAdminAction("test.action", { foo: "bar" });
    await vi.waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith("/api/v1/admin/audit", {
        audit: {
          action: "test.action",
          payload: { foo: "bar" },
        },
      }),
    );
  });

  it("swallows errors and logs them", async () => {
    mockedPost.mockRejectedValue(new Error("fail"));
    logAdminAction("test.error");
    await vi.waitFor(() => expect(mockedPost).toHaveBeenCalled());
    expect(console.error).toHaveBeenCalled();
  });
});
