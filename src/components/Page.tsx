import clsx from "clsx";

interface PageProps {
  children: React.ReactNode;
  centered?: boolean;
}

export const Page: React.FC<PageProps> = ({ children, centered = false }) => (
  <div
    className={clsx(
      "font-sans bg-[color:var(--sf-background)] text-[color:var(--sf-text)] antialiased min-h-screen px-4 py-12 md:py-20",
      { "text-center": centered },
    )}
  >
    {children}
  </div>
);
