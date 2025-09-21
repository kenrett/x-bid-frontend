import clsx from "clsx";

interface NavItemProps {
  href: string;
  isActive: boolean;
  onHover: () => void;
  children: React.ReactNode;
}

export const NavItem = ({ href, isActive, onHover, children }: NavItemProps) => {
  return (
    <li className="relative" onMouseEnter={onHover}>
      <a
        href={href}
        className={clsx(
          "block relative py-2 px-3 transition-all duration-300 ease-in-out",
          isActive ? "text-red-900 -translate-y-[5px]" : "text-gray-900 hover:text-blue-600"
        )}
      >
        {children}
      </a>
      {isActive && (
        <div className="absolute inset-0 bg-blue-600 rounded-md -z-10" />
      )}
    </li>
  );
};