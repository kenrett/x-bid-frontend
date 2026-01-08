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
        true: "text-[color:var(--sf-onPrimary)] -translate-y-[2px] drop-shadow-sm",
        false:
          "text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-text)]",
      },
    },
  },
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
            {isActive && (
              <div className="absolute inset-0 bg-[color:var(--sf-primary)] rounded-[var(--sf-radius)] -z-10 shadow-[var(--sf-shadow)]" />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
};
