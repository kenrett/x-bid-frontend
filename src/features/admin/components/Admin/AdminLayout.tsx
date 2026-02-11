import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Page } from "@components/Page";
import { ADMIN_PATHS } from "./adminPaths";

export const AdminLayout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Auctions", to: `/admin/${ADMIN_PATHS.auctions}` },
    { label: "Bid Packs", to: `/admin/${ADMIN_PATHS.bidPacks}` },
    { label: "Users", to: `/admin/${ADMIN_PATHS.users}` },
    { label: "Payments", to: `/admin/${ADMIN_PATHS.payments}` },
    { label: "Settings", to: `/admin/${ADMIN_PATHS.settings}` },
  ];

  return (
    <Page>
      <div className="container mx-auto">
        <div className="grid grid-cols-[240px_1fr] gap-8">
          <aside className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-5 flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)] mb-1">
                Signed in as
              </div>
              <div className="text-lg font-semibold text-[color:var(--sf-text)] truncate">
                {user?.name ?? "Admin"}
              </div>
              <div className="text-xs text-[color:var(--sf-mutedText)] truncate">
                {user?.email}
              </div>
            </div>
            <nav className="flex flex-col gap-2" aria-label="Admin navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[linear-gradient(90deg,var(--sf-primary),var(--sf-accent))] text-[color:var(--sf-onPrimary)] shadow-lg shadow-purple-500/30"
                        : "text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)] hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-auto text-sm font-medium text-[color:var(--sf-mutedText)] bg-white/10 hover:bg-white/20 border border-[color:var(--sf-border)] rounded-lg py-2 transition-colors"
            >
              Log Out
            </button>
          </aside>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
                  Admin Console
                </p>
                <h1 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
                  Control Center
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-[color:var(--sf-mutedText)]">
                  Welcome back
                </p>
                <p className="text-lg font-semibold text-[color:var(--sf-text)]">
                  {user?.name ?? "Admin"}
                </p>
              </div>
            </header>

            <div className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-6 shadow-lg shadow-purple-500/10">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
};
