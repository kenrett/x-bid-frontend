import client from "../../src/api/client";
import type { AdminUser } from "@/components/Admin/Users/types";

export const adminUsersApi = {
  async getUsers(): Promise<AdminUser[]> {
    const response = await client.get("/api/v1/admin/users");
    return response.data;
  },

  async grantAdmin(id: number): Promise<AdminUser> {
    const response = await client.post(`/api/v1/admin/users/${id}/grant_admin`);
    return response.data;
  },

  async revokeAdmin(id: number): Promise<AdminUser> {
    const response = await client.post(`/api/v1/admin/users/${id}/revoke_admin`);
    return response.data;
  },

  async grantSuperadmin(id: number): Promise<AdminUser> {
    const response = await client.post(`/api/v1/admin/users/${id}/grant_superadmin`);
    return response.data;
  },

  async revokeSuperadmin(id: number): Promise<AdminUser> {
    const response = await client.post(`/api/v1/admin/users/${id}/revoke_superadmin`);
    return response.data;
  },

  async banUser(id: number): Promise<AdminUser> {
    const response = await client.post(`/api/v1/admin/users/${id}/ban`);
    return response.data;
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await client.patch(`/api/v1/admin/users/${id}`, { user: data });
    return response.data;
  },
};