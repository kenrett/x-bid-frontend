import clsx from "clsx";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string;
  children: React.ReactNode;
}

export const NavItem = ({ to, children }: NavItemProps) => {
  return (
    <li className="relative">
      <NavLink
        to={to}
        className={({ isActive }) => clsx(
          "block relative py-2 px-3 transition-all duration-300 ease-in-out",
          isActive ? "text-red-900 -translate-y-[5px]" : "text-gray-900 hover:text-blue-600"
        )}
      >
        {({ isActive }) => (
          <>
            {children}
            {isActive && <div className="absolute inset-0 bg-blue-600 rounded-md -z-10" />}
          </>
        )}
      </NavLink>
    </li>
  );
};
