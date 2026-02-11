import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsers } from "./AdminUsers";
import type { AdminUser } from "@features/admin/types/users";

const baseUsers: AdminUser[] = [
  {
    id: 1,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    status: "active",
    emailVerified: true,
    emailVerifiedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    email: "superadmin@example.com",
    name: "Super User",
    role: "superadmin",
    status: "active",
    emailVerified: true,
    emailVerifiedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    status: "active",
    emailVerified: false,
    emailVerifiedAt: null,
  },
];

describe("AdminUsers", () => {
  it("renders users and shows role/status/email badges", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onSuspend={vi.fn()}
        onUnsuspend={vi.fn()}
        onBan={vi.fn()}
        onVerifyEmail={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Super User")).toBeInTheDocument();
    expect(screen.getByText("Regular User")).toBeInTheDocument();
    expect(screen.getByText("superadmin")).toBeInTheDocument();
    expect(screen.getByText("unverified")).toBeInTheDocument();
  });

  it("shows superadmin-only role actions when allowed", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onSuspend={vi.fn()}
        onUnsuspend={vi.fn()}
        onBan={vi.fn()}
        onVerifyEmail={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.getByText("Remove superadmin")).toBeInTheDocument();
    expect(screen.getByText("Remove admin")).toBeInTheDocument();
    expect(screen.getByText("Grant admin")).toBeInTheDocument();
  });

  it("hides superadmin-only role actions for non-superadmins", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin={false}
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onSuspend={vi.fn()}
        onUnsuspend={vi.fn()}
        onBan={vi.fn()}
        onVerifyEmail={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.queryByText("Remove superadmin")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Grant admin")).not.toBeInTheDocument();
    expect(screen.getByText("Suspend user")).toBeInTheDocument();
    expect(screen.getByText("Mark email verified")).toBeInTheDocument();
  });

  it("fires callbacks on action click", async () => {
    const onSuspend = vi.fn();
    const onBan = vi.fn();
    const onVerifyEmail = vi.fn();
    const onRemoveSuper = vi.fn();
    const user = userEvent.setup();
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onSuspend={onSuspend}
        onUnsuspend={vi.fn()}
        onBan={onBan}
        onVerifyEmail={onVerifyEmail}
        onRemoveSuper={onRemoveSuper}
      />,
    );

    await user.click(screen.getByText("Suspend user"));
    expect(onSuspend).toHaveBeenCalledWith(3);

    await user.click(screen.getByText("Ban user"));
    expect(onBan).toHaveBeenCalledWith(3);

    await user.click(screen.getByText("Mark email verified"));
    expect(onVerifyEmail).toHaveBeenCalledWith(3);

    await user.click(screen.getByText("Remove superadmin"));
    expect(onRemoveSuper).toHaveBeenCalledWith(2);
  });

  it("invokes search change handler", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={onSearchChange}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onSuspend={vi.fn()}
        onUnsuspend={vi.fn()}
        onBan={vi.fn()}
        onVerifyEmail={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/search by name or email/i),
      "admin",
    );

    const values = onSearchChange.mock.calls.map((call) => call[0]);
    expect(values).toEqual(["a", "d", "m", "i", "n"]);
  });
});
