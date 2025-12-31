import { NavLink, Outlet } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{ label: string; to: string; end?: boolean }>;
}> = [
  {
    title: "History",
    items: [
      { label: "Overview", to: "/account", end: true },
      { label: "Bid History", to: "/account/wallet" },
      { label: "My Activity", to: "/account/activity" },
      { label: "Purchases", to: "/account/purchases" },
      { label: "Won Auctions", to: "/account/wins" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", to: "/account/profile" },
      { label: "Security", to: "/account/security" },
      { label: "Sessions", to: "/account/sessions" },
      { label: "Notifications", to: "/account/notifications" },
      { label: "Data", to: "/account/data" },
    ],
  },
];

export const AccountLayout = () => {
  const { user, logout } = useAuth();

  return (
    <Page>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                Signed in as
              </div>
              <div className="text-lg font-semibold text-white truncate">
                {user?.name ?? "Player"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
            <nav
              className="flex flex-col gap-6"
              aria-label="Account navigation"
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <div className="text-xs uppercase tracking-wide text-gray-400">
                    {group.title}
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => (
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
                        end={item.end}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
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
                  Account
                </p>
                <h1 className="text-3xl font-serif font-bold text-white">
                  Manage your account
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Credits</p>
                <p className="text-lg font-semibold text-white">
                  {user?.bidCredits ?? "—"} bids
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
