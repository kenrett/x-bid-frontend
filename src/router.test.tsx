import { describe, expect, it } from "vitest";
import { routes as routerRoutes } from "./router";
import { ADMIN_PATHS } from "@features/admin/components/Admin/adminPaths";

type RouteLike = {
  path?: string;
  children?: RouteLike[];
  element?: unknown;
  errorElement?: unknown;
  lazy?: unknown;
};

const routes = routerRoutes as unknown as RouteLike[];

const hasPath = (routes: readonly RouteLike[] | undefined, path: string) =>
  routes?.some((route) => route.path === path) ?? false;

describe("router configuration", () => {
  it("exposes the main public routes", () => {
    const root = routes[0];
    if (!root) throw new Error("Root route missing");
    const children = root.children;

    expect(hasPath(children, "/")).toBe(true);
    expect(hasPath(children, "/auctions")).toBe(true);
    expect(hasPath(children, "/auctions/:id")).toBe(true);
    expect(hasPath(children, "/login")).toBe(true);
    expect(hasPath(children, "/wallet")).toBe(true);
    expect(hasPath(children, "/signup")).toBe(true);
    expect(hasPath(children, "/account")).toBe(true);
    const accountRoute = children?.find((route) => route.path === "/account");
    const accountLayout = accountRoute?.children?.[0];
    const accountChildren = accountLayout?.children;
    expect(hasPath(accountChildren, "wallet")).toBe(true);
    expect(hasPath(accountChildren, "purchases")).toBe(true);
    expect(hasPath(accountChildren, "wins")).toBe(true);
    expect(hasPath(accountChildren, "activity")).toBe(true);
    expect(hasPath(accountChildren, "profile")).toBe(true);
    expect(hasPath(accountChildren, "security")).toBe(true);
    expect(hasPath(accountChildren, "sessions")).toBe(true);
    expect(hasPath(accountChildren, "notifications")).toBe(true);
    expect(hasPath(accountChildren, "data")).toBe(true);
    expect(hasPath(children, "/maintenance")).toBe(true);
    expect(hasPath(children, "/admin")).toBe(true);
    expect(root.errorElement).toBeTruthy();
  });

  it("protects admin routes behind AdminRoute and includes key admin pages", () => {
    const root = routes[0];
    if (!root) throw new Error("Root route missing");
    const adminRoute = root.children?.find((route) => route.path === "/admin");
    const adminLayout = adminRoute?.children?.[0];
    const adminChildren = adminLayout?.children;

    expect(adminRoute?.lazy).toBeTruthy();
    expect(hasPath(adminChildren, ADMIN_PATHS.auctions)).toBe(true);
    expect(hasPath(adminChildren, `${ADMIN_PATHS.auctions}/new`)).toBe(true);
    expect(hasPath(adminChildren, `${ADMIN_PATHS.auctions}/:id`)).toBe(true);
    expect(hasPath(adminChildren, `${ADMIN_PATHS.auctions}/:id/edit`)).toBe(
      true,
    );
    expect(hasPath(adminChildren, ADMIN_PATHS.bidPacks)).toBe(true);
    expect(hasPath(adminChildren, `${ADMIN_PATHS.bidPacks}/new`)).toBe(true);
    expect(hasPath(adminChildren, `${ADMIN_PATHS.bidPacks}/:id/edit`)).toBe(
      true,
    );
    expect(hasPath(adminChildren, ADMIN_PATHS.users)).toBe(true);
    expect(hasPath(adminChildren, ADMIN_PATHS.payments)).toBe(true);
    expect(hasPath(adminChildren, ADMIN_PATHS.settings)).toBe(true);
  });
});
