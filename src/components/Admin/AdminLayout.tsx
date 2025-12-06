import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Page } from "../Page";
import { ADMIN_PATHS } from "./adminPaths";

const NAV_ITEMS = [
  { label: "Auctions", to: `/admin/${ADMIN_PATHS.auctions}` },
  { label: "Bid Packs", to: `/admin/${ADMIN_PATHS.bidPacks}` },
  { label: "Users", to: `/admin/${ADMIN_PATHS.users}` },
  { label: "Payments", to: `/admin/${ADMIN_PATHS.payments}` },
  { label: "Settings", to: `/admin/${ADMIN_PATHS.settings}` },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <Page>
      <div className="container mx-auto">
        <div className="grid grid-cols-[240px_1fr] gap-8">
          <aside className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                Signed in as
              </div>
              <div className="text-lg font-semibold text-white truncate">
                {user?.name ?? "Admin"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
            <nav className="flex flex-col gap-2" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-pink-500/70 to-purple-600/70 text-white shadow-lg shadow-purple-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-auto text-sm font-medium text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg py-2 transition-colors"
            >
              Log Out
            </button>
          </aside>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Admin Console
                </p>
                <h1 className="text-3xl font-serif font-bold text-white">
                  Control Center
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back</p>
                <p className="text-lg font-semibold text-white">
                  {user?.name ?? "Admin"}
                </p>
              </div>
            </header>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg shadow-purple-500/10">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
};
