import clsx from "clsx";

interface PageProps {
  children: React.ReactNode;
  centered?: boolean;
}

export const Page: React.FC<PageProps> = ({ children, centered = false }) => (
  <div
    className={clsx(
      "font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen px-4 py-12 md:py-20",
      { "text-center": centered },
    )}
  >
    {children}
  </div>
);
