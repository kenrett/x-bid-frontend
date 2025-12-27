import logo from "../../assets/biddersweet_logo.png";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { NavItem } from "../NavItem";
import { Link, useLocation } from "react-router-dom";
import { cva } from "class-variance-authority";
import { useEffect, useMemo, useState } from "react";

const STRINGS = {
  GREETING: "Hello",
  LOG_OUT: "Log Out",
  SIGN_IN: "Sign In",
  ADMIN_BANNER: "Admin mode active — actions affect live data.",
  SUPERADMIN_BANNER:
    "SUPERADMIN PRIVILEGES ACTIVE — CHANGES IMPACT THE ENTIRE PLATFORM.",
};

const variants = {
  nav: cva("border-b border-white/10 sticky top-0 z-50", {
    variants: {
      admin: {
        true: "bg-pink-600 top-0",
        false: "bg-[#0d0d1a]",
      },
    },
    defaultVariants: {
      admin: false,
    },
  }),
  adminBanner: cva("text-center text-sm py-2 px-4 sticky top-0 z-[60]", {
    variants: {
      super: {
        true: "bg-red-700 text-white shadow-[0_8px_30px_rgba(255,0,0,0.45)] border-b border-red-300",
        false:
          "bg-pink-700 text-white shadow-md shadow-pink-900/30 border-b border-pink-200/60",
      },
    },
    defaultVariants: {
      super: false,
    },
  }),
  container: cva(
    "max-w-screen-xl flex flex-wrap items-center justify-between mx-auto transition-all duration-300",
    {
      variants: {
        compact: {
          true: "py-1.5 px-4",
          false: "p-5",
        },
      },
      defaultVariants: {
        compact: false,
      },
    },
  ),
  logoLink: cva("relative flex items-center justify-center w-60 h-34"),
  logoSpotlight: cva(
    "absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_50%)] -z-0",
  ),
  logoImage: cva(
    "relative h-65 drop-shadow-[0_0_25px_rgba(255,105,180,0.8)] transition-transform duration-300 hover:scale-105",
  ),
  mobileMenuButton: cva(
    "inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-400 rounded-lg md:hidden hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500",
  ),
  navList: cva(
    "font-medium flex flex-col p-4 md:p-0 mt-4 border border-white/10 rounded-lg bg-[#0d0d1a] md:flex-row md:items-center md:space-x-2 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-[#0d0d1a]",
  ),
  logoutButton: cva(
    "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-300",
  ),
  signInLink: cva(
    "inline-block text-sm bg-[#ff69b4] text-[#1a0d2e] px-4 py-2 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20",
  ),
};

const NAV_ITEMS = [
  { name: "Auctions", href: "/auctions" },
  { name: "Buy Bids", href: "/buy-bids" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
];

export function Header() {
  const { user, logout, token } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superuser);
  const isAdmin = Boolean(user?.is_admin || isSuperAdmin);
  const apiBase = import.meta.env.VITE_API_URL;

  const apiDocsHref = useMemo(() => {
    try {
      const base = apiBase
        ? new URL("/api-docs", apiBase)
        : new URL("/api-docs", window.location.origin);
      if (token) base.searchParams.set("token", token);
      return base.toString();
    } catch {
      return token
        ? `/api-docs?token=${encodeURIComponent(token)}`
        : "/api-docs";
    }
  }, [apiBase, token]);

  const adminNavItems = useMemo(
    () =>
      isAdmin
        ? [
            { name: "Admin", href: "/admin/auctions" },
            { name: "API Docs", href: apiDocsHref },
          ]
        : [],
    [isAdmin, apiDocsHref],
  );
  const accountNavItems = useMemo(
    () =>
      user
        ? [
            { name: "The Vault", href: "/account/wallet" },
            { name: "Purchases", href: "/account/purchases" },
          ]
        : [],
    [user],
  );

  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={variants.nav({ admin: isAdmin })}>
      {isAdmin && (
        <div className={variants.adminBanner({ super: isSuperAdmin })}>
          {isSuperAdmin ? STRINGS.SUPERADMIN_BANNER : STRINGS.ADMIN_BANNER}
        </div>
      )}
      <div className={variants.container({ compact: isScrolled })}>
        <Link to="/" className={variants.logoLink()}>
          <div
            className={variants.logoSpotlight()}
            style={{ transform: "scale(3)" }}
          ></div>
          <img
            src={logo}
            alt="X-Bid Logo"
            className={`${variants.logoImage()} ${isScrolled ? "scale-90" : ""}`}
          />
        </Link>
        <button
          data-collapse-toggle="navbar-default"
          type="button"
          className={variants.mobileMenuButton()}
          aria-controls="navbar-default"
          aria-expanded="false"
        >
          <span className={`sr-only`}>Open main menu</span>
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div
          className="hidden w-full md:block md:w-auto animate-fadeInUp"
          id="navbar-default"
        >
          <ul className={variants.navList()}>
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.name} to={item.href}>
                {item.name}
              </NavItem>
            ))}
            {accountNavItems.map((item) => (
              <NavItem key={item.name} to={item.href}>
                {item.name}
              </NavItem>
            ))}
            {adminNavItems.map((item) => (
              <NavItem key={item.name} to={item.href}>
                {item.name}
              </NavItem>
            ))}
            {user ? (
              <>
                <li className="md:ml-4 flex items-center gap-4">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm text-white font-medium flex items-center gap-2">
                      {user.email}
                      {isAdmin && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${
                            isSuperAdmin
                              ? "bg-red-600 text-white border-red-300 shadow-[0_0_12px_rgba(255,0,0,0.6)]"
                              : "bg-white/10 text-white border-white/20"
                          }`}
                        >
                          {isSuperAdmin ? "Superadmin" : "Admin"}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-pink-400">
                      {user.bidCredits} Bids
                    </span>
                  </div>
                  <button onClick={logout} className={variants.logoutButton()}>
                    {STRINGS.LOG_OUT}
                  </button>
                </li>
              </>
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                className={variants.signInLink()}
              >
                {STRINGS.SIGN_IN}
              </Link>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
