import logo from "../assets/xbid_logo.png";
import { useAuth } from "../hooks/useAuth";
import { Bars3Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { NavItem } from "./NavItem";
import { Link } from "react-router-dom";

const STRINGS = {
  GREETING: "Hello",
  LOG_OUT: "Log Out",
  SIGN_IN: "Sign In",
};

export function Header() {
  const navItems = [
    { name: "Auctions", href: "/auctions" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "About", href: "/about" },
  ];

  const { user, logout } = useAuth();
  return (
    <nav className={`bg-white border-gray-200`}>
      <div className={`max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4`}>
        <Link to="/" className={`flex items-center space-x-3 rtl:space-x-reverse`}>
          <img src={logo} alt="X-Bid Logo" className="h-36" />
        </Link>
        <button 
          data-collapse-toggle="navbar-default"
          type="button"
          className={`inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600`}
          aria-controls="navbar-default"
          aria-expanded="false"
        >
          <span className={`sr-only`}>Open main menu</span>
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div
          className="hidden w-full md:block md:w-auto"
          id="navbar-default"
        >
          <ul
            className={`font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:items-center md:space-x-2 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white`}
          >
            {navItems.map((item) => (
              <NavItem key={item.name} to={item.href}>
                {item.name}
              </NavItem>
            ))}

            <li className="md:ml-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 hidden lg:block">{user.email}</span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    {STRINGS.LOG_OUT}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {STRINGS.SIGN_IN}
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
