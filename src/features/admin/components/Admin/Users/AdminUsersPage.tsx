import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@services/toast";
import { logAdminAction } from "@features/admin/api/adminAudit";
import type { AdminUser } from "@features/admin/types/users";
import { AdminUsers } from "./AdminUsers";
import { adminUsersApi } from "@features/admin/api/adminUsersApi";

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin || user?.is_superuser);
  const isSuperAdmin = Boolean(user?.is_superuser);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const scope = isSuperAdmin
      ? list
      : list.filter((candidate) => candidate.role === "user");
    const term = userSearch.toLowerCase();

    return scope.filter(
      (candidate) =>
        candidate.email.toLowerCase().includes(term) ||
        candidate.name.toLowerCase().includes(term),
    );
  }, [isSuperAdmin, users, userSearch]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    const fetchUsers = async () => {
      try {
        const data = await adminUsersApi.getUsers();
        if (mounted) setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showToast(`Could not load users: ${message}`, "error");
      }
    };

    void fetchUsers();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const requireAdmin = (action: () => void) => {
    if (!isAdmin) {
      showToast("Admin only action", "error");
      return;
    }
    action();
  };

  const requireSuper = (action: () => void) => {
    if (!isSuperAdmin) {
      showToast("Superadmin only action", "error");
      return;
    }
    action();
  };

  const updateUserInState = (updatedUser: AdminUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    );
  };

  const handleApiAction = async (
    action: () => Promise<AdminUser>,
    log: string,
    successMessage: string,
  ) => {
    try {
      const updatedUser = await action();
      updateUserInState(updatedUser);
      logAdminAction(log, { id: updatedUser.id });
      showToast(successMessage, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Action failed: ${message}`, "error");
    }
  };

  const handlePromote = (id: number) =>
    requireSuper(() => {
      handleApiAction(
        () => adminUsersApi.grantAdmin(id),
        "admin.promote",
        "Admin granted",
      );
    });

  const handleDemote = (id: number) =>
    requireSuper(() => {
      handleApiAction(
        () => adminUsersApi.revokeAdmin(id),
        "admin.demote",
        "Admin access removed",
      );
    });

  const handleBan = (id: number) =>
    requireAdmin(() => {
      const target = users.find((u) => u.id === id);
      if (target?.role !== "user") {
        showToast("Only non-admin users can be banned here", "error");
        return;
      }
      const confirmed = window.confirm(
        `Ban ${target?.email ?? "this user"}? This disables access.`,
      );
      if (!confirmed) return;
      handleApiAction(
        () => adminUsersApi.banUser(id),
        "user.ban",
        "User banned",
      );
    });

  const handleSuspend = (id: number) =>
    requireAdmin(() => {
      const target = users.find((u) => u.id === id);
      if (target?.role !== "user") {
        showToast("Only non-admin users can be suspended here", "error");
        return;
      }
      handleApiAction(
        () => adminUsersApi.suspendUser(id),
        "user.suspend",
        "User suspended",
      );
    });

  const handleUnsuspend = (id: number) =>
    requireAdmin(() => {
      const target = users.find((u) => u.id === id);
      if (target?.role !== "user") {
        showToast("Only non-admin users can be unsuspended here", "error");
        return;
      }
      handleApiAction(
        () => adminUsersApi.unsuspendUser(id),
        "user.unsuspend",
        "User unsuspended",
      );
    });

  const handleVerifyEmail = (id: number) =>
    requireAdmin(() => {
      const target = users.find((u) => u.id === id);
      if (target?.role !== "user") {
        showToast("Only non-admin users can be verified here", "error");
        return;
      }
      handleApiAction(
        () => adminUsersApi.verifyEmail(id),
        "user.verify_email",
        "Email marked verified",
      );
    });

  const handleRemoveSuper = (id: number) =>
    requireSuper(() => {
      handleApiAction(
        () => adminUsersApi.revokeSuperadmin(id),
        "superadmin.remove",
        "Superadmin access removed",
      );
    });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Users
          </p>
          <h2 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
            User accounts
          </h2>
          <p className="text-sm text-[color:var(--sf-mutedText)] mt-1">
            Admin-only page.
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-4 text-[color:var(--sf-mutedText)]">
          <p className="font-semibold text-[color:var(--sf-text)]">
            Access denied
          </p>
          <p className="text-sm text-[color:var(--sf-mutedText)] mt-1">
            You don&apos;t have permission to view user management.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/admin"
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-[color:var(--sf-text)] transition-colors"
            >
              Back to admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Users
          </p>
          <h2 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
            User accounts
          </h2>
          <p className="text-sm text-[color:var(--sf-mutedText)] mt-1">
            Manage user access and account states.
          </p>
        </div>
      </div>

      <AdminUsers
        users={filteredUsers}
        search={userSearch}
        onSearchChange={setUserSearch}
        isSuperAdmin={isSuperAdmin}
        onPromote={handlePromote}
        onDemote={handleDemote}
        onSuspend={handleSuspend}
        onUnsuspend={handleUnsuspend}
        onBan={handleBan}
        onVerifyEmail={handleVerifyEmail}
        onRemoveSuper={handleRemoveSuper}
      />
    </div>
  );
};
