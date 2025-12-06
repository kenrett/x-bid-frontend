import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsers } from "./AdminUsers";
import type { AdminUser } from "./types";

const baseUsers: AdminUser[] = [
  {
    id: 1,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    email: "superadmin@example.com",
    name: "Super User",
    role: "superadmin",
    status: "active",
  },
  {
    id: 3,
    email: "user@example.com",
    name: "Regular User",
    role: "admin",
    status: "disabled",
  },
];

describe("AdminUsers", () => {
  it("renders users and shows role/status badges", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onBan={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Super User")).toBeInTheDocument();
    expect(screen.getByText("superadmin")).toBeInTheDocument();
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
  });

  it("shows superadmin-only actions when allowed", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onBan={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.getByText("Remove superadmin")).toBeInTheDocument();
    expect(screen.getAllByText("Remove admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ban user").length).toBeGreaterThan(0);
  });

  it("hides action buttons when not superadmin", () => {
    render(
      <AdminUsers
        users={baseUsers}
        search=""
        onSearchChange={() => {}}
        isSuperAdmin={false}
        onPromote={vi.fn()}
        onDemote={vi.fn()}
        onBan={vi.fn()}
        onRemoveSuper={vi.fn()}
      />,
    );

    expect(screen.queryByText("Remove superadmin")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Ban user")).not.toBeInTheDocument();
    expect(screen.queryByText("Grant admin")).not.toBeInTheDocument();
  });

  it("fires callbacks on action click", async () => {
    const onBan = vi.fn();
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
        onBan={onBan}
        onRemoveSuper={onRemoveSuper}
      />,
    );

    await user.click(screen.getAllByText("Ban user")[0]);
    expect(onBan).toHaveBeenCalled();

    await user.click(screen.getByText("Remove superadmin"));
    expect(onRemoveSuper).toHaveBeenCalled();
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
        onBan={vi.fn()}
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
