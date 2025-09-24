import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { cva } from "class-variance-authority";

interface NavItemProps {
  to: string;
  children: React.ReactNode;
}

const navLink = cva(
  "block relative py-2 px-3 transition-all duration-300 ease-in-out font-medium",
  {
    variants: {
      isActive: {
        true: "text-[#1a0d2e] -translate-y-[5px]",
        false: "text-gray-300 hover:text-pink-400",
      },
    },
  }
);

export const NavItem = ({ to, children }: NavItemProps) => {
  return (
    <li className="relative">
      <NavLink
        to={to}
        className={({ isActive }) => clsx(navLink({ isActive }))}
      >
        {({ isActive }) => (
          <>
            {children}
            {isActive && <div className="absolute inset-0 bg-[#ff69b4] rounded-md -z-10" />}
          </>
        )}
      </NavLink>
    </li>
  );
};
