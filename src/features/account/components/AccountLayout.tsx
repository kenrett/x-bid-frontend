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
          <aside className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl p-5 flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)] mb-1">
                Signed in as
              </div>
              <div className="text-lg font-semibold text-[color:var(--sf-text)] truncate">
                {user?.name ?? "Player"}
              </div>
              <div className="text-xs text-[color:var(--sf-mutedText)] truncate">
                {user?.email}
              </div>
            </div>
            <nav
              className="flex flex-col gap-6"
              aria-label="Account navigation"
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <div className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
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
                              ? "bg-[linear-gradient(90deg,var(--sf-primary),var(--sf-accent))] text-[color:var(--sf-onPrimary)] shadow-lg shadow-purple-500/30"
                              : "text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)] hover:bg-white/10"
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
              className="mt-auto text-sm font-medium text-[color:var(--sf-mutedText)] bg-white/10 hover:bg-white/20 border border-[color:var(--sf-border)] rounded-lg py-2 transition-colors"
            >
              Log Out
            </button>
          </aside>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
                  Account
                </p>
                <h1 className="text-3xl font-serif font-bold text-[color:var(--sf-text)]">
                  Manage your account
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-[color:var(--sf-mutedText)]">
                  Credits
                </p>
                <p className="text-lg font-semibold text-[color:var(--sf-text)]">
                  {user?.bidCredits ?? "—"} bids
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
