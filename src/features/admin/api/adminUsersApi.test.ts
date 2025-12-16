import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "@api/client";
import { adminUsersApi } from "./adminUsersApi";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(client.get);
const mockedPost = vi.mocked(client.post);
const mockedPatch = vi.mocked(client.patch);

const rawUser = {
  id: "5",
  email_address: "user@example.com",
  full_name: "User Name",
  role: "SUPERADMIN",
  status: "banned",
};

describe("adminUsersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes list users from array or wrapped payload", async () => {
    mockedGet
      .mockResolvedValueOnce({ data: [rawUser] })
      .mockResolvedValueOnce({ data: { users: [rawUser] } });

    const first = await adminUsersApi.getUsers();
    const second = await adminUsersApi.getUsers();

    expect(first[0]).toEqual({
      id: 5,
      email: "user@example.com",
      name: "User Name",
      role: "superadmin",
      status: "disabled",
    });
    expect(second[0]).toEqual(first[0]);
  });

  it("normalizes responses for role updates", async () => {
    mockedPost.mockResolvedValue({ data: { user: rawUser } });
    const promoted = await adminUsersApi.grantAdmin(5);
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/admin/users/5/grant_admin",
    );
    expect(promoted.role).toBe("superadmin");

    await adminUsersApi.revokeAdmin(5);
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/admin/users/5/revoke_admin",
    );

    await adminUsersApi.grantSuperadmin(5);
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/admin/users/5/grant_superadmin",
    );

    await adminUsersApi.revokeSuperadmin(5);
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/admin/users/5/revoke_superadmin",
    );

    await adminUsersApi.banUser(5);
    expect(mockedPost).toHaveBeenCalledWith("/api/v1/admin/users/5/ban");
  });

  it("normalizes updateUser payload", async () => {
    mockedPatch.mockResolvedValue({ data: { user: rawUser } });
    const result = await adminUsersApi.updateUser(5, { name: "Updated" });
    expect(mockedPatch).toHaveBeenCalledWith("/api/v1/admin/users/5", {
      user: { name: "Updated" },
    });
    expect(result.id).toBe(5);
  });
});
