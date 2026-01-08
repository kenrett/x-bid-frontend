import { Link } from "react-router-dom";
import { cva } from "class-variance-authority";

const STRINGS = {
  COPYRIGHT: `© ${new Date().getFullYear()} X-Bid. All Rights Reserved.`,
};

const variants = {
  footer: cva(
    "bg-[color:var(--sf-background)] border-t border-[color:var(--sf-border)] text-[color:var(--sf-mutedText)]",
  ),
  container: cva("max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8"),
  mainSection: cva("md:flex md:justify-between"),
  logoAndBrand: cva("mb-6 md:mb-0"),
  logoLink: cva("flex items-center"),
  logoImage: cva("h-8 mr-3"),
  logoText: cva(
    "self-center text-2xl font-semibold whitespace-nowrap text-[color:var(--sf-text)]",
  ),
  navGrid: cva("grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3"),
  navCategoryTitle: cva(
    "mb-6 text-sm font-semibold text-[color:var(--sf-text)] uppercase",
  ),
  navList: cva("text-[color:var(--sf-mutedText)]"),
  navListItem: cva("mb-4"),
  navLink: cva("hover:text-[color:var(--sf-primary)] transition-colors"),
  bottomSection: cva(
    "mt-8 pt-8 border-t border-[color:var(--sf-border)] sm:flex sm:items-center sm:justify-between",
  ),
  copyright: cva("text-sm text-[color:var(--sf-mutedText)] sm:text-center"),
};

export function Footer() {
  const navLinks = [
    { name: "Auctions", href: "/auctions" },
    { name: "Buy Bids", href: "/buy-bids" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "About", href: "/about" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-and-conditions" },
  ];

  return (
    <footer className={variants.footer()}>
      <div className={variants.container()}>
        <div className={variants.mainSection()}>
          <div className={variants.navGrid()}>
            <div>
              <h2 className={variants.navCategoryTitle()}>Navigation</h2>
              <ul className={variants.navList()}>
                {navLinks.map((item) => (
                  <li key={item.name} className={variants.navListItem()}>
                    <Link to={item.href} className={variants.navLink()}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={variants.navCategoryTitle()}>Legal</h2>
              <ul className={variants.navList()}>
                {legalLinks.map((item) => (
                  <li key={item.name} className={variants.navListItem()}>
                    <Link to={item.href} className={variants.navLink()}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className={variants.bottomSection()}>
          <span className={variants.copyright()}>{STRINGS.COPYRIGHT}</span>
        </div>
      </div>
    </footer>
  );
}
