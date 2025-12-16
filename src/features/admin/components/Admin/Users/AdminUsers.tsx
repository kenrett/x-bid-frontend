import type { ChangeEvent } from "react";
import type { AdminUser } from "@features/admin/types/users";

interface AdminUsersProps {
  users: AdminUser[];
  search: string;
  onSearchChange: (value: string) => void;
  isSuperAdmin: boolean;
  onPromote: (id: number) => void;
  onDemote: (id: number) => void;
  onBan: (id: number) => void;
  onRemoveSuper: (id: number) => void;
}

export const AdminUsers = ({
  users,
  search,
  onSearchChange,
  isSuperAdmin,
  onPromote,
  onDemote,
  onBan,
  onRemoveSuper,
}: AdminUsersProps) => {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white">Admin Users</h3>
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Search by name or email"
          className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {users.length === 0 ? (
          <div className="p-4 text-sm text-gray-300">No matching admins.</div>
        ) : (
          <table className="min-w-full text-sm text-gray-200">
            <thead className="bg-white/10 text-left uppercase text-xs tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((adminUser) => (
                <tr key={adminUser.id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-semibold text-white">
                    {adminUser.name}
                  </td>
                  <td className="px-4 py-3 text-gray-200">{adminUser.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        adminUser.role === "superadmin"
                          ? "bg-red-900 text-red-100 border border-red-300/40"
                          : "bg-white/10 text-gray-100 border border-white/20"
                      }`}
                    >
                      {adminUser.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        adminUser.status === "active"
                          ? "bg-green-900 text-green-100 border border-green-300/30"
                          : "bg-gray-700 text-gray-200 border border-gray-400/30"
                      }`}
                    >
                      {adminUser.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {isSuperAdmin && adminUser.role === "superadmin" && (
                      <button
                        onClick={() => onRemoveSuper(adminUser.id)}
                        className="text-sm text-amber-200 hover:text-amber-100 underline underline-offset-2"
                      >
                        Remove superadmin
                      </button>
                    )}
                    {isSuperAdmin &&
                      adminUser.role !== "superadmin" &&
                      adminUser.role !== "admin" && (
                        <button
                          onClick={() => onPromote(adminUser.id)}
                          className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-2"
                        >
                          Grant admin
                        </button>
                      )}
                    {isSuperAdmin && adminUser.role === "admin" && (
                      <button
                        onClick={() => onDemote(adminUser.id)}
                        className="text-sm text-amber-200 hover:text-amber-100 underline underline-offset-2"
                      >
                        Remove admin
                      </button>
                    )}
                    {isSuperAdmin && adminUser.role !== "superadmin" && (
                      <button
                        onClick={() => onBan(adminUser.id)}
                        className="text-sm text-red-300 hover:text-red-200 underline underline-offset-2"
                      >
                        Ban user
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
