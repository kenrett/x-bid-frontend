import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/services/toast";
import { logAdminAction } from "@/services/adminAudit";
import type { AdminUser } from "./types";
import { AdminUsers } from "./AdminUsers";
import { adminUsersApi } from "@/services/adminUsersApi";

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((candidate) =>
      candidate.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      candidate.name.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsers(await adminUsersApi.getUsers());
      } catch (error) { showToast("Could not load users", "error"); }
    };
    fetchUsers();
  }, []);

  const requireSuper = (action: () => void) => {
    if (!isSuperAdmin) {
      showToast("Superadmin only action", "error");
      return;
    }
    action();
  };

  const updateUserInState = (updatedUser: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleApiAction = async (action: () => Promise<AdminUser>, log: string, successMessage: string) => {
    try {
      const updatedUser = await action();
      updateUserInState(updatedUser);
      logAdminAction(log, { id: updatedUser.id });
      showToast(successMessage, "success");
    } catch (error) {
      showToast(`Action failed: ${error.message}`, "error");
    }
  };

  const handlePromote = (id: number) =>
    requireSuper(() => {
      handleApiAction(() => adminUsersApi.grantAdmin(id), "admin.promote", "Admin granted");
    });

  const handleDemote = (id: number) =>
    requireSuper(() => {
      handleApiAction(() => adminUsersApi.revokeAdmin(id), "admin.demote", "Admin access removed");
    });

  const handleBan = (id: number) =>
    requireSuper(() => {
      const target = users.find((u) => u.id === id);
      const confirmed = window.confirm(`Ban ${target?.email ?? "this user"}? This disables access.`);
      if (!confirmed) return;
      handleApiAction(() => adminUsersApi.banUser(id), "user.ban", "User banned");
    });

  const handleRemoveSuper = (id: number) =>
    requireSuper(() => {
      handleApiAction(() => adminUsersApi.revokeSuperadmin(id), "superadmin.remove", "Superadmin access removed");
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Users</p>
          <h2 className="text-3xl font-serif font-bold text-white">Admin accounts</h2>
          <p className="text-sm text-gray-400 mt-1">Manage user roles and access.</p>
        </div>
      </div>

      <AdminUsers
        users={filteredUsers}
        search={userSearch}
        onSearchChange={setUserSearch}
        isSuperAdmin={isSuperAdmin}
        onPromote={handlePromote}
        onDemote={handleDemote}
        onBan={handleBan}
        onRemoveSuper={handleRemoveSuper}
      />
    </div>
  );
};
