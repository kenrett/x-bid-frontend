import type { StorefrontKey } from "../storefront/storefront";
import { STOREFRONT_CONFIGS } from "../storefront/storefront";

type Props = {
  storefrontKey?: StorefrontKey | null;
  className?: string;
};

export const StorefrontBadge = ({ storefrontKey, className = "" }: Props) => {
  if (!storefrontKey) return null;
  const config = STOREFRONT_CONFIGS[storefrontKey];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] text-[color:var(--sf-mutedText)] shadow-[var(--sf-shadow)] ${className}`}
      title={config.name}
      aria-label={`Storefront: ${config.name}`}
    >
      {config.badgeLabel}
    </span>
  );
};
