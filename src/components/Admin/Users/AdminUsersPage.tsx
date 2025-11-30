import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/services/toast";
import { logAdminAction } from "@/services/adminAudit";
import type { AdminUser } from "./types";
import { AdminUsers } from "./AdminUsers";

const mockUsers: AdminUser[] = [
  { id: 1, email: "admin@example.com", name: "Admin User", role: "admin", status: "active" },
  { id: 2, email: "superadmin@example.com", name: "Super Admin", role: "superadmin", status: "active" },
];

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser);
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((candidate) =>
      candidate.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      candidate.name.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const requireSuper = (action: () => void) => {
    if (!isSuperAdmin) {
      showToast("Superadmin only action", "error");
      return;
    }
    action();
  };

  const updateUser = (id: number, updates: Partial<AdminUser>, action: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    logAdminAction(action, { id, ...updates });
  };

  const handlePromote = (id: number) =>
    requireSuper(() => {
      updateUser(id, { role: "admin", status: "active" }, "admin.promote");
      showToast("Admin granted", "success");
    });

  const handleDemote = (id: number) =>
    requireSuper(() => {
      updateUser(id, { role: "admin", status: "disabled" }, "admin.demote");
      showToast("Admin access removed", "success");
    });

  const handleBan = (id: number) =>
    requireSuper(() => {
      const target = users.find((u) => u.id === id);
      const confirmed = window.confirm(`Ban ${target?.email ?? "this user"}? This disables access.`);
      if (!confirmed) return;
      updateUser(id, { status: "disabled" }, "user.ban");
      showToast("User banned", "success");
    });

  const handleRemoveSuper = (id: number) =>
    requireSuper(() => {
      updateUser(id, { role: "admin", status: "disabled" }, "superadmin.remove");
      showToast("Superadmin access removed", "success");
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Users</p>
          <h2 className="text-3xl font-serif font-bold text-white">Admin accounts</h2>
          <p className="text-sm text-gray-400 mt-1">Placeholder data shown; wire to backend for real management.</p>
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
