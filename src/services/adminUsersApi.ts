import client from "../../src/api/client";
import type { AdminUser } from "@/components/Admin/Users/types";
import type { ApiJsonResponse } from "@/api/openapi-helpers";
import type { paths } from "@/api/openapi-types";

type AdminUsersListResponse = ApiJsonResponse<"/api/v1/admin/users", "get">;

type AdminUserRecord =
  AdminUsersListResponse extends Array<infer Item>
    ? Item
    : AdminUsersListResponse extends { users: infer U }
      ? U extends Array<infer Item>
        ? Item
        : U
      : unknown;

const normalizeAdminUser = (raw: AdminUserRecord): AdminUser => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const roleValue =
    typeof data.role === "string" ? data.role.toLowerCase() : null;
  const role: AdminUser["role"] =
    roleValue === "superadmin"
      ? "superadmin"
      : roleValue === "user"
        ? "user"
        : "admin";

  const statusValue =
    typeof data.status === "string" ? data.status.toLowerCase() : null;
  const status: AdminUser["status"] =
    statusValue === "disabled" || statusValue === "banned"
      ? "disabled"
      : "active";

  const id =
    typeof data.id === "number"
      ? data.id
      : typeof data.id === "string" && data.id.trim() !== ""
        ? Number(data.id)
        : 0;

  const email =
    typeof data.email === "string"
      ? data.email
      : typeof (data as { email_address?: unknown }).email_address === "string"
        ? (data as { email_address: string }).email_address
        : "";

  const name =
    typeof data.name === "string"
      ? data.name
      : typeof (data as { full_name?: unknown }).full_name === "string"
        ? (data as { full_name: string }).full_name
        : "";

  return {
    id,
    email,
    name,
    role,
    status,
  };
};

type AdminUserResponse<P extends keyof paths, M extends keyof paths[P]> =
  | ApiJsonResponse<P, M>
  | { user?: AdminUserRecord };

export const adminUsersApi = {
  async getUsers(): Promise<AdminUser[]> {
    const response = await client.get<
      AdminUsersListResponse | { users?: AdminUsersListResponse }
    >("/api/v1/admin/users");

    const payload = response.data;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { users?: unknown }).users)
        ? (payload as { users: unknown[] }).users
        : [];

    return list.map((item) => normalizeAdminUser(item as AdminUserRecord));
  },

  async grantAdmin(id: number): Promise<AdminUser> {
    const response = await client.post<
      AdminUserResponse<"/api/v1/admin/users/{id}/grant_admin", "post">
    >(`/api/v1/admin/users/${id}/grant_admin`);
    const data =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(data as AdminUserRecord);
  },

  async revokeAdmin(id: number): Promise<AdminUser> {
    const response = await client.post<
      AdminUserResponse<"/api/v1/admin/users/{id}/revoke_admin", "post">
    >(`/api/v1/admin/users/${id}/revoke_admin`);
    const data =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(data as AdminUserRecord);
  },

  async grantSuperadmin(id: number): Promise<AdminUser> {
    const response = await client.post<
      AdminUserResponse<"/api/v1/admin/users/{id}/grant_superadmin", "post">
    >(`/api/v1/admin/users/${id}/grant_superadmin`);
    const data =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(data as AdminUserRecord);
  },

  async revokeSuperadmin(id: number): Promise<AdminUser> {
    const response = await client.post<
      AdminUserResponse<"/api/v1/admin/users/{id}/revoke_superadmin", "post">
    >(`/api/v1/admin/users/${id}/revoke_superadmin`);
    const data =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(data as AdminUserRecord);
  },

  async banUser(id: number): Promise<AdminUser> {
    const response = await client.post<
      AdminUserResponse<"/api/v1/admin/users/{id}/ban", "post">
    >(`/api/v1/admin/users/${id}/ban`);
    const data =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(data as AdminUserRecord);
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await client.patch<
      AdminUserResponse<"/api/v1/admin/users/{id}", "patch">
    >(`/api/v1/admin/users/${id}`, { user: data });
    const payload =
      (response.data as { user?: AdminUserRecord })?.user ?? response.data;
    return normalizeAdminUser(payload as AdminUserRecord);
  },
};
